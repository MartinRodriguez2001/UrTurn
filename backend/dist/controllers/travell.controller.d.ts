import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
export declare class TravelController {
    createTravel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createOpenTravelRequest(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getDriverTravels(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTravelsByDriverById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAvailableTravels(req: AuthRequest, res: Response): Promise<void>;
    requestToJoinTravel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    respondToTravelRequest(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    cancelTravel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    completeTravel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    startTravel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTravelRequests(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTravelById(req: AuthRequest, res: Response): Promise<void>;
    getPassengerTravels(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    removePassenger(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    searchTravelsByLocation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    cancelTravelRequest(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    findMatchingTravels(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    leaveTravel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTravelMessages(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    sendTravelMessage(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=travell.controller.d.ts.map