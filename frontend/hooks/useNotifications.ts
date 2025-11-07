import { useAuth } from '@/context/authContext';
import { useChat } from '@/context/chatContext';
import { useNotificationContext } from '@/context/notificationContext';
import type {
    LocalNotificationPayload,
    NotificationPermissionStatus
} from '@/Services/NotificationService';
import { useCallback, useMemo } from 'react';
import { AppState } from 'react-native';

interface NotificationHookActions {
  // Inicialización y permisos
  initialize: () => Promise<boolean>;
  requestPermissions: () => Promise<NotificationPermissionStatus>;
  
  // Notificaciones
  showChatNotification: (params: {
    senderName: string;
    message: string;
    travelId: number;
    senderId: number;
  }) => Promise<string | null>;
  
  showTravelNotification: (params: {
    title: string;
    message: string;
    travelId: number;
    type?: 'travel_request' | 'travel_update';
  }) => Promise<string | null>;
  
  // Configuración
  enableChatNotifications: () => Promise<boolean>;
  disableChatNotifications: () => Promise<boolean>;
  enableTravelNotifications: () => Promise<boolean>;
  disableTravelNotifications: () => Promise<boolean>;
  
  setQuietHours: (enabled: boolean, start?: string, end?: string) => Promise<boolean>;
  
  // Utilidades
  clearBadge: () => Promise<void>;
  reset: () => Promise<void>;
}

interface NotificationHookState {
  isInitialized: boolean;
  hasPermissions: boolean;
  loading: boolean;
  error: string | null;
  expoPushToken: string | null;
  chatNotificationsEnabled: boolean;
  travelNotificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  canRequestPermissions: boolean;
}

export const useNotifications = (): NotificationHookState & NotificationHookActions => {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useChat();
  const {
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
  } = useNotificationContext();

  // Estado computado
  const state = useMemo<NotificationHookState>(() => ({
    isInitialized,
    hasPermissions: permissions?.granted ?? false,
    loading,
    error,
    expoPushToken,
    chatNotificationsEnabled: preferences.chatMessages,
    travelNotificationsEnabled: preferences.travelUpdates,
    quietHoursEnabled: preferences.quietHoursEnabled,
    canRequestPermissions: permissions?.canAskAgain ?? true,
  }), [
    isInitialized,
    permissions,
    loading,
    error,
    expoPushToken,
    preferences,
  ]);

  // Acciones

  /**
   * Muestra una notificación de chat
   */
  const showChatNotification = useCallback(async (params: {
    senderName: string;
    message: string;
    travelId: number;
    senderId: number;
  }): Promise<string | null> => {
    // No mostrar notificación si la app está en primer plano y el socket está conectado
    if (AppState.currentState === 'active' && isConnected) {
      console.log('Omitiendo notificación de chat: app en primer plano y socket conectado');
      return null;
    }

    // No mostrar si las notificaciones de chat están deshabilitadas
    if (!preferences.chatMessages) {
      console.log('Notificaciones de chat deshabilitadas');
      return null;
    }

    const payload: LocalNotificationPayload = {
      title: `Mensaje de ${params.senderName}`,
      body: params.message.length > 50 
        ? `${params.message.substring(0, 50)}...` 
        : params.message,
      data: {
        type: 'chat_message',
        travelId: params.travelId,
        senderId: params.senderId,
        senderName: params.senderName,
        message: params.message,
      },
      sound: true,
      badge: 1,
    };

    return await showLocalNotification(payload);
  }, [preferences.chatMessages, isConnected, showLocalNotification]);

  /**
   * Muestra una notificación de viaje
   */
  const showTravelNotification = useCallback(async (params: {
    title: string;
    message: string;
    travelId: number;
    type?: 'travel_request' | 'travel_update';
  }): Promise<string | null> => {
    // No mostrar si las notificaciones de viaje están deshabilitadas
    if (!preferences.travelUpdates) {
      console.log('Notificaciones de viaje deshabilitadas');
      return null;
    }

    const payload: LocalNotificationPayload = {
      title: params.title,
      body: params.message,
      data: {
        type: params.type || 'travel_update',
        travelId: params.travelId,
      },
      sound: true,
      badge: 1,
    };

    return await showLocalNotification(payload);
  }, [preferences.travelUpdates, showLocalNotification]);

  /**
   * Habilita las notificaciones de chat
   */
  const enableChatNotifications = useCallback(async (): Promise<boolean> => {
    if (!state.hasPermissions) {
      const permissionResult = await requestPermissions();
      if (!permissionResult.granted) {
        return false;
      }
    }

    return await updatePreferences({ chatMessages: true });
  }, [state.hasPermissions, requestPermissions, updatePreferences]);

  /**
   * Deshabilita las notificaciones de chat
   */
  const disableChatNotifications = useCallback(async (): Promise<boolean> => {
    return await updatePreferences({ chatMessages: false });
  }, [updatePreferences]);

  /**
   * Habilita las notificaciones de viaje
   */
  const enableTravelNotifications = useCallback(async (): Promise<boolean> => {
    if (!state.hasPermissions) {
      const permissionResult = await requestPermissions();
      if (!permissionResult.granted) {
        return false;
      }
    }

    return await updatePreferences({ travelUpdates: true });
  }, [state.hasPermissions, requestPermissions, updatePreferences]);

  /**
   * Deshabilita las notificaciones de viaje
   */
  const disableTravelNotifications = useCallback(async (): Promise<boolean> => {
    return await updatePreferences({ travelUpdates: false });
  }, [updatePreferences]);

  /**
   * Configura horarios de silencio
   */
  const setQuietHours = useCallback(async (
    enabled: boolean, 
    start?: string, 
    end?: string
  ): Promise<boolean> => {
    const updates: Partial<typeof preferences> = {
      quietHoursEnabled: enabled,
    };

    if (enabled && start && end) {
      updates.quietHoursStart = start;
      updates.quietHoursEnd = end;
    }

    return await updatePreferences(updates);
  }, [updatePreferences]);

  // Acciones con validaciones adicionales

  /**
   * Inicializa el servicio con validaciones
   */
  const initializeWithValidation = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      console.warn('No se puede inicializar notificaciones: usuario no autenticado');
      return false;
    }

    return await initialize();
  }, [isAuthenticated, initialize]);

  /**
   * Solicita permisos con manejo de errores mejorado
   */
  const requestPermissionsWithFeedback = useCallback(async (): Promise<NotificationPermissionStatus> => {
    try {
      const result = await requestPermissions();
      
      if (!result.granted && !result.canAskAgain) {
        console.warn('Permisos de notificación denegados permanentemente');
        // Aquí podrías mostrar un modal para dirigir al usuario a configuración
      }
      
      return result;
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      throw error;
    }
  }, [requestPermissions]);

  /**
   * Limpia badge con logging
   */
  const clearBadgeWithLogging = useCallback(async (): Promise<void> => {
    try {
      await clearBadge();
      console.log('Badge limpiado exitosamente');
    } catch (error) {
      console.error('Error al limpiar badge:', error);
    }
  }, [clearBadge]);

  /**
   * Reset con cleanup adicional
   */
  const resetWithCleanup = useCallback(async (): Promise<void> => {
    try {
      await reset();
      console.log('Servicio de notificaciones reiniciado');
    } catch (error) {
      console.error('Error al reiniciar servicio de notificaciones:', error);
    }
  }, [reset]);

  return {
    // Estado
    ...state,
    
    // Acciones principales
    initialize: initializeWithValidation,
    requestPermissions: requestPermissionsWithFeedback,
    showChatNotification,
    showTravelNotification,
    
    // Configuración
    enableChatNotifications,
    disableChatNotifications,
    enableTravelNotifications,
    disableTravelNotifications,
    setQuietHours,
    
    // Utilidades
    clearBadge: clearBadgeWithLogging,
    reset: resetWithCleanup,
  };
};

// Hook simplificado para casos de uso específicos
export const useChatNotifications = () => {
  const { 
    showChatNotification, 
    chatNotificationsEnabled, 
    enableChatNotifications, 
    disableChatNotifications 
  } = useNotifications();

  return {
    showChatNotification,
    enabled: chatNotificationsEnabled,
    enable: enableChatNotifications,
    disable: disableChatNotifications,
  };
};

export const useTravelNotifications = () => {
  const { 
    showTravelNotification, 
    travelNotificationsEnabled, 
    enableTravelNotifications, 
    disableTravelNotifications 
  } = useNotifications();

  return {
    showTravelNotification,
    enabled: travelNotificationsEnabled,
    enable: enableTravelNotifications,
    disable: disableTravelNotifications,
  };
};

export default useNotifications;
