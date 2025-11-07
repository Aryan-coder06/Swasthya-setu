-- Create appointment_requests table to capture patient requests that require receptionist triage
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

create index if not exists idx_appointment_requests_hospital_status
  on public.appointment_requests (hospital_id, status);

create index if not exists idx_appointment_requests_patient
  on public.appointment_requests (patient_id);

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

create index if not exists idx_notifications_recipient
  on public.notifications (recipient_id, recipient_role, status);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_appointment_requests on public.appointment_requests;
create trigger trg_touch_appointment_requests
before update on public.appointment_requests
for each row
execute function public.touch_updated_at();
