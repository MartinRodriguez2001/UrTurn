import { ApiResponse } from '@/types/api';
import BaseApiService from './BaseApiService';

export interface CreateReviewPayload {
  user_target_id: number;
  travel_id: number;
  starts: number; // 1-5 estrellas
  review: string;
}

export interface Review {
  id: number;
  reviewer_id: number;
  user_target_id: number;
  travel_id: number;
  starts: number;
  review: string;
  created_at: string;
  reviewer?: {
    id: number;
    name: string;
    profile_picture?: string;
  };
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  data?: Review;
  reviews?: Review[];
}

class ReviewApiService extends BaseApiService {
  /**
   * Crea una nueva reseña para un usuario después de un viaje
   */
  async createReview(payload: CreateReviewPayload): Promise<ApiResponse<ReviewResponse>> {
    return this.makeRequest<ReviewResponse>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Obtiene las reseñas del usuario autenticado
   */
  async getMyReviews(): Promise<ApiResponse<ReviewResponse>> {
    return this.makeRequest<ReviewResponse>('/reviews/me');
  }

  /**
   * Obtiene las reseñas de un usuario específico
   */
  async getUserReviews(userId: number): Promise<ApiResponse<ReviewResponse>> {
    return this.makeRequest<ReviewResponse>(`/reviews/user/${userId}`);
  }

  /**
   * Obtiene las reseñas de un viaje específico
   */
  async getTravelReviews(travelId: number): Promise<ApiResponse<ReviewResponse>> {
    return this.makeRequest<ReviewResponse>(`/reviews/travel/${travelId}`);
  }

  /**
   * Elimina una reseña propia
   */
  async deleteReview(reviewId: number): Promise<ApiResponse<ReviewResponse>> {
    return this.makeRequest<ReviewResponse>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }
}

export default new ReviewApiService();
