import cron from 'node-cron';
import { PrismaClient } from '../../generated/prisma/index.js';
import pushNotificationUtils from '../utils/pushNotification.js';
const prisma = new PrismaClient();
export class NotificationService {
    isReceiptCheckingEnabled = true;
    constructor() {
        this.initializeReceiptChecker();
    }
    /**
     * Registra un token de Expo Push para un usuario
     */
    async registerExpoPushToken(params) {
        try {
            // Validar token
            if (!pushNotificationUtils.isValidExpoPushToken(params.expoPushToken)) {
                console.error('Token de Expo Push inválido:', params.expoPushToken);
                return false;
            }
            // Actualizar usuario con nuevo token
            await prisma.user.update({
                where: { id: params.userId },
                data: {
                    expo_push_token: params.expoPushToken,
                    last_active_at: new Date(),
                },
            });
            console.log(`Token registrado para usuario ${params.userId}: ${params.expoPushToken.substring(0, 20)}...`);
            return true;
        }
        catch (error) {
            console.error('Error al registrar token de Expo Push:', error);
            return false;
        }
    }
    /**
     * Actualiza las preferencias de notificación de un usuario
     */
    async updateNotificationPreferences(userId, preferences) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    notifications_enabled: true, // Si actualiza preferencias, asumimos que quiere notificaciones
                    chat_notifications_enabled: preferences.chatMessages,
                    travel_notifications_enabled: preferences.travelUpdates,
                    quiet_hours_enabled: preferences.quietHoursEnabled,
                    quiet_hours_start: preferences.quietHoursStart,
                    quiet_hours_end: preferences.quietHoursEnd,
                },
            });
            console.log(`Preferencias actualizadas para usuario ${userId}`);
            return true;
        }
        catch (error) {
            console.error('Error al actualizar preferencias de notificación:', error);
            return false;
        }
    }
    /**
     * Envía notificaciones de chat a los participantes de un viaje
     */
    async sendChatNotification(params) {
        try {
            console.log(`Enviando notificación de chat para viaje ${params.travelId}`);
            // Obtener participantes del viaje
            const participants = await this.getTravelParticipants(params.travelId, params.excludeUserIds || [params.senderId]);
            if (participants.length === 0) {
                console.log('No hay participantes elegibles para notificación de chat');
                return {
                    totalSent: 0,
                    successful: 0,
                    failed: 0,
                    tickets: [],
                    errors: [],
                };
            }
            // Filtrar usuarios que tienen notificaciones de chat habilitadas
            const eligibleUsers = participants.filter(user => user.expo_push_token &&
                user.notifications_enabled &&
                user.chat_notifications_enabled &&
                !this.isInQuietHours(user) &&
                pushNotificationUtils.isValidExpoPushToken(user.expo_push_token));
            if (eligibleUsers.length === 0) {
                console.log('No hay usuarios elegibles con tokens válidos para notificación de chat');
                return {
                    totalSent: 0,
                    successful: 0,
                    failed: 0,
                    tickets: [],
                    errors: [],
                };
            }
            // Crear mensajes para Expo Push
            const messages = eligibleUsers.map(user => {
                const targetRole = user.IsDriver ? 'driver' : 'passenger';
                const deepLink = this.buildChatDeepLink(targetRole === 'driver', params.travelId);
                return pushNotificationUtils.createChatMessage(user.expo_push_token, params.senderName, params.messageText, params.travelId, params.senderId, {
                    deepLink,
                    targetRole,
                });
            });
            // Enviar notificaciones
            const result = await pushNotificationUtils.sendBatchNotifications(messages);
            // Guardar historial de notificaciones
            await this.saveNotificationHistory(eligibleUsers.map(user => user.id), 'chat_message', `Mensaje de ${params.senderName}`, params.messageText, {
                type: 'chat_message',
                travelId: params.travelId,
                senderId: params.senderId,
                senderName: params.senderName,
            });
            console.log(`Notificación de chat enviada: ${result.successful}/${result.totalSent} exitosas`);
            return result;
        }
        catch (error) {
            console.error('Error al enviar notificación de chat:', error);
            return {
                totalSent: 0,
                successful: 0,
                failed: 0,
                tickets: [],
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
            };
        }
    }
    /**
     * Envía notificaciones de actualización de viaje
     */
    async sendTravelNotification(params) {
        try {
            console.log(`Enviando notificación de viaje para viaje ${params.travelId}`);
            let targetUsers;
            if (params.targetUserIds) {
                // Enviar a usuarios específicos
                targetUsers = await prisma.user.findMany({
                    where: {
                        id: { in: params.targetUserIds },
                        ...(params.excludeUserIds && { id: { notIn: params.excludeUserIds } }),
                    },
                });
            }
            else {
                // Enviar a todos los participantes del viaje
                targetUsers = await this.getTravelParticipants(params.travelId, params.excludeUserIds);
            }
            if (targetUsers.length === 0) {
                console.log('No hay usuarios objetivo para notificación de viaje');
                return {
                    totalSent: 0,
                    successful: 0,
                    failed: 0,
                    tickets: [],
                    errors: [],
                };
            }
            // Filtrar usuarios elegibles
            const eligibleUsers = targetUsers.filter(user => user.expo_push_token &&
                user.notifications_enabled &&
                user.travel_notifications_enabled &&
                !this.isInQuietHours(user) &&
                pushNotificationUtils.isValidExpoPushToken(user.expo_push_token));
            if (eligibleUsers.length === 0) {
                console.log('No hay usuarios elegibles para notificación de viaje');
                return {
                    totalSent: 0,
                    successful: 0,
                    failed: 0,
                    tickets: [],
                    errors: [],
                };
            }
            const requestedType = params.data?.type
                ?? params.notificationType
                ?? 'travel_update';
            const notificationData = {
                ...(params.data || {}),
                type: requestedType,
                travelId: params.data?.travelId ?? params.travelId,
            };
            // Crear mensajes
            const messages = eligibleUsers.map(user => pushNotificationUtils.createTravelUpdateMessage(user.expo_push_token, params.title, params.body, params.travelId, notificationData.type, notificationData));
            // Enviar notificaciones
            const result = await pushNotificationUtils.sendBatchNotifications(messages);
            // Guardar historial
            await this.saveNotificationHistory(eligibleUsers.map(user => user.id), notificationData.type, params.title, params.body, notificationData);
            console.log(`Notificación de viaje enviada: ${result.successful}/${result.totalSent} exitosas`);
            return result;
        }
        catch (error) {
            console.error('Error al enviar notificación de viaje:', error);
            return {
                totalSent: 0,
                successful: 0,
                failed: 0,
                tickets: [],
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
            };
        }
    }
    getDeepLinkBase() {
        const raw = process.env.APP_DEEP_LINK_BASE ||
            process.env.APP_SCHEME ||
            'urturn://';
        if (raw.includes('://')) {
            return raw.endsWith('/') ? raw : raw;
        }
        return `${raw}://`;
    }
    buildDeepLink(path, params) {
        const base = this.getDeepLinkBase();
        const normalizedPath = path.replace(/^\/+/, '');
        const search = params ? new URLSearchParams(params).toString() : '';
        return search ? `${base}${normalizedPath}?${search}` : `${base}${normalizedPath}`;
    }
    buildChatDeepLink(isDriverTarget, travelId) {
        const path = isDriverTarget ? 'Driver/DriverChat' : 'Passenger/PassengerChat';
        return this.buildDeepLink(path, { travelId: String(travelId) });
    }
    /**
     * Obtiene los participantes de un viaje (conductor + pasajeros confirmados)
     */
    async getTravelParticipants(travelId, excludeUserIds = []) {
        try {
            // Obtener información del viaje y conductor
            const travel = await prisma.travel.findUnique({
                where: { id: travelId },
                include: {
                    driver_id: true,
                    confirmations: {
                        include: {
                            usuario: true,
                        },
                    },
                },
            });
            if (!travel) {
                console.error(`Viaje no encontrado: ${travelId}`);
                return [];
            }
            const participants = [];
            // Agregar conductor si no está excluido
            if (!excludeUserIds.includes(travel.driver_id.id)) {
                participants.push(travel.driver_id);
            }
            // Agregar pasajeros confirmados
            travel.confirmations.forEach(confirmation => {
                if (!excludeUserIds.includes(confirmation.usuario.id)) {
                    participants.push(confirmation.usuario);
                }
            });
            return participants;
        }
        catch (error) {
            console.error('Error al obtener participantes del viaje:', error);
            return [];
        }
    }
    /**
     * Verifica si un usuario está en horario de silencio
     */
    isInQuietHours(user) {
        if (!user.quiet_hours_enabled || !user.quiet_hours_start || !user.quiet_hours_end) {
            return false;
        }
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHour, startMin] = user.quiet_hours_start.split(':').map(Number);
        const [endHour, endMin] = user.quiet_hours_end.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        // Si el horario de fin es menor que el de inicio, cruza la medianoche
        if (endTime < startTime) {
            return currentTime >= startTime || currentTime <= endTime;
        }
        else {
            return currentTime >= startTime && currentTime <= endTime;
        }
    }
    /**
     * Guarda el historial de notificaciones
     */
    async saveNotificationHistory(userIds, type, title, body, data) {
        try {
            const notifications = userIds.map(userId => ({
                userId,
                type,
                title,
                body,
                data: data, // Prisma Json type
                sent: true,
                sent_at: new Date(),
            }));
            await prisma.notificationHistory.createMany({
                data: notifications,
            });
            console.log(`Historial de notificaciones guardado para ${userIds.length} usuarios`);
        }
        catch (error) {
            console.error('Error al guardar historial de notificaciones:', error);
        }
    }
    /**
     * Limpia tokens inválidos de usuarios
     */
    async cleanupInvalidTokens(invalidTokens) {
        try {
            if (invalidTokens.length === 0)
                return;
            await prisma.user.updateMany({
                where: {
                    expo_push_token: { in: invalidTokens },
                },
                data: {
                    expo_push_token: null,
                },
            });
            console.log(`Limpiados ${invalidTokens.length} tokens inválidos`);
        }
        catch (error) {
            console.error('Error al limpiar tokens inválidos:', error);
        }
    }
    /**
     * Inicializa el verificador de recibos programado
     */
    initializeReceiptChecker() {
        if (!this.isReceiptCheckingEnabled)
            return;
        // Verificar recibos cada 30 minutos
        cron.schedule('*/30 * * * *', async () => {
            try {
                console.log('Iniciando verificación programada de recibos de notificaciones...');
                await this.checkPendingReceipts();
            }
            catch (error) {
                console.error('Error en verificación programada de recibos:', error);
            }
        });
        console.log('Verificador de recibos de notificaciones inicializado');
    }
    /**
     * Verifica recibos pendientes de notificaciones
     */
    async checkPendingReceipts() {
        try {
            // Obtener notificaciones enviadas en las últimas 24 horas sin verificar
            const pendingNotifications = await prisma.notificationHistory.findMany({
                where: {
                    sent: true,
                    expo_push_receipt_id: null,
                    sent_at: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
                    },
                },
                take: 100, // Procesar en lotes
            });
            if (pendingNotifications.length === 0) {
                console.log('No hay recibos pendientes para verificar');
                return;
            }
            // Los tickets deberían estar en los datos de la notificación
            // Por ahora, simplemente marcamos como procesadas
            // En una implementación completa, guardarías los ticket IDs al enviar
            console.log(`Procesadas ${pendingNotifications.length} notificaciones pendientes`);
        }
        catch (error) {
            console.error('Error al verificar recibos pendientes:', error);
        }
    }
    /**
     * Obtiene estadísticas de notificaciones
     */
    async getNotificationStats(userId) {
        try {
            const where = userId ? { userId } : {};
            const stats = await prisma.notificationHistory.groupBy({
                by: ['type', 'sent'],
                where: {
                    ...where,
                    created_at: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
                    },
                },
                _count: {
                    id: true,
                },
            });
            return stats;
        }
        catch (error) {
            console.error('Error al obtener estadísticas de notificaciones:', error);
            return [];
        }
    }
}
export default NotificationService;
//# sourceMappingURL=notification.service.js.map