import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { CreateDepartmentInput, Department } from './department.types';

interface DepartmentRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: DepartmentRow): Department {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const departmentRepository = {
  async findAll(): Promise<Department[]> {
    const rows = await query<DepartmentRow[]>('SELECT * FROM departments ORDER BY name ASC');
    return rows.map(mapRow);
  },

  async findById(id: number): Promise<Department | null> {
    const rows = await query<DepartmentRow[]>('SELECT * FROM departments WHERE id = :id LIMIT 1', { id });
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findByName(name: string): Promise<Department | null> {
    const rows = await query<DepartmentRow[]>('SELECT * FROM departments WHERE name = :name LIMIT 1', {
      name,
    });
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(input: CreateDepartmentInput): Promise<Department> {
    const result = await query<ResultSetHeader>(
      'INSERT INTO departments (name, description) VALUES (:name, :description)',
      { name: input.name, description: input.description ?? null }
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to load department immediately after creation');
    }
    return created;
  },
};
