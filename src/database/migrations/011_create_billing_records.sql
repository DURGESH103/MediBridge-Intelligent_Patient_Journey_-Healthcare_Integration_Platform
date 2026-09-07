-- One billing record per consultation, created automatically when the
-- consultation completes (see consultation.service.ts) so BILLING_STAFF has
-- a real, database-backed queue of visits to collect payment for.
CREATE TABLE billing_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT NOT NULL,
  consultation_id INT NOT NULL,
  amount DECIMAL(10, 2) NULL,
  status ENUM('PENDING', 'PAID') NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_billing_records_consultation (consultation_id),
  KEY idx_billing_records_status (status),
  KEY idx_billing_records_patient (patient_id),
  CONSTRAINT fk_billing_records_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
  CONSTRAINT fk_billing_records_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id),
  CONSTRAINT fk_billing_records_consultation FOREIGN KEY (consultation_id) REFERENCES consultations (id)
) ENGINE = InnoDB;
