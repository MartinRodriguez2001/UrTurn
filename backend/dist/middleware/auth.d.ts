import { NextFunction, Request, Response } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
    };
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map