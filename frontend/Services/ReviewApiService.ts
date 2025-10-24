import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api'
  : 'https://tu-servidor-produccion.com/api';

export interface ReviewData {
  user_target_id: number;
  travel_id: number;
  starts: number;
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
}

class ReviewApiService {
  private baseURL = API_BASE_URL;

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Crear una nueva calificación
   */
  async createReview(reviewData: ReviewData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la calificación');
      }

      return data;
    } catch (error) {
      console.error('Error en createReview:', error);
      throw error;
    }
  }

  /**
   * Obtener las calificaciones de un usuario
   */
  async getUserReviews(userId: number) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reviews/user/${userId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener calificaciones');
      }

      return data;
    } catch (error) {
      console.error('Error en getUserReviews:', error);
      throw error;
    }
  }

  /**
   * Obtener mis calificaciones
   */
  async getMyReviews() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reviews/my-reviews`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener tus calificaciones');
      }

      return data;
    } catch (error) {
      console.error('Error en getMyReviews:', error);
      throw error;
    }
  }

  /**
   * Obtener las calificaciones de un viaje
   */
  async getTravelReviews(travelId: number) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reviews/travel/${travelId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener calificaciones del viaje');
      }

      return data;
    } catch (error) {
      console.error('Error en getTravelReviews:', error);
      throw error;
    }
  }

  /**
   * Actualizar una calificación
   */
  async updateReview(reviewId: number, reviewData: Partial<ReviewData>) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la calificación');
      }

      return data;
    } catch (error) {
      console.error('Error en updateReview:', error);
      throw error;
    }
  }

  /**
   * Eliminar una calificación
   */
  async deleteReview(reviewId: number) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar la calificación');
      }

      return data;
    } catch (error) {
      console.error('Error en deleteReview:', error);
      throw error;
    }
  }
}

export default new ReviewApiService();
