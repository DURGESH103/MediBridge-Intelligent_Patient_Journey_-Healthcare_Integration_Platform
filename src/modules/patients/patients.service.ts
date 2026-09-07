import { patientsRepository } from './patients.repository';
import { CreatePatientInput, Patient, UpdatePatientInput } from './patients.types';
import { journeyEventRepository } from '../journey/journeyEvent.repository';
import { ApiError } from '../../utils/ApiError';

export const patientsService = {
  async registerPatient(input: CreatePatientInput): Promise<Patient> {
    // App-level pre-check gives a fast, friendly rejection in the common
    // case; the DB unique constraint (migration 008) is the final guard
    // against two concurrent requests both passing this check.
    const duplicate = await patientsRepository.findPotentialDuplicate(input.phone, input.dateOfBirth);
    if (duplicate) {
      throw ApiError.conflict(
        `A patient with this phone number and date of birth is already registered (patient code ${duplicate.patientCode})`,
        [duplicate.patientCode]
      );
    }

    try {
      const patient = await patientsRepository.create(input);
      await journeyEventRepository.record(patient.id, 'REGISTRATION', 'Patient registered with MediBridge');
      return patient;
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'ER_DUP_ENTRY') {
        throw ApiError.conflict('A patient with this phone number and date of birth is already registered');
      }
      throw error;
    }
  },

  async getPatientById(id: number): Promise<Patient> {
    const patient = await patientsRepository.findById(id);
    if (!patient) {
      throw ApiError.notFound('Patient not found');
    }
    return patient;
  },

  async getPatientByUserId(userId: number): Promise<Patient> {
    const patient = await patientsRepository.findByUserId(userId);
    if (!patient) {
      throw ApiError.notFound('No patient profile is linked to this account');
    }
    return patient;
  },

  async updatePatient(id: number, input: UpdatePatientInput): Promise<Patient> {
    const existing = await patientsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Patient not found');
    }
    const updated = await patientsRepository.update(id, input);
    if (!updated) {
      throw ApiError.notFound('Patient not found');
    }
    return updated;
  },

  async searchPatients(term: string, page: number, pageSize: number): Promise<Patient[]> {
    const offset = (page - 1) * pageSize;
    return patientsRepository.search(term, pageSize, offset);
  },
};
