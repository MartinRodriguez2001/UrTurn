import { ApiResponse } from "@/types/api";
import BaseApiService from "./BaseApiService";

export interface DriverStats {
  totalTrips: number;
  completedTrips: number;
  canceledTrips: number;
  pendingTrips: number;
  confirmedTrips: number;
  totalPassengersTransported: number;
  totalEarnings: number;
}

export interface PassengerStats {
  totalRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  completedTrips: number;
  totalSpent: number;
}

export interface ReviewStatsData {
  averageRating: number | null;
  totalReviewsReceived: number;
  totalReviewsGiven: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface VehicleStats {
  totalVehicles: number;
  validatedVehicles: number;
}

export interface UserStatsResponse {
  asDriver: DriverStats;
  asPassenger: PassengerStats;
  reviews: ReviewStatsData;
  vehicles: VehicleStats;
}

export interface DriverRankingItem {
  id: number;
  name: string;
  profile_picture?: string;
  averageRating: number;
  totalReviews: number;
  totalTrips: number;
  totalPassengers: number;
  score: number;
}

export interface PlatformStats {
  users: {
    total: number;
    drivers: number;
    passengers: number;
  };
  travels: {
    total: number;
    completed: number;
    active: number;
    canceled: number;
  };
  vehicles: {
    total: number;
    validated: number;
    pending: number;
  };
  engagement: {
    totalReviews: number;
    totalReports: number;
    averageRating: number | null;
  };
  recentActivity: {
    travelsLast7Days: number;
  };
}

class StatsApiService extends BaseApiService {
  // Obtener estadísticas del usuario autenticado
  async getMyStats(): Promise<ApiResponse<{
    data: UserStatsResponse;
    message: string;
  }>> {
    return this.makeRequest('/stats/me', {
      method: 'GET'
    });
  }

  // Obtener estadísticas de un usuario específico
  async getUserStats(userId: number): Promise<ApiResponse<{
    data: UserStatsResponse;
    message: string;
  }>> {
    return this.makeRequest(`/stats/user/${userId}`, {
      method: 'GET'
    });
  }

  // Obtener ranking de conductores
  async getDriverRanking(limit: number = 10): Promise<ApiResponse<{
    drivers: DriverRankingItem[];
    count: number;
    message: string;
  }>> {
    return this.makeRequest(`/stats/drivers/ranking?limit=${limit}`, {
      method: 'GET'
    });
  }

  // Obtener estadísticas de la plataforma
  async getPlatformStats(): Promise<ApiResponse<{
    data: PlatformStats;
    message: string;
  }>> {
    return this.makeRequest('/stats/platform', {
      method: 'GET'
    });
  }
}

const statsApiService = new StatsApiService();
export default statsApiService;
