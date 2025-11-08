import { ApiResponse } from "@/api";
import { Vehicle, VehicleData } from "@/types/vehicle";
import BaseApiService from "./BaseApiService";

class VehicleApiService extends BaseApiService {
  // GET /api/vehicles - Obtiene vehículos del usuario autenticado
  async getUserVehicles(): Promise<ApiResponse<{ data?: Vehicle[] }>> {
    return this.makeRequest<{ data?: Vehicle[] }>("/vehicles"); // GET por defecto
  }

  // GET /api/vehicles/:id - Obtiene vehículo específico del usuario
  async getVehicleById(id: number): Promise<ApiResponse<{ data?: Vehicle }>> {
    return this.makeRequest<{ data?: Vehicle }>(`/vehicles/${id}`);
  }

  // POST /api/vehicles - Registra vehículo para el usuario autenticado
  async registerVehicle(
    vehicleData: VehicleData
  ): Promise<ApiResponse<{ data?: Vehicle }>> {
    return this.makeRequest<{ data?: Vehicle }>("/vehicles", {
      method: "POST",
      body: JSON.stringify(vehicleData),
    });
  }

  // PUT /api/vehicles/:id - Actualiza vehículo del usuario
  async updateVehicle(
    id: number,
    vehicleData: Partial<VehicleData>
  ): Promise<ApiResponse<{ data?: Vehicle }>> {
    return this.makeRequest<{ data?: Vehicle }>(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(vehicleData),
    });
  }

  // DELETE /api/vehicles/:id - Elimina vehículo del usuario
  async deleteVehicle(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/vehicles/${id}`, {
      method: "DELETE",
    });
  }

  // GET /api/vehicles/check - Verifica si el usuario tiene vehículos
  async checkUserHasVehicles(): Promise<ApiResponse<{ data?: { hasVehicles: boolean } }>> {
    const response = await this.makeRequest<{ data?: { hasVehicles: boolean } }>(
      "/vehicles/check"
    );
    console.log(
      "🚗 VehicleApiService.checkUserHasVehicles response:",
      response
    );
    return response;
  }

  // POST /api/auth/become-driver - Convierte usuario en conductor
  async becomeDriver(
    driverData: VehicleData & { phoneNumber?: string }
  ): Promise<ApiResponse<{ data?: Vehicle }>> {
    return this.makeRequest<{ data?: Vehicle }>("/auth/become-driver", {
      method: "POST",
      body: JSON.stringify(driverData),
    });
  }

  async forceValidateVehicle(vehicleId: number) {
    return this.makeRequest(`/vehicles/force-validate/${vehicleId}`, {
      method: "PUT",
    });
  }

  async forceInvalidateVehicle(vehicleId: number) {
    return this.makeRequest(`/vehicles/force-invalidate/${vehicleId}`, {
      method: "PUT",
    });
  }
}

export default new VehicleApiService();
