import express from 'express';
import { getProfile, login, register } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateLogin, validateRegister } from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

export default router;
