import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import {
  createStaffUserSchema,
  listUsersSchema,
  setUserActiveSchema,
  userIdParamSchema,
} from './users.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.post('/', validate(createStaffUserSchema), usersController.createStaffUser);
router.get('/', validate(listUsersSchema), usersController.listUsers);
router.get('/:id', validate(userIdParamSchema), usersController.getUserById);
router.patch('/:id/status', validate(setUserActiveSchema), usersController.setUserActive);

export default router;
