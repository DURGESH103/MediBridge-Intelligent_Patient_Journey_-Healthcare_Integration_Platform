CREATE TABLE lab_test_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT NOT NULL,
  patient_id INT NOT NULL,
  test_name VARCHAR(200) NOT NULL,
  status ENUM('REQUESTED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED') NOT NULL DEFAULT 'REQUESTED',
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sample_collected_at TIMESTAMP NULL DEFAULT NULL,
  processing_started_at TIMESTAMP NULL DEFAULT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_lab_test_requests_consultation_id (consultation_id),
  KEY idx_lab_test_requests_patient_id (patient_id, status),
  CONSTRAINT fk_lab_test_requests_consultation FOREIGN KEY (consultation_id) REFERENCES consultations (id),
  CONSTRAINT fk_lab_test_requests_patient FOREIGN KEY (patient_id) REFERENCES patients (id)
) ENGINE = InnoDB;

CREATE TABLE lab_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_test_request_id INT NOT NULL,
  result_summary TEXT NOT NULL,
  report_file_url VARCHAR(500) NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lab_reports_request (lab_test_request_id),
  CONSTRAINT fk_lab_reports_request FOREIGN KEY (lab_test_request_id) REFERENCES lab_test_requests (id)
) ENGINE = InnoDB;
