import { Router } from "express";
import { ReportController } from "../controllers/report.controller.js";
import { authenticateToken } from "../middleware/auth.js";
const router = Router();
const reportController = new ReportController();
// POST /api/reports - Crear nuevo reporte
router.post("/", authenticateToken, reportController.createReport.bind(reportController));
// GET /api/reports/me - Obtener mis reportes
router.get("/me", authenticateToken, reportController.getMyReports.bind(reportController));
// GET /api/reports/travel/:travelId - Obtener reportes de un viaje
router.get("/travel/:travelId", authenticateToken, reportController.getTravelReports.bind(reportController));
// GET /api/reports/all - Obtener todos los reportes (admin)
router.get("/all", authenticateToken, reportController.getAllReports.bind(reportController));
// DELETE /api/reports/:id - Eliminar un reporte propio
router.delete("/:id", authenticateToken, reportController.deleteReport.bind(reportController));
export default router;
//# sourceMappingURL=report.route.js.map