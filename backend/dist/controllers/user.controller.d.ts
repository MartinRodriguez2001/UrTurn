import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare class UserController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    getAllUsers(req: Request, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
    getProfile(req: AuthRequest, res: Response): Promise<void>;
    serveProfilePhoto(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=user.controller.d.ts.map