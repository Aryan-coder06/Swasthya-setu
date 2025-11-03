# Portal Backend Feature Overview

This document summarises the production-focused backend features that power the doctor and patient portals after the latest iteration, and highlights the manual checks needed to keep the flows healthy.

## Authentication & Hospital Binding
- Doctors and receptionists must now associate with a hospital at signup/login. The Supabase profiles store `hospital_id` and a denormalised `hospital_name`.
- `/auth/hospitals` serves a lightweight directory (`id`, `name`, `city`, `state`) for the auth UI dropdown.
- Sign-in endpoints (`/auth/signin/doctor`, `/auth/signin/receptionist`) validate the submitted `hospitalId` against the stored profile and return hospital metadata in the `user` payload.
- Migration script: `backend/sql/2024-appointments-hospital-updates.sql` adds the new columns and ensures referential integrity.

## Doctor Portal Backend
- `/api/doctor/directory/list` exposes a trimmed directory (id, full name, specialty, hospital) for patient-side selectors.
- Appointment lifecycle:
  - `start_at`, `end_at`, and `duration_minutes` columns support precise scheduling.
  - `createDoctorAppointment` blocks overlapping slots (15-minute windows by default) and generates Jitsi links for video visits.
  - `getDoctorAppointments` auto-completes appointments whose `end_at` is older than the current time to keep dashboards tidy.
- Supporting queries (`/api/doctor/:doctorId/appointments`, `/patients`, `/records`, `/consultations`) all consume the same lifecycle-aware data.

## Patient Portal Backend
- `/patient/appointments/list` returns the patient’s appointments joined with doctor profile data and signed meeting links when available.
- `/patient/appointments/book` validates the requested slot (doctor, date, time), enforces the 15-minute grid, and prevents double-booking across active statuses.
- Existing prescription report endpoints continue to rely on Supabase Storage, unchanged by this iteration.

## Supabase Data Notes
- Ensure `public.hospitals` contains accurate metadata; hospital names are denormalised into staff profiles for quick reads.
- Appointment indices (`idx_appointments_doctor_start`, `idx_appointments_patient_start`) keep schedule lookups fast even with large datasets.
- Backfill query in the SQL script converts legacy rows (`appointment_date`, `appointment_time`) into the new timestamp columns.

## Manual Verification Checklist
1. **Auth flows**: Sign up and sign in a doctor/receptionist; verify the hospital dropdown appears, selection is required, and the response payload contains `hospitalId`.
2. **Doctor slot management**: From the doctor portal, create overlapping appointments and confirm the API blocks conflicts; watch past appointments transition to `completed` automatically.
3. **Patient booking**: Use the patient portal to book against the same doctor/date and ensure the 15-minute slot list hides occupied or past times.
4. **Data sync**: Inspect Supabase tables (`Doctor_Profile`, `receptionist_profile`, `appointments`) to confirm hospital columns and timestamps populate correctly.
5. **Directory endpoints**: Hit `/auth/hospitals` and `/api/doctor/directory/list` to confirm they respond quickly (<200 ms) and include expected records.
