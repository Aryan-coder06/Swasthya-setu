-- Link doctors and receptionists to hospitals
alter table public."Doctor_Profile"
  add column if not exists hospital_id uuid references public.hospitals (id) on delete set null,
  add column if not exists hospital_name text;

alter table public.receptionist_profile
  add column if not exists hospital_id uuid references public.hospitals (id) on delete set null,
  add column if not exists hospital_name text;

-- Optional: sync stored hospital names with current hospital table
update public."Doctor_Profile" dp
set hospital_name = h.name
from public.hospitals h
where dp.hospital_id = h.id
  and coalesce(dp.hospital_name, '') <> coalesce(h.name, '');

update public.receptionist_profile rp
set hospital_name = h.name
from public.hospitals h
where rp.hospital_id = h.id
  and coalesce(rp.hospital_name, '') <> coalesce(h.name, '');

-- Extend appointments with lifecycle metadata
alter table public.appointments
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists duration_minutes integer default 15;

create index if not exists idx_appointments_doctor_start on public.appointments (doctor_id, start_at);
create index if not exists idx_appointments_patient_start on public.appointments (patient_id, start_at);

-- Backfill missing timestamps using stored date & time (assumes appointment_date is date and appointment_time is time/text)
update public.appointments
set
  start_at = coalesce(
    start_at,
    case
      when appointment_date is not null and appointment_time is not null then
        (appointment_date::date + appointment_time::time)
      when appointment_date is not null then appointment_date::timestamp
      else null
    end
  ),
  duration_minutes = coalesce(duration_minutes, 15),
  end_at = coalesce(
    end_at,
    case
      when appointment_date is not null and appointment_time is not null then
        (appointment_date::date + appointment_time::time) + interval '15 minutes'
      when appointment_date is not null then appointment_date::timestamp + interval '15 minutes'
      else null
    end
  )
where start_at is null or end_at is null or duration_minutes is null;
