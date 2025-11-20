import { Router } from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
const notificationController = new NotificationController();
// Todas las rutas requieren autenticación
router.use(authenticateToken);
/**
 * @route POST /api/notifications/register-token
 * @desc Registra un token de Expo Push para el usuario autenticado
 * @access Private
 * @body {
 *   expoPushToken: string,
 *   platform: 'ios' | 'android',
 *   deviceName?: string
 * }
 */
router.post('/register-token', notificationController.registerToken.bind(notificationController));
/**
 * @route PUT /api/notifications/preferences
 * @desc Actualiza las preferencias de notificación del usuario
 * @access Private
 * @body {
 *   chatMessages?: boolean,
 *   travelUpdates?: boolean,
 *   quietHoursEnabled?: boolean,
 *   quietHoursStart?: string,  // Formato "HH:mm"
 *   quietHoursEnd?: string     // Formato "HH:mm"
 * }
 */
router.put('/preferences', notificationController.updatePreferences.bind(notificationController));
/**
 * @route GET /api/notifications/preferences
 * @desc Obtiene las preferencias de notificación del usuario
 * @access Private
 */
router.get('/preferences', notificationController.getPreferences.bind(notificationController));
/**
 * @route POST /api/notifications/test
 * @desc Envía una notificación de prueba al usuario
 * @access Private
 * @body {
 *   type?: 'chat_message' | 'travel_update' | 'travel_request',
 *   title: string,
 *   body: string
 * }
 */
router.post('/test', notificationController.sendTestNotification.bind(notificationController));
/**
 * @route GET /api/notifications/history
 * @desc Obtiene el historial de notificaciones del usuario
 * @access Private
 * @query {
 *   limit?: number,    // Límite de resultados (default: 50)
 *   offset?: number,   // Offset para paginación (default: 0)
 *   type?: string      // Filtrar por tipo de notificación
 * }
 */
router.get('/history', notificationController.getNotificationHistory.bind(notificationController));
/**
 * @route GET /api/notifications/stats
 * @desc Obtiene estadísticas de notificaciones del usuario
 * @access Private
 */
router.get('/stats', notificationController.getNotificationStats.bind(notificationController));
/**
 * @route DELETE /api/notifications/token
 * @desc Desregistra el token de notificación del usuario (logout)
 * @access Private
 */
router.delete('/token', notificationController.unregisterToken.bind(notificationController));
/**
 * @route POST /api/notifications/broadcast
 * @desc Envía una notificación a múltiples usuarios (admin)
 * @access Private (TODO: Restringir a administradores)
 * @body {
 *   title: string,
 *   body: string,
 *   type?: string,
 *   travelId?: number,
 *   targetUserIds?: number[],  // Usuarios específicos
 *   excludeUserIds?: number[]  // Usuarios a excluir
 * }
 */
router.post('/broadcast', notificationController.broadcastNotification.bind(notificationController));
export default router;
//# sourceMappingURL=notification.route.js.map