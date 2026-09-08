-- Records how a bill was actually paid. payment_reference holds only
-- non-sensitive summary data (e.g. a UPI transaction id, or "Visa •••• 4242"
-- for card) - never a full card number or CVV, which this app never
-- receives on the backend at all.
ALTER TABLE billing_records
  ADD COLUMN payment_method ENUM('CASH', 'UPI', 'CARD') NULL AFTER status,
  ADD COLUMN payment_reference VARCHAR(255) NULL AFTER payment_method;
