import { ReportService } from "../services/report.service.js";
const reportService = new ReportService();
export class ReportController {
    async createReport(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            const { travelId, description } = req.body;
            if (!travelId || !description) {
                return res.status(400).json({
                    success: false,
                    message: "Todos los campos son requeridos: travelId, description",
                });
            }
            const reportData = {
                usuarioId: userId,
                travelId: parseInt(travelId),
                description: description,
            };
            const result = await reportService.createReport(reportData);
            res.status(201).json(result);
        }
        catch (error) {
            console.error("Error in createReport:", error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Error al crear reporte",
            });
        }
    }
    async getMyReports(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            const result = await reportService.getUserReports(userId);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Error in getMyReports:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener tus reportes",
            });
        }
    }
    async getTravelReports(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            const travelId = parseInt(req.params.travelId || "");
            if (isNaN(travelId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID de viaje inválido",
                });
            }
            // Verificar que el viaje existe
            const travel = await reportService.getTravelById(travelId);
            if (!travel) {
                return res.status(404).json({
                    success: false,
                    message: "Viaje no encontrado",
                });
            }
            const result = await reportService.getTravelReports(travelId);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Error in getTravelReports:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener reportes del viaje",
            });
        }
    }
    async getAllReports(req, res) {
        try {
            // Este endpoint sería solo para administradores
            // Por ahora lo dejamos abierto, pero deberías agregar un middleware de admin
            const result = await reportService.getAllReports();
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Error in getAllReports:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener todos los reportes",
            });
        }
    }
    async deleteReport(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            const reportId = parseInt(req.params.id || "");
            if (isNaN(reportId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID de reporte inválido",
                });
            }
            const result = await reportService.deleteReport(reportId, userId);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Error in deleteReport:", error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Error al eliminar reporte",
            });
        }
    }
}
//# sourceMappingURL=report.controller.js.map