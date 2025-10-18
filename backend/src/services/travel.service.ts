import { PrismaClient, TravelStatus } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export interface TravelData {
  start_location: string;
  end_location: string;
  capacity: number;
  price: number;
  start_time: Date;
  end_time: Date;
  spaces_available: number;
  carId: number;
  status?: string;
}

export class TravelService {
  async registerTravel(travelData: TravelData, driverId: number) {
    try {
      const driverVehicles = await prisma.vehicle.findMany({
        where: {
          userId: driverId,
          validation: true,
        },
      });
      if (driverVehicles.length === 0) {
        throw new Error("El conductor no tiene vehículos validados");
      }

      const vehicleExists = await prisma.vehicle.findFirst({
        where: {
          id: travelData.carId,
          userId: driverId,
          validation: true,
        },
      });
      if (!vehicleExists) {
        throw new Error(
          "El vehículo no existe o no está validado para este conductor"
        );
      }

      const newTravel = await prisma.travel.create({
        data: {
          start_location: travelData.start_location.trim(),
          end_location: travelData.end_location.trim(),
          capacity: travelData.capacity,
          price: travelData.price,
          start_time: travelData.start_time,
          end_time: travelData.end_time,
          spaces_available: travelData.spaces_available,
          userId: driverId,
          carId: travelData.carId,
          status: TravelStatus.confirmado, // Estado inicial
        },
        include: {
          driver_id: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
              phone_number: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              licence_plate: true,
              brand: true,
              model: true,
              year: true,
            },
          },
        },
      });

      return {
        success: true,
        travel: newTravel,
        message: "Viaje creado exitosamente",
      };
    } catch (error) {
      console.error("Error registering travel:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al crear el viaje"
      );
    }
  }

  private validateTravelData(travelData: TravelData): void {
    if (!travelData.start_location?.trim()) {
      throw new Error("La ubicación de origen es requerida");
    }
    if (!travelData.end_location?.trim()) {
      throw new Error("La ubicación de destino es requerida");
    }
    if (travelData.start_location.trim() === travelData.end_location.trim()) {
      throw new Error("El origen y destino no pueden ser iguales");
    }
    // Validar capacidad
    if (
      !Number.isInteger(travelData.capacity) ||
      travelData.capacity < 1 ||
      travelData.capacity > 8
    ) {
      throw new Error("La capacidad debe ser un número entero entre 1 y 8");
    }
    // Validar espacios disponibles
    if (
      !Number.isInteger(travelData.spaces_available) ||
      travelData.spaces_available < 1
    ) {
      throw new Error("Los espacios disponibles deben ser al menos 1");
    }
    // Validar precio
    if (typeof travelData.price !== "number" || travelData.price < 0) {
      throw new Error("El precio debe ser un número positivo");
    }
    if (travelData.price > 50000) {
      throw new Error("El precio no puede exceder $50,000");
    }

    const now = new Date();
    const startTime = new Date(travelData.start_time);
    const endTime = new Date(travelData.end_time);

    if (isNaN(startTime.getTime())) {
      throw new Error("Fecha de inicio inválida");
    }
    if (isNaN(endTime.getTime())) {
      throw new Error("Fecha de fin inválida");
    }

    const minStartTime = new Date(now.getTime() + 30 * 60 * 1000);
    if (startTime < minStartTime) {
      throw new Error(
        "El viaje debe programarse al menos 30 minutos en el futuro"
      );
    }

    const maxDuration = 24 * 60 * 60 * 1000; // 24 horas en ms
    if (endTime.getTime() - startTime.getTime() > maxDuration) {
      throw new Error("El viaje no puede durar más de 24 horas");
    }

    const minDuration = 15 * 60 * 1000; // 15 minutos en ms
    if (endTime.getTime() - startTime.getTime() < minDuration) {
      throw new Error("El viaje debe durar al menos 15 minutos");
    }

    const maxAdvanceTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (startTime > maxAdvanceTime) {
      throw new Error(
        "No se pueden programar viajes con más de 30 días de anticipación"
      );
    }
  }

  private async validateNoOverlappingTravels(
    driverId: number,
    start_time: Date,
    endTime: Date
  ): Promise<void> {
    const overlappingTravels = await prisma.travel.findMany({
      where: {
        userId: driverId,
        status: {
          in: [TravelStatus.confirmado],
        },
        OR: [
          {
            start_time: {
              lt: endTime,
            },
            end_time: {
              gt: start_time,
            },
          },
        ],
      },
    });

    if (overlappingTravels.length > 0) {
      throw new Error(
        "El conductor tiene viajes que se solapan con el horario especificado"
      );
    }
  }

  async getDriverTravels(driverId: number) {
    try {
      const travels = await prisma.travel.findMany({
        where: {
          userId: driverId,
        },
        include: {
          //  1. Información del conductor
          driver_id: {
            // El conductor que creó el viaje
            select: {
              id: true,
              name: true,
              institutional_email: true,
              phone_number: true,
              profile_picture: true,
              description: true,
            },
          },

          //  2. Información del vehículo
          vehicle: {
            select: {
              id: true,
              licence_plate: true,
              brand: true,
              model: true,
              year: true,
            },
          },

          //  3. Solicitudes de viaje (pasajeros interesados)
          requests: {
            where: {
              status: {
                in: ["pendiente", "aceptada"], // Solo solicitudes relevantes
              },
            },
            include: {
              passenger: {
                select: {
                  id: true,
                  name: true,
                  institutional_email: true,
                  phone_number: true,
                  profile_picture: true,
                },
              },
            },
            orderBy: {
              created_at: "asc",
            },
          },

          //  4. Confirmaciones (pasajeros confirmados)
          confirmations: {
            include: {
              usuario: {
                select: {
                  id: true,
                  name: true,
                  institutional_email: true,
                  phone_number: true,
                  profile_picture: true,
                },
              },
            },
            orderBy: {
              date: "asc",
            },
          },

          //  5. Reviews del viaje
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  profile_picture: true,
                },
              },
              user_target: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              date: "desc",
            },
          },

          //  6. Reportes (si los hay)
          reports: {
            include: {
              usuario: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          start_time: "desc", // Viajes más recientes primero
        },
      });
      //7. Procesar datos para el frontend
      const processedTravels = travels.map((travel) => ({
        // Información básica del viaje
        id: travel.id,
        start_location: travel.start_location,
        end_location: travel.end_location,
        capacity: travel.capacity,
        price: travel.price,
        start_time: travel.start_time,
        end_time: travel.end_time,
        spaces_available: travel.spaces_available,
        status: travel.status,

        // Información del conductor
        driver: travel.driver_id,

        // Información del vehículo
        vehicle: travel.vehicle,

        //  Pasajeros organizados por estado
        passengers: {
          // Pasajeros confirmados (ya en el viaje)
          confirmed: travel.confirmations.map((conf) => ({
            ...conf.usuario,
            confirmedAt: conf.date,
            status: "confirmed",
          })),

          // Solicitudes pendientes
          pending: travel.requests
            .filter((req) => req.status === "pendiente")
            .map((req) => ({
              ...req.passenger,
              requestId: req.id,
              requestedAt: req.created_at,
              location: req.location,
              status: "pending",
            })),

          // Solicitudes aceptadas (pero no confirmadas aún)
          accepted: travel.requests
            .filter((req) => req.status === "aceptada")
            .map((req) => ({
              ...req.passenger,
              requestId: req.id,
              acceptedAt: req.created_at,
              location: req.location,
              status: "accepted",
            })),
        },

        // Estadísticas
        stats: {
          totalRequests: travel.requests.length,
          confirmedPassengers: travel.confirmations.length,
          availableSpaces: travel.spaces_available,
          averageRating:
            travel.reviews.length > 0
              ? travel.reviews.reduce((sum, review) => sum + review.starts, 0) /
                travel.reviews.length
              : null,
          totalReviews: travel.reviews.length,
        },

        // Reviews y reportes
        reviews: travel.reviews,
        reports: travel.reports,
      }));

      return {
        success: true,
        travels: processedTravels,
        count: processedTravels.length,
        summary: {
          total: processedTravels.length,
          byStatus: {
            pendiente: processedTravels.filter((t) => t.status === "pendiente")
              .length,
            confirmado: processedTravels.filter(
              (t) => t.status === "confirmado"
            ).length,
            finalizado: processedTravels.filter(
              (t) => t.status === "finalizado"
            ).length,
            cancelado: processedTravels.filter((t) => t.status === "cancelado")
              .length,
          },
        },
        message: "Viajes obtenidos exitosamente",
      };
    } catch (error) {
      console.error("Error getting driver travels:", error);
      throw new Error("Error al obtener los viajes del conductor");
    }
  }

  async getAvaibleTravels(filters?: {
    start_location?: string;
    end_location?: string;
    start_date?: Date;
    min_spaces?: number;
    max_price: number;
  }) {
    try {
      const where: any = {
        status: TravelStatus.confirmado,
        spaces_available: { gt: 0 },
        start_time: { gt: new Date() }, // Solo viajes futuros
      };

      if (filters) {
        if (filters.start_location) {
          where.start_location = {
            contains: filters.start_location,
            mode: "insensitive",
          };
        }
        if (filters.end_location) {
          where.end_location = {
            contains: filters.end_location,
            mode: "insensitive",
          };
        }
        if (filters.start_date) {
          const endOfDay = new Date(filters.start_date);
          endOfDay.setHours(23, 59, 59, 999);
          where.start_time = {
            gte: filters.start_date,
            lte: endOfDay,
          };
        }
        if (filters.min_spaces) {
          where.spaces_available = { gte: filters.min_spaces };
        }
        if (filters.max_price) {
          where.price = { lte: filters.max_price };
        }
      }

      const travels = await prisma.travel.findMany({
        where,
        include: {
          driver_id: {
            select: {
              id: true,
              name: true,
              profile_picture: true,
              phone_number: true,
            },
          },
          vehicle: {
            select: {
              licence_plate: true,
              brand: true,
              model: true,
              year: true,
            },
          },
          reviews: {
            select: {
              starts: true,
            },
          },
        },
        orderBy: [{ start_time: "asc" }, { price: "asc" }],
      });

      const processedTravels = travels.map((travel) => ({
        ...travel,
        driver_rating:
          travel.reviews.length > 0
            ? travel.reviews.reduce((sum, r) => sum + r.starts, 0) /
              travel.reviews.length
            : null,
      }));

      return {
        success: true,
        travels: processedTravels,
        count: processedTravels.length,
        message: "Viajes disponibles obtenidos exitosamente",
      };
    } catch (error) {
      console.error("Error getting available travels:", error);
      throw new Error("Error al obtener viajes disponibles");
    }
  }

  async requestToJoinTravel(
    travelId: number,
    passengerId: number,
    pickupLocation: string
  ) {
    try {
      // Verificar que el viaje existe y está disponible
      const travel = await prisma.travel.findUnique({
        where: { id: travelId },
        include: { driver_id: true },
      });

      if (!travel) {
        throw new Error("El viaje no existe");
      }

      if (travel.userId === passengerId) {
        throw new Error("No puedes solicitar tu propio viaje");
      }

      if (travel.status !== TravelStatus.confirmado) {
        throw new Error("Este viaje no está disponible");
      }

      if (travel.spaces_available <= 0) {
        throw new Error("No hay espacios disponibles en este viaje");
      }

      // Verificar que no haya solicitado antes
      const existingRequest = await prisma.travelRequest.findFirst({
        where: {
          travelId,
          passengerId,
          status: { in: ["pendiente", "aceptada"] },
        },
      });

      if (existingRequest) {
        throw new Error("Ya tienes una solicitud para este viaje");
      }

      // Crear la solicitud
      const request = await prisma.travelRequest.create({
        data: {
          travelId,
          passengerId,
          location: pickupLocation,
          status: "pendiente",
        },
        include: {
          passenger: {
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
            },
          },
        },
      });

      return {
        success: true,
        request,
        message: "Solicitud enviada exitosamente",
      };
    } catch (error) {
      console.error("Error requesting travel:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al solicitar viaje"
      );
    }
  }

  async respondToTravelRequest(
    requestId: number,
    driverId: number,
    accept: boolean
  ) {
    try {
      const request = await prisma.travelRequest.findUnique({
        where: { id: requestId },
        include: {
          travel: true,
          passenger: true,
        },
      });

      if (!request) {
        throw new Error("La solicitud no existe");
      }

      if (request.travel.userId !== driverId) {
        throw new Error("No tienes autorización para responder esta solicitud");
      }

      if (request.status !== "pendiente") {
        throw new Error("Esta solicitud ya fue respondida");
      }

      const updatedRequest = await prisma.travelRequest.update({
        where: { id: requestId },
        data: {
          status: accept ? "aceptada" : "rechazada",
        },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
            },
          },
        },
      });

      // Si acepta, crear confirmación y reducir espacios
      if (accept) {
        await prisma.confirmation.create({
          data: {
            travelId: request.travelId,
            usuarioId: request.passengerId,
          },
        });

        await prisma.travel.update({
          where: { id: request.travelId },
          data: {
            spaces_available: {
              decrement: 1,
            },
          },
        });
      }

      return {
        success: true,
        request: updatedRequest,
        message: accept
          ? "Pasajero aceptado exitosamente"
          : "Solicitud rechazada",
      };
    } catch (error) {
      console.error("Error responding to request:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al responder solicitud"
      );
    }
  }

  async cancelTravel(travelId: number, userId: number, reason?: string) {
    try {
      const travel = await prisma.travel.findUnique({
        where: { id: travelId },
        include: {
          confirmations: {
            include: {
              usuario: {
                select: {
                  id: true,
                  name: true,
                  institutional_email: true,
                },
              },
            },
          },
        },
      });

      if (!travel) {
        throw new Error("El viaje no existe");
      }

      if (travel.userId !== userId) {
        throw new Error("No tienes autorización para cancelar este viaje");
      }

      if (travel.status === TravelStatus.cancelado) {
        throw new Error("Este viaje ya está cancelado");
      }

      if (travel.status === TravelStatus.finalizado) {
        throw new Error("No se puede cancelar un viaje finalizado");
      }

      // Cancelar el viaje
      const canceledTravel = await prisma.travel.update({
        where: { id: travelId },
        data: {
          status: TravelStatus.cancelado,
        },
      });

      return {
        success: true,
        travel: canceledTravel,
        affected_passengers: travel.confirmations,
        message: "Viaje cancelado exitosamente",
      };
    } catch (error) {
      console.error("Error canceling travel:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al cancelar viaje"
      );
    }
  }

  async completeTravel(travelId: number, driverId: number) {
    try {
      const travel = await prisma.travel.findUnique({
        where: { id: travelId },
      });

      if (!travel) {
        throw new Error("El viaje no existe");
      }

      if (travel.userId !== driverId) {
        throw new Error("No tienes autorización para finalizar este viaje");
      }

      if (travel.status !== TravelStatus.confirmado) {
        throw new Error("Solo se pueden finalizar viajes confirmados");
      }

      const completedTravel = await prisma.travel.update({
        where: { id: travelId },
        data: {
          status: TravelStatus.finalizado,
        },
      });

      return {
        success: true,
        travel: completedTravel,
        message: "Viaje finalizado exitosamente",
      };
    } catch (error) {
      console.error("Error completing travel:", error);
      throw new Error("Error al finalizar viaje");
    }
  }

  async getTravelRequests(travelId: number, driverId: number) {
    try {
      const travel = await prisma.travel.findUnique({
        where: { id: travelId },
      });

      if (!travel) {
        throw new Error("El viaje no existe");
      }

      if (travel.userId !== driverId) {
        throw new Error("No tienes autorización para ver estas solicitudes");
      }

      const requests = await prisma.travelRequest.findMany({
        where: { travelId },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
              profile_picture: true,
              phone_number: true,
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      });

      return {
        success: true,
        requests,
        count: requests.length,
        message: "Solicitudes obtenidas exitosamente",
      };
    } catch (error) {
      console.error("Error getting travel requests:", error);
      throw new Error("Error al obtener solicitudes del viaje");
    }
  }

  async getPassengerTravels(passengerId: number) {
    try {
      // Viajes solicitados
      const requestedTravels = await prisma.travelRequest.findMany({
        where: { passengerId },
        include: {
          travel: {
            include: {
              driver_id: {
                select: {
                  id: true,
                  name: true,
                  phone_number: true,
                  profile_picture: true,
                },
              },
              vehicle: {
                select: {
                  licence_plate: true,
                  brand: true,
                  model: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      // Viajes confirmados
      const confirmedTravels = await prisma.confirmation.findMany({
        where: { usuarioId: passengerId },
        include: {
          travel: {
            include: {
              driver_id: {
                select: {
                  id: true,
                  name: true,
                  phone_number: true,
                  profile_picture: true,
                },
              },
              vehicle: {
                select: {
                  licence_plate: true,
                  brand: true,
                  model: true,
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
        data: {
          requested: requestedTravels,
          confirmed: confirmedTravels,
        },
        message: "Viajes del pasajero obtenidos exitosamente",
      };
    } catch (error) {
      console.error("Error getting passenger travels:", error);
      throw new Error("Error al obtener viajes del pasajero");
    }
  }

  async removePassenger(
    travelId: number,
    passengerId: number,
    driverId: number
  ) {
    try {
      const travel = await prisma.travel.findUnique({
        where: { id: travelId },
      });

      if (!travel) {
        throw new Error("El viaje no existe");
      }

      if (travel.userId !== driverId) {
        throw new Error("No tienes autorización para remover pasajeros");
      }

      // Buscar la confirmación
      const confirmation = await prisma.confirmation.findFirst({
        where: {
          travelId,
          usuarioId: passengerId,
        },
      });

      if (!confirmation) {
        throw new Error("El pasajero no está confirmado en este viaje");
      }

      // Remover confirmación y aumentar espacios
      await prisma.confirmation.delete({
        where: { id: confirmation.id },
      });

      await prisma.travel.update({
        where: { id: travelId },
        data: {
          spaces_available: {
            increment: 1,
          },
        },
      });

      return {
        success: true,
        message: "Pasajero removido exitosamente",
      };
    } catch (error) {
      console.error("Error removing passenger:", error);
      throw new Error("Error al remover pasajero");
    }
  }

  async searchTravelsByLocation(query: string) {
    try {
      const travels = await prisma.travel.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  start_location: {
                    contains: query,
                    mode: 'insensitive'
                  }
                },
                {
                  end_location: {
                    contains: query,
                    mode: 'insensitive'
                  }
                }
              ]
            },
            {
              status: TravelStatus.confirmado
            },
            {
              spaces_available: { gt: 0 }
            },
            {
              start_time: { gt: new Date() }
            }
          ]
        },
        include: {
          driver_id: {
            select: {
              id: true,
              name: true,
              profile_picture: true
            }
          },
          vehicle: {
            select: {
              licence_plate: true,
              brand: true,
              model: true
            }
          }
        },
        take: 20, // Limitar resultados
        orderBy: {
          start_time: 'asc'
        }
      });

      return {
        success: true,
        travels,
        count: travels.length,
        message: "Búsqueda completada exitosamente"
      };

    } catch (error) {
      console.error("Error searching travels:", error);
      throw new Error("Error en la búsqueda de viajes");
    }
  }
}
