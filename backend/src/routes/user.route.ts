import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const userController = new UserController();

// Rutas públicas
router.post('/register', userController.register.bind(userController));
router.post('/login', userController.login.bind(userController));

// Rutas protegidas
router.get('/profile', authenticateToken, userController.getProfile.bind(userController));
router.get('/', authenticateToken, userController.getAllUsers.bind(userController));
router.get('/:id', authenticateToken, userController.getUserById.bind(userController));
router.put('/:id', authenticateToken, userController.updateUser.bind(userController));
router.delete('/me', authenticateToken, userController.deleteAccount.bind(userController));
router.delete('/:id', authenticateToken, userController.deleteUser.bind(userController));

export default router;
