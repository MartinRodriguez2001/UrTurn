import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
export declare class StatsController {
    getMyStats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUserStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getDriverRanking(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPlatformStats(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=stats.controller.d.ts.map