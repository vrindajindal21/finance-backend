import { Router } from 'express';
import { getUsers, updateUserRole, deleteUser } from '../controllers/admin.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Only Admins can manage users
router.use(authMiddleware, roleMiddleware(['ADMIN']));

router.get('/users', getUsers);
router.put('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
