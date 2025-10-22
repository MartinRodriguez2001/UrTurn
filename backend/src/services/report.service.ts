import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export interface ReportData {
  usuarioId: number;
  travelId: number;
  description: string;
}

export class ReportService {
  async createReport(reportData: ReportData) {
    try {
      // Validar que el viaje existe
      const travel = await prisma.travel.findUnique({
        where: { id: reportData.travelId },
        include: {
          confirmations: true,
          driver_id: true,
        },
      });

      if (!travel) {
        throw new Error("El viaje no existe");
      }

      // Verificar que el usuario participó en el viaje
      const isDriver = travel.userId === reportData.usuarioId;
      const isPassenger = travel.confirmations.some(
        (c) => c.usuarioId === reportData.usuarioId
      );

      if (!isDriver && !isPassenger) {
        throw new Error("Solo los participantes del viaje pueden reportar");
      }

      // Validar descripción
      if (!reportData.description || reportData.description.trim().length < 10) {
        throw new Error("La descripción debe tener al menos 10 caracteres");
      }

      if (reportData.description.length > 1000) {
        throw new Error("La descripción no puede exceder 1000 caracteres");
      }

      const report = await prisma.report.create({
        data: {
          usuarioId: reportData.usuarioId,
          travelId: reportData.travelId,
          description: reportData.description.trim(),
        },
        include: {
          usuario: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
              profile_picture: true,
            },
          },
          travel: {
            select: {
              id: true,
              start_location: true,
              end_location: true,
              start_time: true,
              status: true,
              driver_id: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        report,
        message: "Reporte creado exitosamente. Será revisado por el equipo de soporte.",
      };
    } catch (error) {
      console.error("Error creating report:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al crear reporte"
      );
    }
  }

  async getUserReports(userId: number) {
    try {
      const reports = await prisma.report.findMany({
        where: {
          usuarioId: userId,
        },
        include: {
          travel: {
            select: {
              id: true,
              start_location: true,
              end_location: true,
              start_time: true,
              status: true,
              driver_id: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      return {
        success: true,
        reports,
        count: reports.length,
        message: "Reportes obtenidos exitosamente",
      };
    } catch (error) {
      console.error("Error getting user reports:", error);
      throw new Error("Error al obtener reportes del usuario");
    }
  }

  async getTravelById(travelId: number) {
    try {
      const travel = await prisma.travel.findUnique({
        where: { id: travelId },
        include: {
          driver_id: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return travel;
    } catch (error) {
      console.error("Error getting travel:", error);
      throw new Error("Error al obtener información del viaje");
    }
  }

  async getTravelReports(travelId: number) {
    try {
      const reports = await prisma.report.findMany({
        where: {
          travelId: travelId,
        },
        include: {
          usuario: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
              profile_picture: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      return {
        success: true,
        reports,
        count: reports.length,
        message: "Reportes del viaje obtenidos exitosamente",
      };
    } catch (error) {
      console.error("Error getting travel reports:", error);
      throw new Error("Error al obtener reportes del viaje");
    }
  }

  async getAllReports() {
    try {
      const reports = await prisma.report.findMany({
        include: {
          usuario: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
              profile_picture: true,
            },
          },
          travel: {
            select: {
              id: true,
              start_location: true,
              end_location: true,
              start_time: true,
              status: true,
              driver_id: {
                select: {
                  id: true,
                  name: true,
                  institutional_email: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      return {
        success: true,
        reports,
        count: reports.length,
        message: "Todos los reportes obtenidos exitosamente",
      };
    } catch (error) {
      console.error("Error getting all reports:", error);
      throw new Error("Error al obtener todos los reportes");
    }
  }

  async deleteReport(reportId: number, userId: number) {
    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new Error("Reporte no encontrado");
      }

      if (report.usuarioId !== userId) {
        throw new Error("No tienes autorización para eliminar este reporte");
      }

      await prisma.report.delete({
        where: { id: reportId },
      });

      return {
        success: true,
        message: "Reporte eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error deleting report:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al eliminar reporte"
      );
    }
  }
}
