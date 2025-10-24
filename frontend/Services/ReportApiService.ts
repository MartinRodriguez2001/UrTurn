import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api'
  : 'https://tu-servidor-produccion.com/api';

export interface ReportData {
  travelId: number;
  description: string;
}

export interface Report {
  id: number;
  usuarioId: number;
  travelId: number;
  description: string;
  created_at: string;
  updated_at: string;
}

class ReportApiService {
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
   * Crear un nuevo reporte
   */
  async createReport(reportData: ReportData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reportData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el reporte');
      }

      return data;
    } catch (error) {
      console.error('Error en createReport:', error);
      throw error;
    }
  }

  /**
   * Obtener mis reportes
   */
  async getMyReports() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reports/my-reports`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener tus reportes');
      }

      return data;
    } catch (error) {
      console.error('Error en getMyReports:', error);
      throw error;
    }
  }

  /**
   * Obtener los reportes de un viaje
   */
  async getTravelReports(travelId: number) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reports/travel/${travelId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener reportes del viaje');
      }

      return data;
    } catch (error) {
      console.error('Error en getTravelReports:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los reportes (admin)
   */
  async getAllReports() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reports`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener reportes');
      }

      return data;
    } catch (error) {
      console.error('Error en getAllReports:', error);
      throw error;
    }
  }

  /**
   * Actualizar un reporte
   */
  async updateReport(reportId: number, reportData: Partial<ReportData>) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reports/${reportId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(reportData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el reporte');
      }

      return data;
    } catch (error) {
      console.error('Error en updateReport:', error);
      throw error;
    }
  }

  /**
   * Eliminar un reporte
   */
  async deleteReport(reportId: number) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/reports/${reportId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar el reporte');
      }

      return data;
    } catch (error) {
      console.error('Error en deleteReport:', error);
      throw error;
    }
  }
}

export default new ReportApiService();
