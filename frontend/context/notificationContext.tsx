import notificationService, {
    type LocalNotificationPayload,
    type NotificationPermissionStatus,
    type PushNotificationData
} from '@/Services/NotificationService';
import * as Notifications from 'expo-notifications';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from './authContext';

interface NotificationPreferences {
  chatMessages: boolean;
  travelUpdates: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface NotificationContextValue {
  // Estado
  isInitialized: boolean;
  permissions: NotificationPermissionStatus | null;
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
  expoPushToken: string | null;
  
  // Acciones
  initialize: () => Promise<boolean>;
  requestPermissions: () => Promise<NotificationPermissionStatus>;
  showLocalNotification: (payload: LocalNotificationPayload) => Promise<string | null>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<boolean>;
  clearBadge: () => Promise<void>;
  reset: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const defaultPreferences: NotificationPreferences = {
  chatMessages: true,
  travelUpdates: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Estados
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissions, setPermissions] = useState<NotificationPermissionStatus | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  
  // Referencias
  const appState = useRef(AppState.currentState);
  const notificationListenersRef = useRef<(() => void) | null>(null);
  const initializationAttempted = useRef(false);

  /**
   * Inicializa el servicio de notificaciones
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    if (isInitialized || !isAuthenticated || initializationAttempted.current) {
      return isInitialized;
    }

    setLoading(true);
    setError(null);
    initializationAttempted.current = true;

    try {
      console.log('Inicializando servicio de notificaciones...');
      
      const success = await notificationService.initialize();
      
      if (success) {
        const token = notificationService.getCurrentToken();
        const permissionStatus = await notificationService.requestPermissions();
        
        setExpoPushToken(token);
        setPermissions(permissionStatus);
        setIsInitialized(true);
        
        console.log('Servicio de notificaciones inicializado exitosamente');
        return true;
      } else {
        setError('No se pudo inicializar el servicio de notificaciones');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error al inicializar notificaciones:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isInitialized]);

  /**
   * Solicita permisos de notificación
   */
  const requestPermissions = useCallback(async (): Promise<NotificationPermissionStatus> => {
    setLoading(true);
    setError(null);

    try {
      const permissionStatus = await notificationService.requestPermissions();
      setPermissions(permissionStatus);
      return permissionStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al solicitar permisos';
      setError(errorMessage);
      console.error('Error al solicitar permisos:', err);
      return {
        granted: false,
        canAskAgain: false,
        status: Notifications.PermissionStatus.DENIED,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Muestra una notificación local
   */
  const showLocalNotification = useCallback(async (payload: LocalNotificationPayload): Promise<string | null> => {
    try {
      // Verificar si las notificaciones están habilitadas para este tipo
      if (payload.data?.type === 'chat_message' && !preferences.chatMessages) {
        return null;
      }
      if (payload.data?.type === 'travel_update' && !preferences.travelUpdates) {
        return null;
      }

      // Verificar horarios de silencio
      if (preferences.quietHoursEnabled && isInQuietHours()) {
        console.log('Notificación omitida por horario de silencio');
        return null;
      }

      return await notificationService.showLocalNotification(payload);
    } catch (err) {
      console.error('Error al mostrar notificación local:', err);
      return null;
    }
  }, [preferences]);

  /**
   * Actualiza las preferencias de notificación
   */
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      const success = await notificationService.updateNotificationPreferences(updatedPreferences);
      
      if (success) {
        setPreferences(updatedPreferences);
        return true;
      } else {
        setError('No se pudieron actualizar las preferencias');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar preferencias';
      setError(errorMessage);
      console.error('Error al actualizar preferencias:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [preferences]);

  /**
   * Limpia el badge de la aplicación
   */
  const clearBadge = useCallback(async (): Promise<void> => {
    try {
      await notificationService.clearBadge();
    } catch (err) {
      console.error('Error al limpiar badge:', err);
    }
  }, []);

  /**
   * Reinicia el servicio de notificaciones
   */
  const reset = useCallback(async (): Promise<void> => {
    try {
      await notificationService.reset();
      setIsInitialized(false);
      setPermissions(null);
      setExpoPushToken(null);
      setPreferences(defaultPreferences);
      setError(null);
      initializationAttempted.current = false;
      
      // Limpiar listeners
      if (notificationListenersRef.current) {
        notificationListenersRef.current();
        notificationListenersRef.current = null;
      }
      
      console.log('Contexto de notificaciones reiniciado');
    } catch (err) {
      console.error('Error al reiniciar contexto de notificaciones:', err);
    }
  }, []);

  /**
   * Verifica si está en horario de silencio
   */
  const isInQuietHours = useCallback((): boolean => {
    if (!preferences.quietHoursEnabled || !preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Si el horario de fin es menor que el de inicio, asumimos que cruza la medianoche
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }, [preferences.quietHoursEnabled, preferences.quietHoursStart, preferences.quietHoursEnd]);

  /**
   * Maneja las notificaciones recibidas
   */
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('Notificación recibida en contexto:', notification);
    
    const data = notification.request.content.data as PushNotificationData;
    
    // Si la app está en primer plano y es un mensaje de chat, podríamos no mostrar la notificación
    // ya que el usuario probablemente ya ve el mensaje en la interfaz
    if (appState.current === 'active' && data?.type === 'chat_message') {
      // El Socket.IO ya debería haber actualizado la interfaz
      return;
    }
  }, []);

  /**
   * Maneja cuando el usuario toca una notificación
   */
  const handleNotificationTapped = useCallback((response: Notifications.NotificationResponse) => {
    console.log('Usuario tocó notificación:', response);
    
    const data = response.notification.request.content.data as PushNotificationData;
    
    // Aquí podrías navegar a la pantalla específica según el tipo de notificación
    if (data?.type === 'chat_message' && data.travelId) {
      // Navegar al chat del viaje
      console.log('Navegando al chat del viaje:', data.travelId);
      // TODO: Implementar navegación cuando se integre con el router
    } else if (data?.type === 'travel_update' && data.travelId) {
      // Navegar a los detalles del viaje
      console.log('Navegando a detalles del viaje:', data.travelId);
      // TODO: Implementar navegación cuando se integre con el router
    }
  }, []);

  /**
   * Configura los listeners de notificaciones
   */
  const setupNotificationListeners = useCallback(() => {
    if (notificationListenersRef.current) {
      return; // Ya están configurados
    }

    const cleanup = notificationService.setupNotificationListeners(
      handleNotificationReceived,
      handleNotificationTapped
    );

    notificationListenersRef.current = cleanup;
  }, [handleNotificationReceived, handleNotificationTapped]);

  // Efectos
  /**
   * Inicializar cuando el usuario se autentica
   */
  useEffect(() => {
    if (isAuthenticated && user && !initializationAttempted.current) {
      initialize();
    } else if (!isAuthenticated) {
      reset();
    }
  }, [isAuthenticated, user, initialize, reset]);

  /**
   * Configurar listeners de notificaciones cuando se inicializa
   */
  useEffect(() => {
    if (isInitialized) {
      setupNotificationListeners();
    }

    return () => {
      if (notificationListenersRef.current) {
        notificationListenersRef.current();
        notificationListenersRef.current = null;
      }
    };
  }, [isInitialized, setupNotificationListeners]);

  /**
   * Monitorear cambios en el estado de la app
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      
      if (nextAppState === 'active' && isInitialized) {
        // Limpiar badge cuando la app pasa a primer plano
        clearBadge();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, [isInitialized, clearBadge]);

  /**
   * Limpiar al desmontar
   */
  useEffect(() => {
    return () => {
      if (notificationListenersRef.current) {
        notificationListenersRef.current();
      }
    };
  }, []);

  // Valor del contexto
  const value = useMemo<NotificationContextValue>(
    () => ({
      isInitialized,
      permissions,
      preferences,
      loading,
      error,
      expoPushToken,
      initialize,
      requestPermissions,
      showLocalNotification,
      updatePreferences,
      clearBadge,
      reset,
    }),
    [
      isInitialized,
      permissions,
      preferences,
      loading,
      error,
      expoPushToken,
      initialize,
      requestPermissions,
      showLocalNotification,
      updatePreferences,
      clearBadge,
      reset,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext debe usarse dentro de un NotificationProvider');
  }
  return context;
};
