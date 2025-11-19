import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
export declare class ReportController {
    createReport(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getMyReports(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTravelReports(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAllReports(req: AuthRequest, res: Response): Promise<void>;
    deleteReport(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=report.controller.d.ts.map