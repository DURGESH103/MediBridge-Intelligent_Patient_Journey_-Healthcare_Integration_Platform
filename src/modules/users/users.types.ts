import { UserRole } from '../../types/roles';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
}
