import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
export declare class ReviewController {
    createReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUserReviews(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getMyReviews(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTravelReviews(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=review.controller.d.ts.map