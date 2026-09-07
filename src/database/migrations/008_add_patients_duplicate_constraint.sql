-- Closes the race condition in the app-level duplicate check
-- (patientsService.registerPatient): two concurrent requests for the same
-- phone + date_of_birth could both pass the pre-insert SELECT check before
-- either commits. This constraint makes the database the final authority,
-- matching the same defense-in-depth pattern already used for double-booking
-- appointments (see uq_appointments_doctor_slot in migration 002).
ALTER TABLE patients
  ADD UNIQUE KEY uq_patients_phone_dob (phone, date_of_birth);
