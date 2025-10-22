import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { StatsService } from "../services/stats.service.js";

const statsService = new StatsService();

export class StatsController {
  async getMyStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await statsService.getUserStats(userId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getMyStats:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener tus estadísticas",
      });
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId || "");

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "ID de usuario inválido",
        });
      }

      const result = await statsService.getUserStats(userId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getUserStats:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas del usuario",
      });
    }
  }

  async getDriverRanking(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: "El límite debe estar entre 1 y 100",
        });
      }

      const result = await statsService.getDriverRanking(limit);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getDriverRanking:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener ranking de conductores",
      });
    }
  }

  async getPlatformStats(req: AuthRequest, res: Response) {
    try {
      // Este endpoint sería solo para administradores
      const result = await statsService.getPlatformStats();
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getPlatformStats:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas de la plataforma",
      });
    }
  }
}
