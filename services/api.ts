// Configuración de la API
// Para desarrollo en dispositivo móvil físico - USA LA IP DE TU PC
const API_URL = 'Aca va su ip:3000';

// Otras opciones según el entorno:
// const API_URL = 'http://localhost:3000'; // Para desarrollo en navegador web
// const API_URL = 'http://192.168.110.0:3000'; // Para Android Emulator con WSL
// const API_URL = 'http://10.0.2.2:3000'; // Para Android Emulator sin WSL

/**
 * API de Autenticación
 */
export const authAPI = {
  /**
   * Registrar nuevo usuario
   */
  register: async (userData) => {
    try {
      console.log('[API] Enviando petición de registro a:', `${API_URL}/api/auth/register`);
      console.log('[API] Datos:', userData);
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('[API] Response status:', response.status);
      const data = await response.json();
      console.log('[API] Response data:', data);
      return data;
    } catch (error) {
      console.error('[API] Error en registro:', error);
      throw error;
    }
  },

  /**
   * Iniciar sesión
   */
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  /**
   * Obtener perfil del usuario
   */
  getProfile: async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  },
};

export default authAPI;
