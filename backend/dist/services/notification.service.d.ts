import { type BatchPushResult, type PushNotificationData } from '../utils/pushNotification.js';
export interface SendChatNotificationParams {
    travelId: number;
    senderId: number;
    senderName: string;
    messageText: string;
    excludeUserIds?: number[];
}
export interface SendTravelNotificationParams {
    travelId: number;
    title: string;
    body: string;
    targetUserIds?: number[];
    excludeUserIds?: number[];
    notificationType?: string;
    data?: Partial<PushNotificationData>;
}
export interface NotificationPreferences {
    chatMessages: boolean;
    travelUpdates: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
}
export interface RegisterTokenParams {
    userId: number;
    expoPushToken: string;
    platform: string;
    deviceName?: string;
}
export declare class NotificationService {
    private isReceiptCheckingEnabled;
    constructor();
    /**
     * Registra un token de Expo Push para un usuario
     */
    registerExpoPushToken(params: RegisterTokenParams): Promise<boolean>;
    /**
     * Actualiza las preferencias de notificación de un usuario
     */
    updateNotificationPreferences(userId: number, preferences: NotificationPreferences): Promise<boolean>;
    /**
     * Envía notificaciones de chat a los participantes de un viaje
     */
    sendChatNotification(params: SendChatNotificationParams): Promise<BatchPushResult>;
    /**
     * Envía notificaciones de actualización de viaje
     */
    sendTravelNotification(params: SendTravelNotificationParams): Promise<BatchPushResult>;
    private getDeepLinkBase;
    private buildDeepLink;
    private buildChatDeepLink;
    /**
     * Obtiene los participantes de un viaje (conductor + pasajeros confirmados)
     */
    private getTravelParticipants;
    /**
     * Verifica si un usuario está en horario de silencio
     */
    private isInQuietHours;
    /**
     * Guarda el historial de notificaciones
     */
    private saveNotificationHistory;
    /**
     * Limpia tokens inválidos de usuarios
     */
    cleanupInvalidTokens(invalidTokens: string[]): Promise<void>;
    /**
     * Inicializa el verificador de recibos programado
     */
    private initializeReceiptChecker;
    /**
     * Verifica recibos pendientes de notificaciones
     */
    private checkPendingReceipts;
    /**
     * Obtiene estadísticas de notificaciones
     */
    getNotificationStats(userId?: number): Promise<any>;
}
export default NotificationService;
//# sourceMappingURL=notification.service.d.ts.map