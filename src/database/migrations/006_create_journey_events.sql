CREATE TABLE journey_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT NULL,
  event_type VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_journey_events_patient_id (patient_id, occurred_at),
  KEY idx_journey_events_appointment_id (appointment_id, occurred_at),
  CONSTRAINT fk_journey_events_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
  CONSTRAINT fk_journey_events_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id)
) ENGINE = InnoDB;
