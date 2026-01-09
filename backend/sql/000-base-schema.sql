-- Base schema for Swasthya Setu (create before running other migrations)
-- Safe to run multiple times due to IF NOT EXISTS guards.

create extension if not exists "uuid-ossp";

create table if not exists public.hospitals (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  city text,
  state text,
  postal_code text,
  phone text,
  latitude double precision,
  longitude double precision,
  rating numeric(3,2),
  review_count integer,
  type text,
  consultation_fee_min integer,
  consultation_fee_max integer,
  specialties text[],
  facilities text[],
  beds_total integer,
  beds_available integer,
  opening_hours text,
  image_url text,
  healthcare_speciality text[],
  healthcare text[],
  source text,
  addr_district_en text,
  addr_block text,
  created_at timestamptz not null default now()
);

create table if not exists public."Patient_Profile" (
  id uuid primary key,
  firstName text,
  lastName text,
  email text,
  gender text,
  phone_no text,
  age integer,
  docs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public."Doctor_Profile" (
  id uuid primary key,
  firstName text,
  lastName text,
  email text,
  specs text,
  gender text,
  age integer,
  phone_no text,
  bio text,
  hospital_id uuid references public.hospitals(id) on delete set null,
  hospital_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.receptionist_profile (
  id uuid primary key,
  firstname text,
  lastname text,
  email text,
  gender text,
  phone_no text,
  age integer,
  hospital_id uuid references public.hospitals(id) on delete set null,
  hospital_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references public."Doctor_Profile"(id) on delete set null,
  patient_id uuid references public."Patient_Profile"(id) on delete set null,
  patient_name text,
  appointment_date date,
  appointment_time text,
  start_at timestamptz,
  end_at timestamptz,
  duration_minutes integer default 15,
  status text,
  meeting_link text,
  created_at timestamptz not null default now()
);

create table if not exists public.prescriptions (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references public."Doctor_Profile"(id) on delete set null,
  patient_id uuid references public."Patient_Profile"(id) on delete set null,
  medications jsonb,
  notes text,
  ai_analysis jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public."Prescription_Reports" (
  id uuid primary key,
  patient_id uuid references public."Patient_Profile"(id) on delete set null,
  summary_header text,
  doctor_name text,
  patient_name text,
  date_issued text,
  report jsonb,
  raw_extracted_data jsonb,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.walkin_tickets (
  id uuid primary key default uuid_generate_v4(),
  ticket_number text not null,
  patient_name text,
  status text,
  hospital_id uuid references public.hospitals(id) on delete set null,
  receptionist_id uuid references public.receptionist_profile(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (hospital_id, ticket_number)
);

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null,
  patient_name text,
  amount numeric,
  services jsonb,
  status text,
  hospital_id uuid references public.hospitals(id) on delete set null,
  receptionist_id uuid references public.receptionist_profile(id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (hospital_id, invoice_number)
);

create table if not exists public.bed_management (
  id uuid primary key default uuid_generate_v4(),
  hospital_id uuid references public.hospitals(id) on delete set null,
  ward_name text,
  total integer,
  occupied integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admissions (
  id uuid primary key default uuid_generate_v4(),
  patient_name text,
  ward_id uuid references public.bed_management(id) on delete set null,
  hospital_id uuid references public.hospitals(id) on delete set null,
  admission_date timestamptz not null default now()
);

create table if not exists public.appointment_requests (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public."Patient_Profile"(id) on delete set null,
  patient_name text,
  hospital_id uuid references public.hospitals(id) on delete set null,
  hospital_name text,
  doctor_id uuid references public."Doctor_Profile"(id) on delete set null,
  preferred_specialty text,
  preferred_date date,
  preferred_time text,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled')),
  receptionist_id uuid references public.receptionist_profile(id) on delete set null,
  notes text,
  decline_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  response_at timestamptz,
  appointment_date date,
  appointment_time text,
  appointment_id uuid references public.appointments(id) on delete set null
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_role text not null check (recipient_role in ('patient','doctor','receptionist')),
  recipient_id uuid not null,
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  status text not null default 'unread' check (status in ('unread','read','dismissed')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
