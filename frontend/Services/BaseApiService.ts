import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ApiResponse } from '@/types/api';

const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

const API_BASE_URL =
  (ENV_BASE_URL && ENV_BASE_URL.length > 0 ? ENV_BASE_URL : undefined) ??
  (__DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:3000/api'
      : 'http://localhost:3000/api'
    : 'https://tu-servidor-produccion.com/api');

class BaseApiService {
  protected baseURL = API_BASE_URL;

  protected async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  protected async makeRequest<T extends object = {}>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw new Error(error instanceof Error ? error.message : 'Error de conexión');
    }
  }
}

export default BaseApiService;
