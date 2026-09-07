import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { CreateUserInput, User } from './users.types';
import { UserRole } from '../../types/roles';

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  full_name: string | null;
  password_hash: string;
  role: UserRole;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const usersRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const rows = await query<UserRow[]>('SELECT * FROM users WHERE email = :email LIMIT 1', { email });
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findById(id: number): Promise<User | null> {
    const rows = await query<UserRow[]>('SELECT * FROM users WHERE id = :id LIMIT 1', { id });
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(input: CreateUserInput): Promise<User> {
    const result = await query<ResultSetHeader>(
      'INSERT INTO users (email, full_name, password_hash, role) VALUES (:email, :fullName, :passwordHash, :role)',
      { ...input, fullName: input.fullName ?? null }
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to load user immediately after creation');
    }
    return created;
  },

  async updateFullName(id: number, fullName: string): Promise<void> {
    await query('UPDATE users SET full_name = :fullName WHERE id = :id', { id, fullName });
  },

  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    await query('UPDATE users SET password_hash = :passwordHash WHERE id = :id', { id, passwordHash });
  },

  async list(role?: UserRole): Promise<User[]> {
    if (role) {
      const rows = await query<UserRow[]>('SELECT * FROM users WHERE role = :role ORDER BY created_at DESC', {
        role,
      });
      return rows.map(mapRow);
    }
    const rows = await query<UserRow[]>('SELECT * FROM users ORDER BY created_at DESC');
    return rows.map(mapRow);
  },

  async setActive(id: number, isActive: boolean): Promise<void> {
    await query('UPDATE users SET is_active = :isActive WHERE id = :id', { id, isActive });
  },

  async delete(id: number): Promise<void> {
    await query('DELETE FROM users WHERE id = :id', { id });
  },
};
