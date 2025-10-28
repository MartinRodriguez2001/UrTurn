import { ApiResponse } from "@/api";
import {
    PassengerConfirmedTravel,
    PassengerRequestedTravel,
    TravelCreateData,
    TravelFilters,
    TravelMatchRequestPayload,
    TravelMatchResponse,
    TravelRequestCreatePayload,
    TravelRequestRecord,
    TravelResponse,
    TravelsResponse,
} from "@/types/travel";
import BaseApiService from "./BaseApiService";

class TravelApiService extends BaseApiService {

  //  1. Obtener viajes disponibles (con filtros opcionales)
  async getAvailableTravels(filters?: TravelFilters): Promise<ApiResponse<TravelsResponse>> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.start_location) {
        queryParams.append('start_location', filters.start_location);
      }
      if (filters.end_location) {
        queryParams.append('end_location', filters.end_location);
      }
      if (filters.start_date) {
        queryParams.append('start_date', filters.start_date.toISOString());
      }
      if (filters.min_spaces) {
        queryParams.append('min_spaces', filters.min_spaces.toString());
      }
      if (filters.max_price) {
        queryParams.append('max_price', filters.max_price.toString());
      }
    }

    const url = `/travels/available${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return this.makeRequest<TravelsResponse>(url, {
      method: 'GET'
    });
  }

  //  2. Crear nuevo viaje (para conductores)
  async createTravel(travelData: TravelCreateData): Promise<ApiResponse<TravelResponse>> {
    return this.makeRequest<TravelResponse>('/travels', {
      method: 'POST',
      body: JSON.stringify(travelData)
    });
  }

  //  3. Obtener viajes del conductor
  async getDriverTravels(): Promise<ApiResponse<TravelsResponse>> {
    return this.makeRequest<TravelsResponse>('/travels/driver', {
      method: 'GET'
    });
  }

  //  4. Obtener viajes del pasajero
  async getPassengerTravels(): Promise<
    ApiResponse<{
      data: {
        requested: PassengerRequestedTravel[];
        confirmed: PassengerConfirmedTravel[];
      };
    }>
  > {
    return this.makeRequest('/travels/passenger', {
      method: 'GET'
    });
  }

  //  4.5 Registrar solicitud sin viaje asignado
  async createTravelRequest(
    payload: TravelRequestCreatePayload
  ): Promise<ApiResponse<{ request: TravelRequestRecord }>> {
    return this.makeRequest<{ request: TravelRequestRecord }>('/travels/requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  //  5. Solicitar unirse a un viaje
  async requestToJoinTravel(
    travelId: number,
    pickupLocation: string,
    pickupLatitude: number,
    pickupLongitude: number,
    dropoffLocation: string,
    dropoffLatitude: number,
    dropoffLongitude: number,
    pickupDate?: Date,
    pickupTime?: Date
  ): Promise<ApiResponse<{
    request: any;
    message: string;
  }>> {
    return this.makeRequest(`/travels/${travelId}/request`, {
      method: 'POST',
      body: JSON.stringify({
        pickupLocation,
        pickupLatitude,
        pickupLongitude,
        dropoffLocation,
        dropoffLatitude,
        dropoffLongitude,
        pickupDate: pickupDate ? pickupDate.toISOString() : undefined,
        pickupTime: pickupTime ? pickupTime.toISOString() : undefined
      })
    });
  }

  //  6. Responder a una solicitud de viaje (conductor)
  async respondToTravelRequest(requestId: number, accept: boolean): Promise<ApiResponse<{
    request: any;
    message: string;
  }>> {
    return this.makeRequest(`/travels/requests/${requestId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({
        accept
      })
    });
  }

  //  7. Obtener solicitudes de un viaje específico
  async getTravelRequests(travelId: number): Promise<ApiResponse<{
    requests: any[];
    count: number;
    message: string;
  }>> {
    return this.makeRequest(`/travels/${travelId}/requests`, {
      method: 'GET'
    });
  }

  //  8. Cancelar viaje
  async cancelTravel(travelId: number, reason?: string): Promise<ApiResponse<TravelResponse>> {
    return this.makeRequest<TravelResponse>(`/travels/${travelId}`, {
      method: 'DELETE',
      body: reason ? JSON.stringify({ reason }) : undefined
    });
  }

  //  9. Finalizar viaje
  async completeTravel(travelId: number): Promise<ApiResponse<TravelResponse>> {
    return this.makeRequest<TravelResponse>(`/travels/${travelId}/complete`, {
      method: 'PUT'
    });
  }

  //  10. Remover pasajero del viaje
  async removePassenger(travelId: number, passengerId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.makeRequest(`/travels/${travelId}/passengers/${passengerId}`, {
      method: 'DELETE'
    });
  }

  //  11. Buscar viajes por ubicación
  async searchTravelsByLocation(query: string): Promise<ApiResponse<TravelsResponse>> {
    return this.makeRequest<TravelsResponse>(`/travels/search?query=${encodeURIComponent(query)}`, {
      method: 'GET'
    });
  }

  async matchTravelsForPassenger(
    payload: TravelMatchRequestPayload
  ): Promise<ApiResponse<TravelMatchResponse>> {
    return this.makeRequest<TravelMatchResponse>('/travels/matching', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

const travelApiService = new TravelApiService();
export default travelApiService;
