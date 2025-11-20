import { ExpoPushMessage, ExpoPushReceipt, ExpoPushReceiptId, ExpoPushTicket } from 'expo-server-sdk';
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
    receipts: {
        [id: string]: ExpoPushReceipt;
    };
    errors: string[];
}
declare class PushNotificationUtils {
    private expo;
    constructor();
    /**
     * Valida si un token es válido para Expo Push
     */
    isValidExpoPushToken(token: string): boolean;
    /**
     * Envía una notificación push a un solo usuario
     */
    sendSingleNotification(payload: PushNotificationPayload): Promise<PushNotificationResult>;
    /**
     * Envía notificaciones push en lote
     */
    sendBatchNotifications(messages: ExpoPushMessage[]): Promise<BatchPushResult>;
    /**
     * Verifica los recibos de notificaciones enviadas
     */
    checkReceipts(ticketIds: ExpoPushReceiptId[]): Promise<ReceiptCheckResult>;
    /**
     * Crea un mensaje de chat para Expo Push
     */
    createChatMessage(token: string, senderName: string, messageText: string, travelId: number, senderId: number, extraData?: Partial<PushNotificationData>): ExpoPushMessage;
    /**
     * Crea un mensaje de actualización de viaje para Expo Push
     */
    createTravelUpdateMessage(token: string, title: string, body: string, travelId: number, updateType?: string, extraData?: Partial<PushNotificationData>): ExpoPushMessage;
    /**
     * Limpia tokens inválidos basándose en los recibos
     */
    getInvalidTokensFromReceipts(receipts: {
        [id: string]: ExpoPushReceipt;
    }): string[];
    /**
     * Utilidad para dividir arrays en chunks
     */
    private chunkArray;
    /**
     * Verifica si el servicio de Expo está disponible
     */
    isServiceAvailable(): Promise<boolean>;
}
export declare const pushNotificationUtils: PushNotificationUtils;
export default pushNotificationUtils;
//# sourceMappingURL=pushNotification.d.ts.map