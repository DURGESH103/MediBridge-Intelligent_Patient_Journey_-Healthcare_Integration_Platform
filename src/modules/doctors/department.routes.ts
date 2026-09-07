import { Router } from 'express';
import { departmentController } from './department.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import { createDepartmentSchema } from './department.validation';

const router = Router();

router.use(authenticate);

router.get('/', departmentController.listDepartments);
router.post('/', authorize(UserRole.ADMIN), validate(createDepartmentSchema), departmentController.createDepartment);

export default router;
