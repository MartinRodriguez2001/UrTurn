import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
export declare class VehicleController {
    registerVehicle(req: AuthRequest, res: Response): Promise<void>;
    getUserVehicles(req: AuthRequest, res: Response): Promise<void>;
    getVehicleById(req: AuthRequest, res: Response): Promise<void>;
    updateVehicle(req: AuthRequest, res: Response): Promise<void>;
    deleteVehicle(req: AuthRequest, res: Response): Promise<void>;
    checkUserHasVehicles(req: AuthRequest, res: Response): Promise<void>;
    forceValidateVehicle(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    forceInvalidateVehicle(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=vehicle.controller.d.ts.map