import { authRepository } from './auth.repository';
import { AuthTokens, LoginInput, RegisterPatientInput } from './auth.types';
import { usersRepository } from '../users/users.repository';
import { toSafeUser } from '../users/users.service';
import { SafeUser } from '../users/users.types';
import { patientsRepository } from '../patients/patients.repository';
import { journeyEventRepository } from '../journey/journeyEvent.repository';
import { UserRole } from '../../types/roles';
import { ApiError } from '../../utils/ApiError';
import { comparePassword, hashPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import { generateRefreshToken, hashRefreshToken } from '../../utils/refreshToken';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

async function issueTokens(userId: number, role: UserRole, email: string): Promise<AuthTokens> {
  const accessToken = signAccessToken({ userId, role, email });

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000);
  await authRepository.storeRefreshToken(userId, hashRefreshToken(refreshToken), expiresAt);

  return { accessToken, refreshToken };
}

export const authService = {
  async registerPatient(input: RegisterPatientInput): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await usersRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw ApiError.conflict('A user with this email already exists');
    }

    const duplicatePatient = await patientsRepository.findPotentialDuplicate(
      input.phone,
      input.dateOfBirth
    );
    if (duplicatePatient) {
      throw ApiError.conflict(
        `A patient with this phone number and date of birth is already registered (patient code ${duplicatePatient.patientCode})`
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.create({
      email: normalizedEmail,
      fullName: input.fullName,
      passwordHash,
      role: UserRole.PATIENT,
    });

    try {
      const patient = await patientsRepository.create({
        userId: user.id,
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        phone: input.phone,
        email: normalizedEmail,
      });
      await journeyEventRepository.record(patient.id, 'REGISTRATION', 'Patient registered with MediBridge');
    } catch (error) {
      // Roll back the user record so a failed patient profile creation never leaves
      // behind an account with no linked patient profile.
      await usersRepository.delete(user.id).catch((cleanupError) => {
        logger.error(`Failed to roll back user ${user.id} after registration failure: ${cleanupError}`);
      });
      // The pre-check above already rejects the common case; this is the DB
      // unique constraint (migration 008) catching a same-instant duplicate
      // that raced past that check.
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'ER_DUP_ENTRY') {
        throw ApiError.conflict('A patient with this phone number and date of birth is already registered');
      }
      throw error;
    }

    const tokens = await issueTokens(user.id, user.role, user.email);
    return { user: toSafeUser(user), tokens };
  },

  async login(input: LoginInput): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await usersRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated. Please contact the administrator.');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = await issueTokens(user.id, user.role, user.email);
    return { user: toSafeUser(user), tokens };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await authRepository.findValidToken(tokenHash);
    if (!storedToken) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await usersRepository.findById(storedToken.user_id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Rotate: the old token is single-use, replaced by a freshly issued pair.
    await authRepository.revokeToken(tokenHash);
    return issueTokens(user.id, user.role, user.email);
  },

  async logout(refreshToken: string): Promise<void> {
    await authRepository.revokeToken(hashRefreshToken(refreshToken));
  },

  async getCurrentUser(userId: number): Promise<SafeUser> {
    const user = await usersRepository.findById(userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid or expired session');
    }
    return toSafeUser(user);
  },

  async updateOwnProfile(userId: number, fullName: string): Promise<SafeUser> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    await usersRepository.updateFullName(userId, fullName);
    return { ...toSafeUser(user), fullName };
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    const matches = await comparePassword(currentPassword, user.passwordHash);
    if (!matches) {
      throw ApiError.badRequest('Current password is incorrect');
    }
    const passwordHash = await hashPassword(newPassword);
    await usersRepository.updatePasswordHash(userId, passwordHash);
  },
};
