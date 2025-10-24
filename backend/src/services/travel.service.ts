import { PrismaClient, TravelStatus } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export interface TravelData {
  start_location_name: string;
  start_latitude: number;
  start_longitude: number;
  end_location_name: string;
  end_latitude: number;
  end_longitude: number;
  travel_date: Date;
  start_time: Date;
  end_time?: Date | null;
  capacity: number;
  price: number;
  spaces_available: number;
  carId: number;
  status?: TravelStatus;
}

interface OpenTravelRequestData {
  startLocationName?: string;
  startLatitude: number;
  startLongitude: number;
  endLocationName?: string;
  endLatitude: number;
  endLongitude: number;
  pickupDate?: string;
  pickupTime?: string;
}

export class TravelService {
  async registerTravel(travelData: TravelData, driverId: number) {
    try {
      this.validateTravelData(travelData);

      const travelStart = new Date(travelData.start_time);
      const travelEnd = travelData.end_time
        ? new Date(travelData.end_time)
        : new Date(travelStart.getTime() + 60 * 60 * 1000);

      await this.validateNoOverlappingTravels(driverId, travelStart, travelEnd);

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
          start_location_name: travelData.start_location_name.trim(),
          start_latitude: travelData.start_latitude,
          start_longitude: travelData.start_longitude,
          end_location_name: travelData.end_location_name.trim(),
          end_latitude: travelData.end_latitude,
          end_longitude: travelData.end_longitude,
          travel_date: travelData.travel_date,
          start_time: travelStart,
          ...(travelData.end_time ? { end_time: travelEnd } : {}),
          capacity: travelData.capacity,
          price: travelData.price,
          spaces_available: travelData.spaces_available,
          status: travelData.status ?? TravelStatus.confirmado,
          userId: driverId,
          carId: travelData.carId,
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
        travel: {
          ...newTravel,
          start_location: newTravel.start_location_name,
          end_location: newTravel.end_location_name,
        },
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
    if (!travelData.start_location_name?.trim()) {
      throw new Error("La ubicación de origen es requerida");
    }
    if (!travelData.end_location_name?.trim()) {
      throw new Error("La ubicación de destino es requerida");
    }
    if (
      travelData.start_location_name.trim().toLowerCase() ===
      travelData.end_location_name.trim().toLowerCase()
    ) {
      throw new Error("El origen y destino no pueden ser iguales");
    }
    const { start_latitude, start_longitude, end_latitude, end_longitude } =
      travelData;

    if (!Number.isFinite(start_latitude) || Math.abs(start_latitude) > 90) {
      throw new Error("La latitud de origen es inválida");
    }
    if (!Number.isFinite(start_longitude) || Math.abs(start_longitude) > 180) {
      throw new Error("La longitud de origen es inválida");
    }
    if (!Number.isFinite(end_latitude) || Math.abs(end_latitude) > 90) {
      throw new Error("La latitud de destino es inválida");
    }
    if (!Number.isFinite(end_longitude) || Math.abs(end_longitude) > 180) {
      throw new Error("La longitud de destino es inválida");
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
    if (travelData.spaces_available > travelData.capacity) {
      throw new Error("Los espacios disponibles no pueden exceder la capacidad");
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
    const endTime = travelData.end_time ? new Date(travelData.end_time) : null;
    const travelDate = new Date(travelData.travel_date);

    if (isNaN(startTime.getTime())) {
      throw new Error("Fecha de inicio inválida");
    }
    if (travelData.end_time && (!endTime || isNaN(endTime.getTime()))) {
      throw new Error("Fecha de fin inválida");
    }
    if (isNaN(travelDate.getTime())) {
      throw new Error("La fecha del viaje es inválida");
    }

    const minStartTime = new Date(now.getTime() + 30 * 60 * 1000);
    if (startTime < minStartTime) {
      throw new Error(
        "El viaje debe programarse al menos 30 minutos en el futuro"
      );
    }

    if (endTime) {
      const maxDuration = 24 * 60 * 60 * 1000; // 24 horas en ms
      if (endTime.getTime() - startTime.getTime() > maxDuration) {
        throw new Error("El viaje no puede durar más de 24 horas");
      }

      const minDuration = 15 * 60 * 1000; // 15 minutos en ms
      if (endTime.getTime() - startTime.getTime() < minDuration) {
        throw new Error("El viaje debe durar al menos 15 minutos");
      }
    }

    const maxAdvanceTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (startTime > maxAdvanceTime) {
      throw new Error(
        "No se pueden programar viajes con más de 30 días de anticipación"
      );
    }

    const normalizedTravelDate = new Date(travelDate);
    normalizedTravelDate.setHours(0, 0, 0, 0);
    const normalizedStartDate = new Date(startTime);
    normalizedStartDate.setHours(0, 0, 0, 0);

    if (normalizedTravelDate.getTime() !== normalizedStartDate.getTime()) {
      throw new Error(
        "La fecha del viaje debe coincidir con la fecha de inicio del viaje"
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

  private mapTravelForResponse<
    T extends {
      start_location_name: string | null;
      end_location_name: string | null;
    }
  >(
    travel: T
  ): T & { start_location: string | null; end_location: string | null } {
    return {
      ...travel,
      start_location: travel.start_location_name,
      end_location: travel.end_location_name,
    };
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
        start_location: travel.start_location_name,
        start_location_name: travel.start_location_name,
        start_latitude: travel.start_latitude,
        start_longitude: travel.start_longitude,
        end_location: travel.end_location_name,
        end_location_name: travel.end_location_name,
        end_latitude: travel.end_latitude,
        end_longitude: travel.end_longitude,
        travel_date: travel.travel_date,
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
              location: req.start_location_name,
              start_location_name: req.start_location_name,
              start_latitude: req.start_latitude,
              start_longitude: req.start_longitude,
              status: "pending",
            })),

          // Solicitudes aceptadas (pero no confirmadas aún)
          accepted: travel.requests
            .filter((req) => req.status === "aceptada")
            .map((req) => ({
              ...req.passenger,
              requestId: req.id,
              acceptedAt: req.created_at,
              location: req.start_location_name,
              start_location_name: req.start_location_name,
              start_latitude: req.start_latitude,
              start_longitude: req.start_longitude,
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
          where.start_location_name = {
            contains: filters.start_location,
            mode: "insensitive",
          };
        }
        if (filters.end_location) {
          where.end_location_name = {
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

      const processedTravels = travels.map((travel) => {
        const withLegacyFields = this.mapTravelForResponse(travel);
        return {
          ...withLegacyFields,
          driver_rating:
            travel.reviews.length > 0
              ? travel.reviews.reduce((sum, r) => sum + r.starts, 0) /
                travel.reviews.length
              : null,
        };
      });

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
    pickupLocation: string,
    pickupLatitude: number,
    pickupLongitude: number,
    pickupDate?: Date,
    pickupTime?: Date
  ) {
    try {
      // 🔍 DEBUG: Inicio de la solicitud
      console.log("=== DEBUG: Iniciando solicitud de viaje ===");
      console.log("📋 Parámetros recibidos:", {
        travelId,
        passengerId,
        pickupLocation,
        pickupLatitude,
        pickupLongitude,
        pickupDate: pickupDate ? pickupDate.toISOString() : null,
        pickupTime: pickupTime ? pickupTime.toISOString() : null,
      });

      if (!pickupLocation?.trim()) {
        throw new Error("La ubicación de recogida es requerida");
      }
      if (!Number.isFinite(pickupLatitude) || Math.abs(pickupLatitude) > 90) {
        throw new Error("La latitud de recogida es inválida");
      }
      if (!Number.isFinite(pickupLongitude) || Math.abs(pickupLongitude) > 180) {
        throw new Error("La longitud de recogida es inválida");
      }

      // Verificar que el viaje existe y está disponible
      const travel = await prisma.travel.findUnique({
        where: { id: travelId },
        include: { driver_id: true },
      });

      console.log("🚗 Viaje encontrado:", travel ? {
        id: travel.id,
        driverId: travel.userId,
        status: travel.status,
        spaces_available: travel.spaces_available,
        start_location_name: travel.start_location_name,
        end_location_name: travel.end_location_name,
      } : null);

      if (!travel) {
        throw new Error("El viaje no existe");
      }

      if (travel.userId === passengerId) {
        console.log("❌ Error: El pasajero es el conductor del viaje");
        throw new Error("No puedes solicitar tu propio viaje");
      }

      if (travel.status !== TravelStatus.confirmado) {
        console.log("❌ Error: Viaje no disponible, status:", travel.status);
        throw new Error("Este viaje no está disponible");
      }

      if (travel.spaces_available <= 0) {
        console.log("❌ Error: No hay espacios disponibles");
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

      console.log("🔍 Solicitud existente:", existingRequest ? {
        id: existingRequest.id,
        status: existingRequest.status,
      } : "No existe");

      if (existingRequest) {
        throw new Error("Ya tienes una solicitud para este viaje");
      }

      const normalizedPickupDate = pickupDate ? new Date(pickupDate) : undefined;
      if (normalizedPickupDate) {
        normalizedPickupDate.setHours(0, 0, 0, 0);
      }

      const normalizedPickupTime = pickupTime ? new Date(pickupTime) : undefined;
      if (normalizedPickupTime) {
        normalizedPickupTime.setSeconds(0, 0);
        if (normalizedPickupDate) {
          normalizedPickupTime.setFullYear(
            normalizedPickupDate.getFullYear(),
            normalizedPickupDate.getMonth(),
            normalizedPickupDate.getDate()
          );
        }
      }

      console.log("📅 Fechas normalizadas:", {
        pickup_date: normalizedPickupDate ? normalizedPickupDate.toISOString() : null,
        pickup_time: normalizedPickupTime ? normalizedPickupTime.toISOString() : null,
      });

      console.log("💾 Creando solicitud en la base de datos...");

      // Crear la solicitud
      const request = await prisma.travelRequest.create({
        data: {
          travelId,
          passengerId,
          start_location_name: pickupLocation.trim(),
          start_latitude: pickupLatitude,
          start_longitude: pickupLongitude,
          end_location_name: travel.end_location_name,
          end_latitude: travel.end_latitude,
          end_longitude: travel.end_longitude,
          pickup_date: normalizedPickupDate ?? null,
          pickup_time: normalizedPickupTime ?? null,
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
              start_location_name: true,
              end_location_name: true,
              start_latitude: true,
              start_longitude: true,
              end_latitude: true,
              end_longitude: true,
              start_time: true,
            },
          },
        },
      });

      console.log("✅ Solicitud creada exitosamente:", {
        requestId: request.id,
        travelId: request.travelId,
        passengerId: request.passengerId,
        start_location_name: request.start_location_name,
        start_latitude: request.start_latitude,
        start_longitude: request.start_longitude,
        pickup_date: request.pickup_date,
        pickup_time: request.pickup_time,
        status: request.status,
      });
      console.log("=== DEBUG: Fin de la solicitud ===\n");

      return {
        success: true,
        request: {
          ...request,
          location: request.start_location_name,
        },
        message: "Solicitud enviada exitosamente",
      };
    } catch (error) {
      console.error("❌ ERROR en requestToJoinTravel:");
      console.error("Tipo de error:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("Mensaje:", error instanceof Error ? error.message : String(error));
      console.error("Stack trace:", error instanceof Error ? error.stack : "No disponible");
      console.error("=== DEBUG: Fin con error ===\n");
      
      throw new Error(
        error instanceof Error ? error.message : "Error al solicitar viaje"
      );
    }
  }

  async createOpenTravelRequest(passengerId: number, data: OpenTravelRequestData) {
    try {
      if (!Number.isFinite(data.startLatitude) || !Number.isFinite(data.startLongitude)) {
        throw new Error("La ubicación de origen es inválida");
      }

      if (!Number.isFinite(data.endLatitude) || !Number.isFinite(data.endLongitude)) {
        throw new Error("La ubicación de destino es inválida");
      }

      const normalizedStartName = data.startLocationName?.trim() ?? null;
      const normalizedEndName = data.endLocationName?.trim() ?? null;

      if (normalizedStartName && normalizedEndName && normalizedStartName === normalizedEndName) {
        throw new Error("El origen y destino no pueden ser iguales");
      }

      let parsedPickupDate: Date | null = null;
      if (data.pickupDate) {
        const candidate = new Date(data.pickupDate);
        if (isNaN(candidate.getTime())) {
          throw new Error("La fecha de recogida es inválida");
        }
        candidate.setHours(0, 0, 0, 0);
        parsedPickupDate = candidate;
      }

      let parsedPickupTime: Date | null = null;
      if (data.pickupTime) {
        const candidate = new Date(data.pickupTime);
        if (isNaN(candidate.getTime())) {
          throw new Error("La hora de recogida es inválida");
        }
        candidate.setSeconds(0, 0);
        if (parsedPickupDate) {
          candidate.setFullYear(
            parsedPickupDate.getFullYear(),
            parsedPickupDate.getMonth(),
            parsedPickupDate.getDate()
          );
        }
        parsedPickupTime = candidate;
      }

      const request = await prisma.travelRequest.create({
        data: {
          passengerId,
          start_location_name: normalizedStartName,
          start_latitude: data.startLatitude,
          start_longitude: data.startLongitude,
          end_location_name: normalizedEndName,
          end_latitude: data.endLatitude,
          end_longitude: data.endLongitude,
          pickup_date: parsedPickupDate,
          pickup_time: parsedPickupTime,
          status: "pendiente",
        },
      });

      return {
        success: true,
        request,
        message: "Solicitud registrada exitosamente",
      };
    } catch (error) {
      console.error("Error creating open travel request:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al registrar solicitud"
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

      if (!request.travel) {
        throw new Error("La solicitud aún no está asociada a un viaje");
      }

      if (request.travel.userId !== driverId) {
        throw new Error("No tienes autorización para responder esta solicitud");
      }

      const travelId = request.travelId;
      if (!travelId) {
        throw new Error("La solicitud no está asignada a un viaje válido");
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
            travelId,
            usuarioId: request.passengerId,
          },
        });

        await prisma.travel.update({
          where: { id: travelId },
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
          end_time: new Date(),
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

      const normalizedRequested = requestedTravels.map((item) => ({
        ...item,
        travel: item.travel ? this.mapTravelForResponse(item.travel) : null,
      }));

      const normalizedConfirmed = confirmedTravels.map((item) => ({
        ...item,
        travel: item.travel ? this.mapTravelForResponse(item.travel) : null,
      }));

      return {
        success: true,
        data: {
          requested: normalizedRequested,
          confirmed: normalizedConfirmed,
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
                  start_location_name: {
                    contains: query,
                    mode: 'insensitive'
                  }
                },
                {
                  end_location_name: {
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

  async cancelTravelRequest(requestId: number, passengerId: number) {
    try {
      const request = await prisma.travelRequest.findUnique({
        where: { id: requestId },
        include: {
          travel: true,
        },
      });

      if (!request) {
        throw new Error("La solicitud no existe");
      }

      if (request.passengerId !== passengerId) {
        throw new Error("No tienes autorización para cancelar esta solicitud");
      }

      if (request.status === "rechazada") {
        throw new Error("Esta solicitud ya fue rechazada");
      }

      if (request.status === "aceptada") {
        throw new Error(
          "No puedes cancelar una solicitud ya aceptada. Contacta al conductor."
        );
      }

      // Cambiar estado a rechazada (cancelada por el pasajero)
      const canceledRequest = await prisma.travelRequest.update({
        where: { id: requestId },
        data: {
          status: "rechazada",
        },
        include: {
          travel: {
            select: {
              id: true,
              start_location_name: true,
              end_location_name: true,
              start_latitude: true,
              start_longitude: true,
              end_latitude: true,
              end_longitude: true,
              start_time: true,
            },
          },
        },
      });

      return {
        success: true,
        request: {
          ...canceledRequest,
          travel: canceledRequest.travel
            ? this.mapTravelForResponse(canceledRequest.travel)
            : null,
        },
        message: "Solicitud cancelada exitosamente",
      };
    } catch (error) {
      console.error("Error canceling travel request:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al cancelar solicitud"
      );
    }
  }

  async leaveTravel(travelId: number, passengerId: number) {
    try {
      const travel = await prisma.travel.findUnique({
        where: { id: travelId },
      });

      if (!travel) {
        throw new Error("El viaje no existe");
      }

      // Buscar confirmación
      const confirmation = await prisma.confirmation.findFirst({
        where: {
          travelId,
          usuarioId: passengerId,
        },
      });

      if (!confirmation) {
        throw new Error("No estás confirmado en este viaje");
      }

      // Verificar que el viaje no haya empezado
      if (travel.start_time < new Date()) {
        throw new Error("No puedes abandonar un viaje que ya comenzó");
      }

      // Eliminar confirmación y aumentar espacios
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

      // También actualizar la solicitud original si existe
      const originalRequest = await prisma.travelRequest.findFirst({
        where: {
          travelId,
          passengerId,
          status: "aceptada",
        },
      });

      if (originalRequest) {
        await prisma.travelRequest.update({
          where: { id: originalRequest.id },
          data: { status: "rechazada" },
        });
      }

      return {
        success: true,
        message: "Has abandonado el viaje exitosamente",
      };
    } catch (error) {
      console.error("Error leaving travel:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al abandonar viaje"
      );
    }
  }
}
