import { ApiResponse } from "@/api";
import { Vehicle, VehicleData } from "@/types/vehicle";
import BaseApiService from "./BaseApiService";

class VehicleApiService extends BaseApiService {
  // GET /api/vehicles - Obtiene vehículos del usuario autenticado
  async getUserVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return this.makeRequest<Vehicle[]>("/vehicles"); // GET por defecto
  }

  // GET /api/vehicles/:id - Obtiene vehículo específico del usuario
  async getVehicleById(id: number): Promise<ApiResponse<Vehicle>> {
    return this.makeRequest<Vehicle>(`/vehicles/${id}`);
  }

  // POST /api/vehicles - Registra vehículo para el usuario autenticado
  async registerVehicle(vehicleData: VehicleData): Promise<ApiResponse<Vehicle>> {
    return this.makeRequest<Vehicle>("/vehicles", {
      method: 'POST',
      body: JSON.stringify(vehicleData)
    });
  }

  // PUT /api/vehicles/:id - Actualiza vehículo del usuario
  async updateVehicle(id: number, vehicleData: Partial<VehicleData>): Promise<ApiResponse<Vehicle>> {
    return this.makeRequest<Vehicle>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData)
    });
  }

  // DELETE /api/vehicles/:id - Elimina vehículo del usuario
  async deleteVehicle(id: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/vehicles/${id}`, {
      method: 'DELETE'
    });
  }

  // GET /api/vehicles/check - Verifica si el usuario tiene vehículos
  async checkUserHasVehicles(): Promise<ApiResponse<{ hasVehicles: boolean }>> {
    return this.makeRequest<{ hasVehicles: boolean }>("/vehicles/check");
  }

  // POST /api/auth/become-driver - Convierte usuario en conductor
  async becomeDriver(driverData: VehicleData & { phoneNumber?: string }): Promise<ApiResponse<Vehicle>> {
    return this.makeRequest<Vehicle>("/auth/become-driver", {
      method: 'POST',
      body: JSON.stringify(driverData)
    });
  }
}

export default new VehicleApiService();