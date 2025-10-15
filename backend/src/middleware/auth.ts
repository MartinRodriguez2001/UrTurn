import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';
import { verifyToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token de acceso requerido' });
      return;
    }

    const payload = verifyToken(token);
    
    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || !user.active) {
      res.status(401).json({ error: 'Usuario no válido' });
      return;
    }

    req.user = {
      id: payload.userId,
      email: payload.email
    };

    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
};