import { doctorRepository } from './doctor.repository';
import { departmentRepository } from './department.repository';
import { CreateDoctorInput, Doctor, DoctorAvailability, SetAvailabilityInput, UpdateDoctorInput } from './doctor.types';
import { usersRepository } from '../users/users.repository';
import { toSafeUser } from '../users/users.service';
import { SafeUser } from '../users/users.types';
import { UserRole } from '../../types/roles';
import { ApiError } from '../../utils/ApiError';
import { hashPassword } from '../../utils/password';
import { logger } from '../../config/logger';

export interface RegisterDoctorInput {
  email: string;
  password: string;
  departmentId: number;
  fullName: string;
  specialization: string;
  qualification?: string | null;
  phone?: string | null;
  consultationFee?: number | null;
  averageConsultationMinutes?: number;
}

export const doctorService = {
  async registerDoctor(input: RegisterDoctorInput): Promise<{ doctor: Doctor; user: SafeUser }> {
    const department = await departmentRepository.findById(input.departmentId);
    if (!department) {
      throw ApiError.badRequest('The selected department does not exist');
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await usersRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw ApiError.conflict('A user with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.create({
      email: normalizedEmail,
      fullName: input.fullName,
      passwordHash,
      role: UserRole.DOCTOR,
    });

    try {
      const doctor = await doctorRepository.create({
        userId: user.id,
        departmentId: input.departmentId,
        fullName: input.fullName,
        specialization: input.specialization,
        qualification: input.qualification,
        phone: input.phone,
        consultationFee: input.consultationFee,
        averageConsultationMinutes: input.averageConsultationMinutes,
      } as CreateDoctorInput);
      return { doctor, user: toSafeUser(user) };
    } catch (error) {
      await usersRepository.delete(user.id).catch((cleanupError) => {
        logger.error(`Failed to roll back user ${user.id} after doctor creation failure: ${cleanupError}`);
      });
      throw error;
    }
  },

  async getDoctorById(id: number): Promise<Doctor> {
    const doctor = await doctorRepository.findById(id);
    if (!doctor) {
      throw ApiError.notFound('Doctor not found');
    }
    return doctor;
  },

  async getDoctorByUserId(userId: number): Promise<Doctor> {
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw ApiError.notFound('No doctor profile is linked to this account');
    }
    return doctor;
  },

  async listDoctors(departmentId?: number): Promise<Doctor[]> {
    return doctorRepository.findAll(departmentId);
  },

  async updateDoctor(id: number, input: UpdateDoctorInput): Promise<Doctor> {
    const existing = await doctorRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Doctor not found');
    }
    if (input.departmentId) {
      const department = await departmentRepository.findById(input.departmentId);
      if (!department) {
        throw ApiError.badRequest('The selected department does not exist');
      }
    }
    const updated = await doctorRepository.update(id, input);
    if (!updated) {
      throw ApiError.notFound('Doctor not found');
    }
    return updated;
  },

  async getAvailability(doctorId: number): Promise<DoctorAvailability[]> {
    await this.getDoctorById(doctorId);
    return doctorRepository.getAvailability(doctorId);
  },

  async setAvailability(doctorId: number, slots: SetAvailabilityInput[]): Promise<DoctorAvailability[]> {
    await this.getDoctorById(doctorId);
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        throw ApiError.badRequest('Availability start time must be before end time');
      }
    }
    return doctorRepository.replaceAvailability(doctorId, slots);
  },
};
