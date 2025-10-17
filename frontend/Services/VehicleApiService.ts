import { ApiResponse } from "@/api";
import { Vehicle, VehicleData } from "@/types/vehicle";
import BaseApiService from "./BaseApiService";

class VehicleApiService extends BaseApiService {
    async getAllVehicles(): Promise<ApiResponse<VehicleData[]>> {
        return this.makeRequest<VehicleData[]>("/vehicles")
    }

    async getVehicleById(id: number): Promise<ApiResponse<Vehicle>> {
        return this.makeRequest<Vehicle>(`/vehicles/${id}`)
    }
}