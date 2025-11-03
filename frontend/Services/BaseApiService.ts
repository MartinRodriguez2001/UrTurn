import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ApiResponse } from '@/types/api';

const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

const resolveDevHost = () => {
  const hostUri: string | undefined =
    (Constants as any)?.expoConfig?.hostUri ??
    (Constants as any)?.expoGo?.hostUri ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    undefined;

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const sanitized = hostUri
      .replace(/^https?:\/\//, '')
      .replace(/^exp:\/\//, '')
      .split(':')[0];

    if (sanitized && sanitized !== 'localhost') {
      return sanitized;
    }
  }

  return null;
};

const resolveBaseUrl = (): string => {
  if (ENV_BASE_URL) {
    return ENV_BASE_URL;
  }

  if (__DEV__) {
    const resolvedHost = resolveDevHost();
    if (resolvedHost) {
      return `http://${resolvedHost}:3000/api`;
    }

    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api';
    }

    return 'http://localhost:3000/api';
  }

  return 'https://tu-servidor-produccion.com/api';
};

export const API_BASE_URL = resolveBaseUrl();

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
