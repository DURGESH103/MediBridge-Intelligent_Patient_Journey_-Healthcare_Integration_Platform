-- ADMIN, RECEPTIONIST, LAB_STAFF, and BILLING_STAFF have no linked profile
-- table (unlike PATIENT -> patients, DOCTOR -> doctors), so there was
-- nowhere to store their name at all. Nullable because existing accounts
-- predate this column; each user can set their own via PATCH /auth/me.
ALTER TABLE users
  ADD COLUMN full_name VARCHAR(150) NULL AFTER email;
