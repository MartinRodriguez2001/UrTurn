import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export class StatsService {
  async getUserStats(userId: number) {
    try {
      // Estadísticas como conductor
      const driverTravels = await prisma.travel.findMany({
        where: { userId },
        include: {
          confirmations: true,
          reviews: true,
        },
      });

      const driverStats = {
        totalTrips: driverTravels.length,
        completedTrips: driverTravels.filter((t) => t.status === "finalizado").length,
        canceledTrips: driverTravels.filter((t) => t.status === "cancelado").length,
        pendingTrips: driverTravels.filter((t) => t.status === "pendiente").length,
        confirmedTrips: driverTravels.filter((t) => t.status === "confirmado").length,
        totalPassengersTransported: driverTravels.reduce(
          (sum, t) => sum + t.confirmations.length,
          0
        ),
        totalEarnings: driverTravels
          .filter((t) => t.status === "finalizado")
          .reduce((sum, t) => sum + t.price * t.confirmations.length, 0),
      };

      // Estadísticas como pasajero
      const passengerRequests = await prisma.travelRequest.findMany({
        where: { passengerId: userId },
      });

      const passengerConfirmations = await prisma.confirmation.findMany({
        where: { usuarioId: userId },
        include: {
          travel: true,
        },
      });

      const passengerStats = {
        totalRequests: passengerRequests.length,
        acceptedRequests: passengerRequests.filter((r) => r.status === "aceptada")
          .length,
        rejectedRequests: passengerRequests.filter((r) => r.status === "rechazada")
          .length,
        pendingRequests: passengerRequests.filter((r) => r.status === "pendiente")
          .length,
        completedTrips: passengerConfirmations.filter(
          (c) => c.travel.status === "finalizado"
        ).length,
        totalSpent: passengerConfirmations
          .filter((c) => c.travel.status === "finalizado")
          .reduce((sum, c) => sum + c.travel.price, 0),
      };

      // Reviews
      const reviewsReceived = await prisma.review.findMany({
        where: { user_target_id: userId },
      });

      const reviewsGiven = await prisma.review.findMany({
        where: { reviewer_id: userId },
      });

      const averageRating =
        reviewsReceived.length > 0
          ? reviewsReceived.reduce((sum, r) => sum + r.starts, 0) /
            reviewsReceived.length
          : null;

      const reviewStats = {
        averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
        totalReviewsReceived: reviewsReceived.length,
        totalReviewsGiven: reviewsGiven.length,
        ratingDistribution: {
          5: reviewsReceived.filter((r) => r.starts === 5).length,
          4: reviewsReceived.filter((r) => r.starts === 4).length,
          3: reviewsReceived.filter((r) => r.starts === 3).length,
          2: reviewsReceived.filter((r) => r.starts === 2).length,
          1: reviewsReceived.filter((r) => r.starts === 1).length,
        },
      };

      // Vehículos
      const vehicles = await prisma.vehicle.findMany({
        where: { userId },
      });

      const vehicleStats = {
        totalVehicles: vehicles.length,
        validatedVehicles: vehicles.filter((v) => v.validation).length,
      };

      return {
        success: true,
        data: {
          asDriver: driverStats,
          asPassenger: passengerStats,
          reviews: reviewStats,
          vehicles: vehicleStats,
        },
        message: "Estadísticas obtenidas exitosamente",
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw new Error("Error al obtener estadísticas del usuario");
    }
  }

  async getDriverRanking(limit: number = 10) {
    try {
      // Obtener todos los conductores con sus reviews
      const drivers = await prisma.user.findMany({
        where: { IsDriver: true },
        include: {
          reviewsReceived: true,
          travel: {
            where: { status: "finalizado" },
            include: {
              confirmations: true,
            },
          },
        },
      });

      // Calcular estadísticas y ordenar
      const driversWithStats = drivers
        .map((driver) => {
          const averageRating =
            driver.reviewsReceived.length > 0
              ? driver.reviewsReceived.reduce((sum, r) => sum + r.starts, 0) /
                driver.reviewsReceived.length
              : 0;

          const totalTrips = driver.travel.length;
          const totalPassengers = driver.travel.reduce(
            (sum, t) => sum + t.confirmations.length,
            0
          );

          return {
            id: driver.id,
            name: driver.name,
            profile_picture: driver.profile_picture,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: driver.reviewsReceived.length,
            totalTrips,
            totalPassengers,
            score: averageRating * driver.reviewsReceived.length + totalTrips * 0.5,
          };
        })
        .filter((d) => d.totalTrips > 0 || d.totalReviews > 0) // Solo drivers activos
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        success: true,
        drivers: driversWithStats,
        count: driversWithStats.length,
        message: "Ranking de conductores obtenido exitosamente",
      };
    } catch (error) {
      console.error("Error getting driver ranking:", error);
      throw new Error("Error al obtener ranking de conductores");
    }
  }

  async getPlatformStats() {
    try {
      const totalUsers = await prisma.user.count();
      const totalDrivers = await prisma.user.count({
        where: { IsDriver: true },
      });

      const totalTravels = await prisma.travel.count();
      const completedTravels = await prisma.travel.count({
        where: { status: "finalizado" },
      });
      const activeTravels = await prisma.travel.count({
        where: { status: "confirmado" },
      });

      const totalVehicles = await prisma.vehicle.count();
      const validatedVehicles = await prisma.vehicle.count({
        where: { validation: true },
      });

      const totalReviews = await prisma.review.count();
      const totalReports = await prisma.report.count();

      // Viajes por día (últimos 7 días)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentTravels = await prisma.travel.findMany({
        where: {
          start_time: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          start_time: true,
        },
      });

      return {
        success: true,
        data: {
          users: {
            total: totalUsers,
            drivers: totalDrivers,
            passengers: totalUsers - totalDrivers,
          },
          travels: {
            total: totalTravels,
            completed: completedTravels,
            active: activeTravels,
            canceled: await prisma.travel.count({
              where: { status: "cancelado" },
            }),
          },
          vehicles: {
            total: totalVehicles,
            validated: validatedVehicles,
            pending: totalVehicles - validatedVehicles,
          },
          engagement: {
            totalReviews,
            totalReports,
            averageRating: await this.getAveragePlatformRating(),
          },
          recentActivity: {
            travelsLast7Days: recentTravels.length,
          },
        },
        message: "Estadísticas de la plataforma obtenidas exitosamente",
      };
    } catch (error) {
      console.error("Error getting platform stats:", error);
      throw new Error("Error al obtener estadísticas de la plataforma");
    }
  }

  private async getAveragePlatformRating(): Promise<number | null> {
    const reviews = await prisma.review.findMany({
      select: { starts: true },
    });

    if (reviews.length === 0) return null;

    const average =
      reviews.reduce((sum, r) => sum + r.starts, 0) / reviews.length;
    return Math.round(average * 10) / 10;
  }
}
