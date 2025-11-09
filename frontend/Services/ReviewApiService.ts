import { ApiResponse } from "@/types/api";
import BaseApiService from "./BaseApiService";

export interface Review {
  id: number;
  reviewer_id: number;
  user_target_id: number;
  travel_id: number;
  starts: number;
  review: string;
  date: string;
  reviewer?: {
    id: number;
    name: string;
    profile_picture?: string;
  };
  user_target?: {
    id: number;
    name: string;
    profile_picture?: string;
  };
  travel?: {
    id: number;
    start_location: string;
    end_location: string;
    start_time: string;
  };
}

export interface ReviewStats {
  averageRating: number | null;
  totalReceived: number;
  totalGiven: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface UserReviewsResponse {
  received: Review[];
  given: Review[];
  stats: ReviewStats;
}

export interface ReviewCreateData {
  user_target_id: number;
  travel_id: number;
  starts: number;
  review: string;
}

class ReviewApiService extends BaseApiService {
  // Crear una review
  async createReview(reviewData: ReviewCreateData): Promise<ApiResponse<{
    review: Review;
    message: string;
  }>> {
    return this.makeRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  // Obtener reviews del usuario autenticado
  async getMyReviews(): Promise<ApiResponse<{
    data: UserReviewsResponse;
    message: string;
  }>> {
    return this.makeRequest('/reviews/me', {
      method: 'GET'
    });
  }

  // Obtener reviews de un usuario específico
  async getUserReviews(userId: number): Promise<ApiResponse<{
    data: UserReviewsResponse;
    message: string;
  }>> {
    return this.makeRequest(`/reviews/user/${userId}`, {
      method: 'GET'
    });
  }

  // Obtener reviews de un viaje específico
  async getTravelReviews(travelId: number): Promise<ApiResponse<{
    reviews: Review[];
    count: number;
    message: string;
  }>> {
    return this.makeRequest(`/reviews/travel/${travelId}`, {
      method: 'GET'
    });
  }

  // Eliminar una review propia
  async deleteReview(reviewId: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.makeRequest(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  }
}

const reviewApiService = new ReviewApiService();
export default reviewApiService;
