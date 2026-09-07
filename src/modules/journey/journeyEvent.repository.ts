import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { JourneyEvent, JourneyEventType } from './journeyEvent.types';

interface JourneyEventRow extends RowDataPacket {
  id: number;
  patient_id: number;
  appointment_id: number | null;
  event_type: JourneyEventType;
  description: string;
  occurred_at: Date;
}

function mapRow(row: JourneyEventRow): JourneyEvent {
  return {
    id: row.id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    eventType: row.event_type,
    description: row.description,
    occurredAt: row.occurred_at,
  };
}

export const journeyEventRepository = {
  async record(
    patientId: number,
    eventType: JourneyEventType,
    description: string,
    appointmentId: number | null = null
  ): Promise<void> {
    await query<ResultSetHeader>(
      `INSERT INTO journey_events (patient_id, appointment_id, event_type, description)
       VALUES (:patientId, :appointmentId, :eventType, :description)`,
      { patientId, appointmentId, eventType, description }
    );
  },

  async findByAppointment(appointmentId: number): Promise<JourneyEvent[]> {
    const rows = await query<JourneyEventRow[]>(
      'SELECT * FROM journey_events WHERE appointment_id = :appointmentId ORDER BY occurred_at ASC',
      { appointmentId }
    );
    return rows.map(mapRow);
  },

  async findByPatient(patientId: number): Promise<JourneyEvent[]> {
    const rows = await query<JourneyEventRow[]>(
      'SELECT * FROM journey_events WHERE patient_id = :patientId ORDER BY occurred_at DESC',
      { patientId }
    );
    return rows.map(mapRow);
  },
};
