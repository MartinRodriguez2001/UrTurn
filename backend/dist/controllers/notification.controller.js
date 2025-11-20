import NotificationService from '../services/notification.service.js';
const notificationService = new NotificationService();
export class NotificationController {
    /**
     * Registra un token de Expo Push para el usuario autenticado
     * POST /api/notifications/register-token
     */
    async registerToken(req, res) {
        try {
            const { expoPushToken, platform, deviceName } = req.body;
            // Validación básica
            if (!expoPushToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de Expo Push requerido',
                });
            }
            if (!platform) {
                return res.status(400).json({
                    success: false,
                    message: 'Plataforma requerida (ios/android)',
                });
            }
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
            }
            const params = {
                userId,
                expoPushToken,
                platform,
                deviceName,
            };
            const success = await notificationService.registerExpoPushToken(params);
            if (success) {
                res.status(200).json({
                    success: true,
                    message: 'Token registrado exitosamente',
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'Error al registrar token. Verifica que el token sea válido.',
                });
            }
        }
        catch (error) {
            console.error('Error en registerToken:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
            });
        }
    }
    /**
     * Actualiza las preferencias de notificación del usuario
     * PUT /api/notifications/preferences
     */
    async updatePreferences(req, res) {
        try {
            const { chatMessages, travelUpdates, quietHoursEnabled, quietHoursStart, quietHoursEnd, } = req.body;
            // Validación de horarios de silencio
            if (quietHoursEnabled) {
                if (!quietHoursStart || !quietHoursEnd) {
                    return res.status(400).json({
                        success: false,
                        message: 'Horarios de inicio y fin son requeridos cuando los horarios de silencio están habilitados',
                    });
                }
                // Validar formato de hora (HH:mm)
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(quietHoursStart) || !timeRegex.test(quietHoursEnd)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Formato de hora inválido. Use HH:mm (ej: 22:00)',
                    });
                }
            }
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
            }
            const preferences = {
                chatMessages: chatMessages ?? true,
                travelUpdates: travelUpdates ?? true,
                quietHoursEnabled: quietHoursEnabled ?? false,
                quietHoursStart,
                quietHoursEnd,
            };
            const success = await notificationService.updateNotificationPreferences(userId, preferences);
            if (success) {
                res.status(200).json({
                    success: true,
                    message: 'Preferencias actualizadas exitosamente',
                    data: preferences,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'Error al actualizar preferencias',
                });
            }
        }
        catch (error) {
            console.error('Error en updatePreferences:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
            });
        }
    }
    /**
     * Obtiene las preferencias de notificación del usuario
     * GET /api/notifications/preferences
     */
    async getPreferences(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
            }
            // Buscar las preferencias del usuario en la base de datos
            const { PrismaClient } = await import('../../generated/prisma/index.js');
            const prisma = new PrismaClient();
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    notifications_enabled: true,
                    chat_notifications_enabled: true,
                    travel_notifications_enabled: true,
                    quiet_hours_enabled: true,
                    quiet_hours_start: true,
                    quiet_hours_end: true,
                    expo_push_token: true,
                },
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
            }
            const preferences = {
                notificationsEnabled: user.notifications_enabled,
                chatMessages: user.chat_notifications_enabled,
                travelUpdates: user.travel_notifications_enabled,
                quietHoursEnabled: user.quiet_hours_enabled,
                quietHoursStart: user.quiet_hours_start,
                quietHoursEnd: user.quiet_hours_end,
                hasToken: !!user.expo_push_token,
            };
            res.status(200).json({
                success: true,
                data: preferences,
            });
            await prisma.$disconnect();
        }
        catch (error) {
            console.error('Error en getPreferences:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
            });
        }
    }
    /**
     * Envía una notificación de prueba al usuario
     * POST /api/notifications/test
     */
    async sendTestNotification(req, res) {
        try {
            const { type = 'travel_update', title, body } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
            }
            if (!title || !body) {
                return res.status(400).json({
                    success: false,
                    message: 'Título y cuerpo de la notificación son requeridos',
                });
            }
            // Enviar notificación de prueba
            const result = await notificationService.sendTravelNotification({
                travelId: 0, // ID ficticio para prueba
                title,
                body,
                targetUserIds: [userId],
                notificationType: type,
            });
            if (result.successful > 0) {
                res.status(200).json({
                    success: true,
                    message: 'Notificación de prueba enviada exitosamente',
                    data: {
                        sent: result.successful,
                        failed: result.failed,
                    },
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo enviar la notificación de prueba',
                    errors: result.errors,
                });
            }
        }
        catch (error) {
            console.error('Error en sendTestNotification:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
            });
        }
    }
    /**
     * Obtiene el historial de notificaciones del usuario
     * GET /api/notifications/history
     */
    async getNotificationHistory(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
            }
            const { limit = 50, offset = 0, type } = req.query;
            const { PrismaClient } = await import('../../generated/prisma/index.js');
            const prisma = new PrismaClient();
            const where = { userId };
            if (type && typeof type === 'string') {
                where.type = type;
            }
            const notifications = await prisma.notificationHistory.findMany({
                where,
                orderBy: {
                    created_at: 'desc',
                },
                take: Number(limit),
                skip: Number(offset),
                select: {
                    id: true,
                    type: true,
                    title: true,
                    body: true,
                    data: true,
                    sent: true,
                    sent_at: true,
                    created_at: true,
                },
            });
            const total = await prisma.notificationHistory.count({
                where,
            });
            res.status(200).json({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        total,
                        limit: Number(limit),
                        offset: Number(offset),
                        hasMore: Number(offset) + Number(limit) < total,
                    },
                },
            });
            await prisma.$disconnect();
        }
        catch (error) {
            console.error('Error en getNotificationHistory:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
            });
        }
    }
    /**
     * Obtiene estadísticas de notificaciones
     * GET /api/notifications/stats
     */
    async getNotificationStats(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
            }
            const stats = await notificationService.getNotificationStats(userId);
            // Procesar estadísticas para formato más amigable
            const processedStats = {
                totalSent: 0,
                totalFailed: 0,
                byType: {},
            };
            stats.forEach((stat) => {
                const { type, sent, _count } = stat;
                const count = _count.id;
                if (!processedStats.byType[type]) {
                    processedStats.byType[type] = { sent: 0, failed: 0 };
                }
                if (sent) {
                    processedStats.byType[type].sent += count;
                    processedStats.totalSent += count;
                }
                else {
                    processedStats.byType[type].failed += count;
                    processedStats.totalFailed += count;
                }
            });
            res.status(200).json({
                success: true,
                data: processedStats,
            });
        }
        catch (error) {
            console.error('Error en getNotificationStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
            });
        }
    }
    /**
     * Desregistra el token de notificación del usuario (logout)
     * DELETE /api/notifications/token
     */
    async unregisterToken(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
            }
            const { PrismaClient } = await import('../../generated/prisma/index.js');
            const prisma = new PrismaClient();
            await prisma.user.update({
                where: { id: userId },
                data: {
                    expo_push_token: null,
                },
            });
            res.status(200).json({
                success: true,
                message: 'Token de notificación desregistrado exitosamente',
            });
            await prisma.$disconnect();
        }
        catch (error) {
            console.error('Error en unregisterToken:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
            });
        }
    }
    /**
     * Endpoint para administradores: enviar notificación a múltiples usuarios
     * POST /api/notifications/broadcast
     */
    async broadcastNotification(req, res) {
        try {
            // TODO: Verificar que el usuario sea administrador
            // Por ahora, solo permitimos a usuarios autenticados
            const { title, body, type = 'travel_update', travelId, targetUserIds, excludeUserIds } = req.body;
            if (!title || !body) {
                return res.status(400).json({
                    success: false,
                    message: 'Título y cuerpo de la notificación son requeridos',
                });
            }
            const result = await notificationService.sendTravelNotification({
                travelId: travelId || 0,
                title,
                body,
                targetUserIds,
                excludeUserIds,
                notificationType: type,
            });
            res.status(200).json({
                success: true,
                message: 'Notificación broadcast enviada',
                data: {
                    totalSent: result.totalSent,
                    successful: result.successful,
                    failed: result.failed,
                    errors: result.errors,
                },
            });
        }
        catch (error) {
            console.error('Error en broadcastNotification:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
            });
        }
    }
}
export default NotificationController;
//# sourceMappingURL=notification.controller.js.map