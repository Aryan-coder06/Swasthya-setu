create table if not exists public.family_members (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public."Patient_Profile"(id) on delete cascade,
  full_name text not null,
  relation text,
  age integer,
  gender text,
  blood_group text,
  phone text,
  email text,
  medical_history text[],
  allergies text[],
  emergency_contact boolean default false,
  last_checkup date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_family_members_patient on public.family_members (patient_id);

create or replace function public.touch_family_members_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_family_members on public.family_members;
create trigger trg_touch_family_members
before update on public.family_members
for each row
execute function public.touch_family_members_updated_at();
