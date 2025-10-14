import { createContext, ReactNode, useContext, useState } from "react";
import { authAPI } from "../services/api";

interface User {
  id: number;
  email: string;
  name: string;
  role: 'passenger' | 'driver';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  login: (credentials: LoginData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'passenger' | 'driver';
}

interface LoginData {
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * Registrar nuevo usuario
   */
  const register = async (userData: RegisterData) => {
    try {
      console.log('[UserContext] Llamando a authAPI.register...');
      const result = await authAPI.register(userData);
      console.log('[UserContext] Resultado de authAPI.register:', result);

      if (result.success) {
        console.log('[UserContext] ✅ Registro exitoso, guardando usuario y token');
        setUser(result.data.user);
        setToken(result.data.token);
        console.log('[UserContext] Usuario guardado:', result.data.user);
        return { success: true };
      } else {
        console.log('[UserContext] ❌ Registro falló:', result.message);
        return { 
          success: false, 
          message: result.message || 'Error al registrar' 
        };
      }
    } catch (error) {
      console.error('[UserContext] ❌ Error en registro (catch):', error);
      return { 
        success: false, 
        message: 'Error de conexión con el servidor' 
      };
    }
  };

  /**
   * Iniciar sesión
   */
  const login = async (credentials: LoginData) => {
    try {
      const result = await authAPI.login(credentials);

      if (result.success) {
        setUser(result.data.user);
        setToken(result.data.token);
        return { success: true };
      } else {
        return { 
          success: false, 
          message: result.message || 'Credenciales inválidas' 
        };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        message: 'Error de conexión con el servidor' 
      };
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated, 
      register, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

