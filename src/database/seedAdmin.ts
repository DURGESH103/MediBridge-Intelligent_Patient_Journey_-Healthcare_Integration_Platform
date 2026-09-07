import { usersRepository } from '../modules/users/users.repository';
import { hashPassword } from '../utils/password';
import { UserRole } from '../types/roles';
import { logger } from '../config/logger';
import { pool } from '../config/database';

/**
 * Creates the first ADMIN account so someone can log in and start creating
 * other staff accounts through the normal /users API. Run once per environment:
 *   npx ts-node src/database/seedAdmin.ts <email> <password>
 */
async function seedAdmin(): Promise<void> {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    throw new Error('Usage: ts-node src/database/seedAdmin.ts <email> <password>');
  }

  const existing = await usersRepository.findByEmail(email.toLowerCase());
  if (existing) {
    logger.info(`Admin account for ${email} already exists (id ${existing.id})`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const admin = await usersRepository.create({
    email: email.toLowerCase(),
    passwordHash,
    role: UserRole.ADMIN,
  });
  logger.info(`Created admin account: ${admin.email} (id ${admin.id})`);
}

seedAdmin()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
