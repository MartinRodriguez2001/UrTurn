import { Router } from "express";
import { StatsController } from "../controllers/stats.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const statsController = new StatsController();

// GET /api/stats/me - Obtener mis estadísticas
router.get(
  "/me",
  authenticateToken,
  statsController.getMyStats.bind(statsController)
);

// GET /api/stats/user/:userId - Obtener estadísticas de un usuario
router.get(
  "/user/:userId",
  authenticateToken,
  statsController.getUserStats.bind(statsController)
);

// GET /api/stats/drivers/ranking - Obtener ranking de conductores
router.get(
  "/drivers/ranking",
  authenticateToken,
  statsController.getDriverRanking.bind(statsController)
);

// GET /api/stats/platform - Obtener estadísticas generales de la plataforma
router.get(
  "/platform",
  authenticateToken,
  statsController.getPlatformStats.bind(statsController)
);

export default router;
