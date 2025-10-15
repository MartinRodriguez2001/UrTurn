import { apiService, AuthData } from '@/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: AuthData['user'] | null;
  isAuthenticated: boolean;
  loading: boolean;
  register: (userData: any) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthData['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token')
      ]);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any): Promise<{ success: boolean; message: string }> => {
  try {
    // Mapear los datos del formulario al formato esperado por el backend
    const backendData = {
      name: userData.name,
      institutional_email: userData.email,
      password: userData.password,
      institution_credential: userData.institution_credential || `CRED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      student_certificate: userData.student_certificate || `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phone_number: userData.phone_number,
      IsDriver: userData.IsDriver || false,
      profile_picture: userData.profile_picture || '',
      description: userData.description || '',
    };

    console.log('🔄 Registrando usuario con datos:', backendData);

    const response = await apiService.register(backendData);

    if (response.success && response.data) {
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(response.data.user)),
        AsyncStorage.setItem('token', response.data.token)
      ]);

      setUser(response.data.user);

      return {
        success: true,
        message: response.message || 'Registro exitoso'
      };
    }

    return {
      success: false,
      message: response.message || 'Error en el registro'
    };

  } catch (error) {
    console.error('❌ Error en register:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error de conexión'
    };
  }
};

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.login({
        institutional_email: email,
        password
      });

      if (response.success && response.data) {
        await Promise.all([
          AsyncStorage.setItem('user', JSON.stringify(response.data.user)),
          AsyncStorage.setItem('token', response.data.token)
        ]);

        setUser(response.data.user);

        return {
          success: true,
          message: response.message || 'Login exitoso'
        };
      }

      return {
        success: false,
        message: response.message || 'Error en el login'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión'
      };
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('token')
      ]);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};