import { departmentRepository } from './department.repository';
import { CreateDepartmentInput, Department } from './department.types';
import { ApiError } from '../../utils/ApiError';

export const departmentService = {
  async listDepartments(): Promise<Department[]> {
    return departmentRepository.findAll();
  },

  async getDepartmentById(id: number): Promise<Department> {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw ApiError.notFound('Department not found');
    }
    return department;
  },

  async createDepartment(input: CreateDepartmentInput): Promise<Department> {
    const existing = await departmentRepository.findByName(input.name.trim());
    if (existing) {
      throw ApiError.conflict('A department with this name already exists');
    }
    return departmentRepository.create({ ...input, name: input.name.trim() });
  },
};
