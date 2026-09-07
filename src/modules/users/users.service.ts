import { usersRepository } from './users.repository';
import { SafeUser, User } from './users.types';
import { UserRole } from '../../types/roles';
import { ApiError } from '../../utils/ApiError';
import { hashPassword } from '../../utils/password';

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export const usersService = {
  async createStaffUser(email: string, password: string, role: UserRole, fullName?: string | null): Promise<SafeUser> {
    if (role === UserRole.PATIENT) {
      throw ApiError.badRequest('Patients should self-register through /auth/register');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await usersRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw ApiError.conflict('A user with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const user = await usersRepository.create({ email: normalizedEmail, fullName, passwordHash, role });
    return toSafeUser(user);
  },

  async listUsers(role?: UserRole): Promise<SafeUser[]> {
    const users = await usersRepository.list(role);
    return users.map(toSafeUser);
  },

  async getUserById(id: number): Promise<SafeUser> {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return toSafeUser(user);
  },

  async setUserActive(id: number, isActive: boolean): Promise<SafeUser> {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    await usersRepository.setActive(id, isActive);
    return { ...toSafeUser(user), isActive };
  },
};
