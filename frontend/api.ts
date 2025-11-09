import { Platform } from 'react-native';
import { ApiResponse, AuthData, RegisterData } from "./types/api";

const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

const API_BASE_URL =
  (ENV_BASE_URL && ENV_BASE_URL.length > 0 ? ENV_BASE_URL : undefined) ??
  (__DEV__
    ? Platform.OS === "android"
      ? "http://10.0.2.2:3000/api" // Para Android Emulator
      : "http://localhost:3000/api" // Para iOS Simulator
    : "https://tu-servidor-produccion.com/api");

class ApiService {
  private baseURL = API_BASE_URL;

  async register(userData: RegisterData): Promise<ApiResponse<{ data?: AuthData }>> {
    try {
      console.log('🔄 Enviando registro a:', `${this.baseURL}/users/register`);
      console.log('📤 Datos enviados:', userData);

      const response = await fetch(`${this.baseURL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📥 Status de respuesta:', response.status);
      
      const data = await response.json();
      console.log('📥 Respuesta del servidor:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }

      return data;
    } catch (error) {
      console.error('❌ Error en registro:', error);
      throw new Error(error instanceof Error ? error.message : 'Error de conexión');
    }
  }

  async login(credentials: { institutional_email: string; password: string }): Promise<ApiResponse<{ data?: AuthData }>> {
    try {
      const response = await fetch(`${this.baseURL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el login');
      }

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error de conexión');
    }
  }
}

export const apiService = new ApiService();
export type { ApiResponse, AuthData, RegisterData };
