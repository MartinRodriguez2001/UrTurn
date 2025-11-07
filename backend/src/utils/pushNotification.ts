import { Expo, ExpoPushMessage, ExpoPushReceipt, ExpoPushReceiptId, ExpoPushTicket } from 'expo-server-sdk';

export interface PushNotificationData {
  type: 'chat_message' | 'travel_update' | 'travel_request';
  travelId?: number;
  senderId?: number;
  senderName?: string;
  message?: string;
  [key: string]: any;
}

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: PushNotificationData;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

export interface PushNotificationResult {
  success: boolean;
  ticketId?: string;
  error?: string;
  details?: any;
}

export interface BatchPushResult {
  totalSent: number;
  successful: number;
  failed: number;
  tickets: ExpoPushTicket[];
  errors: string[];
}

export interface ReceiptCheckResult {
  successful: number;
  failed: number;
  receipts: { [id: string]: ExpoPushReceipt };
  errors: string[];
}

class PushNotificationUtils {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true, // Usar FCM v1 API (recomendado)
    });
  }

  /**
   * Valida si un token es válido para Expo Push
   */
  isValidExpoPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  /**
   * Envía una notificación push a un solo usuario
   */
  async sendSingleNotification(payload: PushNotificationPayload): Promise<PushNotificationResult> {
    try {
      // Validar token
      const tokens = Array.isArray(payload.to) ? payload.to : [payload.to];
      const validTokens = tokens.filter(token => this.isValidExpoPushToken(token));

      if (validTokens.length === 0) {
        return {
          success: false,
          error: 'No hay tokens válidos para enviar notificación',
        };
      }

      // Preparar mensaje
      const message: ExpoPushMessage = {
        to: validTokens,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        sound: payload.sound || 'default',
        badge: payload.badge,
        channelId: payload.channelId,
        priority: payload.priority || 'high',
        ttl: payload.ttl || 3600, // 1 hora por defecto
      };

      // Enviar
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      
      if (tickets.length === 0) {
        return {
          success: false,
          error: 'No se recibieron tickets de respuesta',
        };
      }

      const ticket = tickets[0];
      if (!ticket) {
        return {
          success: false,
          error: 'Ticket de respuesta inválido',
        };
      }

      if (ticket.status === 'ok') {
        return {
          success: true,
          ticketId: (ticket as any).id, // Expo SDK typing issue
        };
      } else {
        return {
          success: false,
          error: (ticket as any).message || 'Error desconocido al enviar notificación',
          details: (ticket as any).details,
        };
      }
    } catch (error) {
      console.error('Error al enviar notificación push:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Envía notificaciones push en lote
   */
  async sendBatchNotifications(messages: ExpoPushMessage[]): Promise<BatchPushResult> {
    const result: BatchPushResult = {
      totalSent: 0,
      successful: 0,
      failed: 0,
      tickets: [],
      errors: [],
    };

    try {
      // Validar tokens en todos los mensajes
      const validMessages = messages.filter(message => {
        const tokens = Array.isArray(message.to) ? message.to : [message.to];
        return tokens.some(token => this.isValidExpoPushToken(token));
      });

      if (validMessages.length === 0) {
        result.errors.push('No hay mensajes con tokens válidos');
        return result;
      }

      // Dividir en chunks si es necesario (Expo recomienda máximo 100 por lote)
      const chunks = this.chunkArray(validMessages, 100);
      
      for (const chunk of chunks) {
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          result.tickets.push(...tickets);
          result.totalSent += chunk.length;

          // Contar éxitos y fallos
          tickets.forEach(ticket => {
            if (ticket.status === 'ok') {
              result.successful++;
            } else {
              result.failed++;
              result.errors.push(ticket.message || 'Error desconocido');
            }
          });

        } catch (chunkError) {
          result.failed += chunk.length;
          result.errors.push(chunkError instanceof Error ? chunkError.message : 'Error en chunk');
        }
      }

      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Error desconocido');
      return result;
    }
  }

  /**
   * Verifica los recibos de notificaciones enviadas
   */
  async checkReceipts(ticketIds: ExpoPushReceiptId[]): Promise<ReceiptCheckResult> {
    const result: ReceiptCheckResult = {
      successful: 0,
      failed: 0,
      receipts: {},
      errors: [],
    };

    try {
      if (ticketIds.length === 0) {
        return result;
      }

      // Dividir en chunks si es necesario
      const chunks = this.chunkArray(ticketIds, 300); // Expo recomienda máximo 300 por consulta

      for (const chunk of chunks) {
        try {
          const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
          
          Object.assign(result.receipts, receipts);

          // Procesar resultados
          Object.entries(receipts).forEach(([ticketId, receipt]) => {
            if (receipt.status === 'ok') {
              result.successful++;
            } else if (receipt.status === 'error') {
              result.failed++;
              const errorMsg = `Ticket ${ticketId}: ${receipt.message || 'Error desconocido'}`;
              result.errors.push(errorMsg);
              
              // Log errores específicos para debugging
              if (receipt.details?.error) {
                console.error(`Error detallado para ticket ${ticketId}:`, receipt.details.error);
              }
            }
          });

        } catch (chunkError) {
          result.errors.push(chunkError instanceof Error ? chunkError.message : 'Error al verificar chunk de recibos');
        }
      }

      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Error al verificar recibos');
      return result;
    }
  }

  /**
   * Crea un mensaje de chat para Expo Push
   */
  createChatMessage(
    token: string,
    senderName: string,
    messageText: string,
    travelId: number,
    senderId: number
  ): ExpoPushMessage {
    const truncatedMessage = messageText.length > 50 
      ? `${messageText.substring(0, 50)}...` 
      : messageText;

    return {
      to: token,
      title: `Mensaje de ${senderName}`,
      body: truncatedMessage,
      data: {
        type: 'chat_message',
        travelId,
        senderId,
        senderName,
        message: messageText,
      },
      sound: 'default',
      badge: 1,
      channelId: 'chat-messages',
      priority: 'high',
      ttl: 3600, // 1 hora
    };
  }

  /**
   * Crea un mensaje de actualización de viaje para Expo Push
   */
  createTravelUpdateMessage(
    token: string,
    title: string,
    body: string,
    travelId: number,
    updateType: string = 'travel_update'
  ): ExpoPushMessage {
    return {
      to: token,
      title,
      body,
      data: {
        type: updateType,
        travelId,
      },
      sound: 'default',
      badge: 1,
      channelId: 'travel-updates',
      priority: 'high',
      ttl: 7200, // 2 horas
    };
  }

  /**
   * Limpia tokens inválidos basándose en los recibos
   */
  getInvalidTokensFromReceipts(receipts: { [id: string]: ExpoPushReceipt }): string[] {
    const invalidTokens: string[] = [];

    Object.entries(receipts).forEach(([ticketId, receipt]) => {
      if (receipt.status === 'error') {
        // Errores que indican que el token debe ser removido
        const shouldRemoveToken = [
          'DeviceNotRegistered',
          'InvalidCredentials',
          'MismatchSenderId',
        ].some(errorType => receipt.details?.error === errorType);

        if (shouldRemoveToken && receipt.details?.expoPushToken) {
          invalidTokens.push(receipt.details.expoPushToken);
        }
      }
    });

    return invalidTokens;
  }

  /**
   * Utilidad para dividir arrays en chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Verifica si el servicio de Expo está disponible
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      // Intenta enviar un mensaje de prueba a un token inválido
      // para verificar que el servicio responde
      const testMessage: ExpoPushMessage = {
        to: 'ExponentPushToken[TEST_TOKEN_INVALID]',
        title: 'Test',
        body: 'Test',
      };

      await this.expo.sendPushNotificationsAsync([testMessage]);
      return true;
    } catch (error) {
      // Si hay error de conexión, el servicio no está disponible
      // Si hay error de token inválido, el servicio sí está disponible
      return error instanceof Error && error.message.includes('token');
    }
  }
}

// Exportar instancia singleton
export const pushNotificationUtils = new PushNotificationUtils();
export default pushNotificationUtils;
