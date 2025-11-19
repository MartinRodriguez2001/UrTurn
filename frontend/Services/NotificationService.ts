import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_BASE_URL } from './BaseApiService';

export interface PushNotificationData {
  type: 'chat_message' | 'travel_update' | 'travel_request';
  travelId?: number;
  senderId?: number;
  senderName?: string;
  message?: string;
  deepLink?: string;
  targetRole?: 'driver' | 'passenger';
  [key: string]: any;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

export interface LocalNotificationPayload {
  title: string;
  body: string;
  data?: PushNotificationData;
  sound?: boolean;
  badge?: number;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized: boolean = false;

  constructor() {
    if (this.isPlatformSupported()) {
      this.setupNotificationHandling();
    }
  }

  /**
   * Determina si la plataforma actual soporta las APIs nativas de expo-notifications
   */
  public isPlatformSupported(): boolean {
    return Platform.OS !== 'web';
  }

  /**
   * Configuración inicial del manejo de notificaciones
   */
  private setupNotificationHandling() {
    if (!this.isPlatformSupported()) {
      return;
    }

    // Configurar cómo se muestran las notificaciones cuando la app está en primer plano
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  /**
   * Inicializa el servicio de notificaciones
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.isPlatformSupported()) {
        console.warn('Las notificaciones push nativas no están disponibles en web.');
        return false;
      }

      if (this.isInitialized) {
        return true;
      }

      // Verificar si es un dispositivo físico
      if (!Device.isDevice) {
        console.warn('Las notificaciones push solo funcionan en dispositivos físicos');
        return false;
      }

      // Solicitar permisos
      const permissionResult = await this.requestPermissions();
      if (!permissionResult.granted) {
        console.warn('Permisos de notificación denegados');
        return false;
      }

      // Obtener token de Expo Push
      const token = await this.getExpoPushToken();
      if (!token) {
        console.error('No se pudo obtener el token de Expo Push');
        return false;
      }

      this.expoPushToken = token;
      this.isInitialized = true;

      // Registrar el token en el backend
      await this.registerTokenWithServer(token);

      console.log('NotificationService inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar NotificationService:', error);
      return false;
    }
  }

  /**
   * Solicita permisos de notificación al usuario
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (!this.isPlatformSupported()) {
        return {
          granted: false,
          canAskAgain: false,
          status: Notifications.PermissionStatus.DENIED,
        };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Para Android, configurar canal de notificación
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('chat-messages', {
          name: 'Mensajes de Chat',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('travel-updates', {
          name: 'Actualizaciones de Viaje',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E40AF',
          sound: 'default',
        });
      }

      return {
        granted: finalStatus === 'granted',
        canAskAgain: finalStatus !== 'denied',
        status: finalStatus,
      };
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Notifications.PermissionStatus.UNDETERMINED,
      };
    }
  }

  /**
   * Obtiene el token de Expo Push Notifications
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!this.isPlatformSupported()) {
        console.warn('Expo Push no está disponible en web sin configurar Web Push (VAPID).');
        return null;
      }

      if (this.expoPushToken) {
        return this.expoPushToken;
      }

      // Verificar si ya tenemos un token almacenado
      const storedToken = await AsyncStorage.getItem('expoPushToken');
      if (storedToken) {
        this.expoPushToken = storedToken;
        return storedToken;
      }

      // Obtener nuevo token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      if (token.data) {
        this.expoPushToken = token.data;
        await AsyncStorage.setItem('expoPushToken', token.data);
        return token.data;
      }

      return null;
    } catch (error) {
      console.error('Error al obtener token de Expo Push:', error);
      return null;
    }
  }

  /**
   * Registra el token de notificación en el servidor
   */
  async registerTokenWithServer(token: string): Promise<boolean> {
    try {
      const authToken = await AsyncStorage.getItem('token');
      if (!authToken) {
        console.warn('No hay token de autenticación disponible');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          expoPushToken: token,
          platform: Platform.OS,
          deviceName: Device.deviceName || 'Unknown Device',
        }),
      });

      if (response.ok) {
        console.log('Token registrado exitosamente en el servidor');
        return true;
      } else {
        console.error('Error al registrar token en el servidor:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error al comunicarse con el servidor:', error);
      return false;
    }
  }

  /**
   * Muestra una notificación local
   */
  async showLocalNotification(payload: LocalNotificationPayload): Promise<string | null> {
    try {
      if (!this.isPlatformSupported()) {
        console.warn('Las notificaciones locales no están disponibles en web actualmente.');
        return null;
      }

      const permissions = await this.requestPermissions();
      if (!permissions.granted) {
        console.warn('No se pueden mostrar notificaciones: permisos denegados');
        return null;
      }

      const channelId = payload.data?.type === 'chat_message' ? 'chat-messages' : 'travel-updates';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          sound: payload.sound !== false,
          badge: payload.badge,
        },
        trigger: null, // Mostrar inmediatamente
        ...(Platform.OS === 'android' && { channelId }),
      });

      return notificationId;
    } catch (error) {
      console.error('Error al mostrar notificación local:', error);
      return null;
    }
  }

  /**
   * Cancela todas las notificaciones pendientes
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      if (!this.isPlatformSupported()) {
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Todas las notificaciones pendientes canceladas');
    } catch (error) {
      console.error('Error al cancelar notificaciones:', error);
    }
  }

  /**
   * Limpia el badge de la app
   */
  async clearBadge(): Promise<void> {
    try {
      if (!this.isPlatformSupported()) {
        return;
      }

      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error al limpiar badge:', error);
    }
  }

  /**
   * Actualiza las preferencias de notificación en el servidor
   */
  async updateNotificationPreferences(preferences: {
    chatMessages: boolean;
    travelUpdates: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }): Promise<boolean> {
    try {
      const authToken = await AsyncStorage.getItem('token');
      if (!authToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(preferences),
      });

      return response.ok;
    } catch (error) {
      console.error('Error al actualizar preferencias de notificación:', error);
      return false;
    }
  }

  /**
   * Obtiene el token actual (útil para debugging)
   */
  getCurrentToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Verifica si el servicio está inicializado
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reinicia el servicio (útil para logout/login)
   */
  async reset(): Promise<void> {
    try {
      this.expoPushToken = null;
      this.isInitialized = false;
      await AsyncStorage.removeItem('expoPushToken');
      await this.cancelAllNotifications();
      await this.clearBadge();
      console.log('NotificationService reiniciado');
    } catch (error) {
      console.error('Error al reiniciar NotificationService:', error);
    }
  }

  /**
   * Configura listeners para notificaciones recibidas y acciones del usuario
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    if (!this.isPlatformSupported()) {
      return () => undefined;
    }

    // Listener para notificaciones recibidas mientras la app está abierta
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notificación recibida:', notification);
      onNotificationReceived?.(notification);
    });

    // Listener para cuando el usuario toca una notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Usuario interactuó con notificación:', response);
      onNotificationTapped?.(response);
    });

    // Retornar función de cleanup
    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }
}

// Exportar instancia singleton
export const notificationService = new NotificationService();
export default notificationService;
