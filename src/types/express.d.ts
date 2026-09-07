import { UserRole } from './roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: UserRole;
        email: string;
      };
    }
  }
}

export {};
