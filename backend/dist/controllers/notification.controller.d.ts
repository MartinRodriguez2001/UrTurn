import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare class NotificationController {
    /**
     * Registra un token de Expo Push para el usuario autenticado
     * POST /api/notifications/register-token
     */
    registerToken(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Actualiza las preferencias de notificación del usuario
     * PUT /api/notifications/preferences
     */
    updatePreferences(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Obtiene las preferencias de notificación del usuario
     * GET /api/notifications/preferences
     */
    getPreferences(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Envía una notificación de prueba al usuario
     * POST /api/notifications/test
     */
    sendTestNotification(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Obtiene el historial de notificaciones del usuario
     * GET /api/notifications/history
     */
    getNotificationHistory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Obtiene estadísticas de notificaciones
     * GET /api/notifications/stats
     */
    getNotificationStats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Desregistra el token de notificación del usuario (logout)
     * DELETE /api/notifications/token
     */
    unregisterToken(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Endpoint para administradores: enviar notificación a múltiples usuarios
     * POST /api/notifications/broadcast
     */
    broadcastNotification(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export default NotificationController;
//# sourceMappingURL=notification.controller.d.ts.map