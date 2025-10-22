import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { UserService } from '../services/auth.service.js';

const userService = new UserService();

export class UserController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error en el registro'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.login(req.body);
      res.json({
        success: true,
        message: 'Login exitoso',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error en el login'
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios'
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      const user = await userService.getUserById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario'
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      const user = await userService.updateUser(id, req.body);
      
      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar usuario'
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      await userService.deleteUser(id);
      
      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar usuario'
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await userService.getProfile(userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil'
      });
    }
  }

  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      await userService.deleteAccount(userId);

      res.json({
        success: true,
        message: 'Cuenta eliminada exitosamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar cuenta'
      });
    }
  }
}
