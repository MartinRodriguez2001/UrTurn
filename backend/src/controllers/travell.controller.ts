import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { TravelData, TravelService } from "../services/travel.service.js";
import { ChatService } from "../services/chat.service.js";
import type { Coordinate } from "../utils/route-assignment.js";

const travelService = new TravelService();
const chatService = new ChatService();

export class TravelController {

  // ✅ POST /travels - Crear nuevo viaje
  async createTravel(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const body = req.body ?? {};

      const pickString = (...keys: string[]): string | undefined => {
        for (const key of keys) {
          const value = body[key];
          if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
          }
        }
        return undefined;
      };

      const pickNumber = (...keys: string[]): number | undefined => {
        for (const key of keys) {
          const value = body[key];
          if (value === undefined || value === null) {
            continue;
          }
          const parsed = typeof value === "number" ? value : Number(value);
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
        return undefined;
      };

      const startLocationName = pickString(
        "start_location_name",
        "startLocationName",
        "start_location",
        "startLocation"
      );
      if (!startLocationName) {
        return res.status(400).json({
          success: false,
          message: "La ubicación de origen es requerida"
        });
      }

      const endLocationName = pickString(
        "end_location_name",
        "endLocationName",
        "end_location",
        "endLocation"
      );
      if (!endLocationName) {
        return res.status(400).json({
          success: false,
          message: "La ubicación de destino es requerida"
        });
      }

      const startLatitude = pickNumber("start_latitude", "startLatitude");
      const startLongitude = pickNumber("start_longitude", "startLongitude");
      const endLatitude = pickNumber("end_latitude", "endLatitude");
      const endLongitude = pickNumber("end_longitude", "endLongitude");

      if (startLatitude === undefined || Math.abs(startLatitude) > 90) {
        return res.status(400).json({
          success: false,
          message: "La latitud de origen es inválida"
        });
      }
      if (startLongitude === undefined || Math.abs(startLongitude) > 180) {
        return res.status(400).json({
          success: false,
          message: "La longitud de origen es inválida"
        });
      }
      if (endLatitude === undefined || Math.abs(endLatitude) > 90) {
        return res.status(400).json({
          success: false,
          message: "La latitud de destino es inválida"
        });
      }
      if (endLongitude === undefined || Math.abs(endLongitude) > 180) {
        return res.status(400).json({
          success: false,
          message: "La longitud de destino es inválida"
        });
      }

      const capacity = pickNumber("capacity");
      if (capacity === undefined) {
        return res.status(400).json({
          success: false,
          message: "La capacidad es requerida"
        });
      }
      const capacityInt = Math.trunc(capacity);

      const price = pickNumber("price");
      if (price === undefined) {
        return res.status(400).json({
          success: false,
          message: "El precio es requerido"
        });
      }

      const spacesAvailable = pickNumber("spaces_available", "spacesAvailable");
      const spacesInt = spacesAvailable !== undefined ? Math.trunc(spacesAvailable) : capacityInt;

      const carId = pickNumber("carId", "vehicleId");
      if (carId === undefined) {
        return res.status(400).json({
          success: false,
          message: "El vehículo es requerido"
        });
      }

      const rawStartTime = pickString("start_time", "startTime");
      if (!rawStartTime) {
        return res.status(400).json({
          success: false,
          message: "La hora de inicio es requerida"
        });
      }

      const startTime = new Date(rawStartTime);
      if (Number.isNaN(startTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "La hora de inicio es inválida"
        });
      }

      const rawEndTime = pickString("end_time", "endTime");
      let endTime: Date | undefined;
      if (rawEndTime) {
        const parsedEnd = new Date(rawEndTime);
        if (Number.isNaN(parsedEnd.getTime())) {
          return res.status(400).json({
            success: false,
            message: "La hora de término es inválida"
          });
        }
        endTime = parsedEnd;
      }

      const parseTravelDate = (value: string): Date => {
        const trimmed = value.trim();

        if (!trimmed) {
          throw new Error("La fecha del viaje es inválida");
        }

        const dateOnlyMatch = trimmed.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
        if (dateOnlyMatch) {
          const [, yearStr, monthStr, dayStr] = dateOnlyMatch;
          const year = Number(yearStr);
          const month = Number(monthStr);
          const day = Number(dayStr);

          if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
            throw new Error("La fecha del viaje es inválida");
          }

          if (month < 1 || month > 12 || day < 1 || day > 31) {
            throw new Error("La fecha del viaje es inválida");
          }

          const parsed = new Date(year, month - 1, day);
          if (Number.isNaN(parsed.getTime())) {
            throw new Error("La fecha del viaje es inválida");
          }

          parsed.setHours(0, 0, 0, 0);
          return parsed;
        }

        const parsed = new Date(trimmed);
        if (Number.isNaN(parsed.getTime())) {
          throw new Error("La fecha del viaje es inválida");
        }

        parsed.setHours(0, 0, 0, 0);
        return parsed;
      };

      const rawTravelDate = pickString("travel_date", "travelDate");
      let travelDate: Date;

      if (rawTravelDate) {
        try {
          travelDate = parseTravelDate(rawTravelDate);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "La fecha del viaje es inválida"
          });
        }
      } else {
        travelDate = new Date(startTime);
        travelDate.setHours(0, 0, 0, 0);
      }

      const resolveRouteWaypoints = (
        input: unknown
      ): Coordinate[] | undefined => {
        if (input === undefined || input === null) {
          return undefined;
        }

        let parsed: unknown = input;
        if (typeof input === "string") {
          try {
            parsed = JSON.parse(input);
          } catch {
            throw new Error(
              "Los puntos de ruta enviados no tienen un formato JSON válido"
            );
          }
        }

        if (!Array.isArray(parsed)) {
          throw new Error(
            "Los puntos de ruta deben ser un arreglo de coordenadas"
          );
        }

        const waypoints: Coordinate[] = parsed.map((item) => {
          if (!item || typeof item !== "object") {
            throw new Error("Cada punto de ruta debe ser un objeto válido");
          }
          const latitude = Number(
            (item as { latitude?: unknown; lat?: unknown }).latitude ??
              (item as { lat?: unknown }).lat
          );
          const longitude = Number(
            (item as { longitude?: unknown; lng?: unknown }).longitude ??
              (item as { lng?: unknown }).lng
          );

          if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) {
            throw new Error("La latitud de un punto de ruta es inválida");
          }
          if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) {
            throw new Error("La longitud de un punto de ruta es inválida");
          }

          return { latitude, longitude };
        });

        return waypoints.length > 0 ? waypoints : undefined;
      };

      const rawRouteWaypoints =
        body.routeWaypoints ?? body.route_waypoints ?? body.route ?? null;
      const routeWaypoints = resolveRouteWaypoints(rawRouteWaypoints);

      const travelData: TravelData = {
        start_location_name: startLocationName,
        start_latitude: startLatitude,
        start_longitude: startLongitude,
        end_location_name: endLocationName,
        end_latitude: endLatitude,
        end_longitude: endLongitude,
        ...(routeWaypoints ? { routeWaypoints } : {}),
        travel_date: travelDate,
        start_time: startTime,
        ...(endTime ? { end_time: endTime } : {}),
        capacity: capacityInt,
        price,
        spaces_available: spacesInt,
        carId: Math.trunc(carId),
      };

      const result = await travelService.registerTravel(travelData, driverId);
      
      res.status(201).json(result);

    } catch (error) {
      console.error("Error in createTravel:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al crear viaje"
      });
    }
  }

  // ✅ POST /travels/requests - Registrar solicitud sin viaje asignado
  async createOpenTravelRequest(req: AuthRequest, res: Response) {
    try {
      const passengerId = req.user?.id;
      if (!passengerId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const {
        startLocationName,
        startLatitude,
        startLongitude,
        endLocationName,
        endLatitude,
        endLongitude,
        pickupDate,
        pickupTime,
      } = req.body ?? {};

      if (typeof startLatitude !== "number" || typeof startLongitude !== "number") {
        return res.status(400).json({
          success: false,
          message: "Las coordenadas de origen son requeridas"
        });
      }

      if (typeof endLatitude !== "number" || typeof endLongitude !== "number") {
        return res.status(400).json({
          success: false,
          message: "Las coordenadas de destino son requeridas"
        });
      }

      const result = await travelService.createOpenTravelRequest(passengerId, {
        startLocationName,
        startLatitude,
        startLongitude,
        endLocationName,
        endLatitude,
        endLongitude,
        pickupDate,
        pickupTime,
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error in createOpenTravelRequest:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al registrar solicitud"
      });
    }
  }

  // ✅ GET /travels/driver - Obtener viajes del conductor
  async getDriverTravels(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const result = await travelService.getDriverTravels(driverId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getDriverTravels:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener viajes del conductor"
      });
    }
  }

  // ✅ GET /travels/available - Obtener viajes disponibles (con filtros)
  async getAvailableTravels(req: AuthRequest, res: Response) {
    try {
      const filters = {
        start_location: req.query.start_location as string,
        end_location: req.query.end_location as string,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        min_spaces: req.query.min_spaces ? parseInt(req.query.min_spaces as string) : undefined,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : 999999
      };

      // Filtrar valores undefined
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ) as {
        start_location?: string;
        end_location?: string;
        start_date?: Date;
        min_spaces?: number;
        max_price: number;
      };

      const result = await travelService.getAvaibleTravels(cleanFilters);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getAvailableTravels:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener viajes disponibles"
      });
    }
  }

  // ✅ POST /travels/:id/request - Solicitar unirse a un viaje
  async requestToJoinTravel(req: AuthRequest, res: Response) {
    try {
      const passengerId = req.user?.id;
      if (!passengerId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");
      const {
        pickupLocation,
        pickupDate,
        pickupTime,
        dropoffLocation,
      } = req.body ?? {};

      const parseCoordinate = (value: unknown): number | undefined => {
        if (value === undefined || value === null) {
          return undefined;
        }
        const parsed = typeof value === "number" ? value : Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const pickupLatitude =
        parseCoordinate(req.body?.pickup_latitude) ??
        parseCoordinate(req.body?.pickupLatitude);
      const pickupLongitude =
        parseCoordinate(req.body?.pickup_longitude) ??
        parseCoordinate(req.body?.pickupLongitude);
      const dropoffLatitude =
        parseCoordinate(req.body?.dropoff_latitude) ??
        parseCoordinate(req.body?.dropoffLatitude);
      const dropoffLongitude =
        parseCoordinate(req.body?.dropoff_longitude) ??
        parseCoordinate(req.body?.dropoffLongitude);

      if (pickupDate && typeof pickupDate !== "string") {
        return res.status(400).json({
          success: false,
          message: "El formato de fecha de recogida es inválido",
        });
      }

      if (pickupTime && typeof pickupTime !== "string") {
        return res.status(400).json({
          success: false,
          message: "El formato de hora de recogida es inválido",
        });
      }

      if (!pickupLocation?.trim()) {
        return res.status(400).json({
          success: false,
          message: "La ubicación de recogida es requerida"
        });
      }

      if (!dropoffLocation?.trim()) {
        return res.status(400).json({
          success: false,
          message: "La ubicación de destino es requerida"
        });
      }

      if (pickupLatitude === undefined || Math.abs(pickupLatitude) > 90) {
        return res.status(400).json({
          success: false,
          message: "La latitud de recogida es inválida"
        });
      }

      if (pickupLongitude === undefined || Math.abs(pickupLongitude) > 180) {
        return res.status(400).json({
          success: false,
          message: "La longitud de recogida es inválida"
        });
      }

      if (dropoffLatitude === undefined || Math.abs(dropoffLatitude) > 90) {
        return res.status(400).json({
          success: false,
          message: "La latitud de destino es inválida"
        });
      }

      if (dropoffLongitude === undefined || Math.abs(dropoffLongitude) > 180) {
        return res.status(400).json({
          success: false,
          message: "La longitud de destino es inválida"
        });
      }

      let parsedPickupDate: Date | undefined;
      if (typeof pickupDate === "string") {
        const candidate = new Date(pickupDate);
        if (isNaN(candidate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "La fecha de recogida proporcionada no es válida",
          });
        }
        candidate.setHours(0, 0, 0, 0);
        parsedPickupDate = candidate;
      }

      let parsedPickupTime: Date | undefined;
      if (typeof pickupTime === "string") {
        const candidate = new Date(pickupTime);
        if (isNaN(candidate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "La hora de recogida proporcionada no es válida",
          });
        }
        candidate.setSeconds(0, 0);
        parsedPickupTime = candidate;
      }

      if (parsedPickupDate && parsedPickupTime) {
        parsedPickupTime.setFullYear(
          parsedPickupDate.getFullYear(),
          parsedPickupDate.getMonth(),
          parsedPickupDate.getDate()
        );
      }

      const result = await travelService.requestToJoinTravel(
        travelId, 
        passengerId, 
        pickupLocation,
        pickupLatitude,
        pickupLongitude,
        dropoffLocation,
        dropoffLatitude,
        dropoffLongitude,
        parsedPickupDate,
        parsedPickupTime
      );
      
      res.status(201).json(result);

    } catch (error) {
      console.error("Error in requestToJoinTravel:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al solicitar viaje"
      });
    }
  }

  // ✅ PUT /travels/requests/:id/respond - Responder solicitud de viaje
  async respondToTravelRequest(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const requestId = parseInt(req.params.id || "");
      const { accept } = req.body;

      if (typeof accept !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: "El campo 'accept' es requerido y debe ser boolean"
        });
      }

      const result = await travelService.respondToTravelRequest(
        requestId, 
        driverId, 
        accept
      );
      
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in respondToTravelRequest:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al responder solicitud"
      });
    }
  }

  // ✅ DELETE /travels/:id - Cancelar viaje
  async cancelTravel(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");
      const { reason } = req.body;

      const result = await travelService.cancelTravel(travelId, userId, reason);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in cancelTravel:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al cancelar viaje"
      });
    }
  }

  // ✅ PUT /travels/:id/complete - Finalizar viaje
  async completeTravel(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");

      const result = await travelService.completeTravel(travelId, driverId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in completeTravel:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al finalizar viaje"
      });
    }
  }

  // ✅ GET /travels/:id/requests - Obtener solicitudes de un viaje
  async getTravelRequests(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");

      const result = await travelService.getTravelRequests(travelId, driverId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getTravelRequests:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener solicitudes del viaje"
      });
    }
  }

  // ✅ GET /travels/passenger - Obtener viajes del pasajero
  async getPassengerTravels(req: AuthRequest, res: Response) {
    try {
      const passengerId = req.user?.id;
      if (!passengerId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const result = await travelService.getPassengerTravels(passengerId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getPassengerTravels:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener viajes del pasajero"
      });
    }
  }

  // ✅ DELETE /travels/:id/passengers/:passengerId - Remover pasajero
  async removePassenger(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");
      const passengerId = parseInt(req.params.passengerId || "");

      const result = await travelService.removePassenger(
        travelId, 
        passengerId, 
        driverId
      );
      
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in removePassenger:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al remover pasajero"
      });
    }
  }

  // ✅ GET /travels/search - Buscar viajes por ubicación
  async searchTravelsByLocation(req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: "El parámetro 'query' es requerido"
        });
      }

      const result = await travelService.searchTravelsByLocation(query);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in searchTravelsByLocation:", error);
      res.status(500).json({
        success: false,
        message: "Error en la búsqueda de viajes"
      });
    }
  }

  // ✅ DELETE /travels/requests/:id/cancel - Cancelar solicitud de viaje (pasajero)
  async cancelTravelRequest(req: AuthRequest, res: Response) {
    try {
      const passengerId = req.user?.id;
      if (!passengerId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const requestId = parseInt(req.params.id || "");

      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: "ID de solicitud inválido"
        });
      }

      const result = await travelService.cancelTravelRequest(requestId, passengerId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in cancelTravelRequest:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al cancelar solicitud"
      });
    }
  }

  // ✅ DELETE /travels/:id/leave - Abandonar viaje confirmado (pasajero)
  async findMatchingTravels(req: AuthRequest, res: Response) {
    try {
      const passengerId = req.user?.id ?? null;
      const body = req.body ?? {};

      const extractNumber = (...keys: string[]): number | undefined => {
        for (const key of keys) {
          if (!(key in body)) {
            continue;
          }
          const value = body[key];
          const parsed =
            typeof value === "number"
              ? value
              : typeof value === "string" && value.trim().length > 0
              ? Number(value)
              : NaN;
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
        return undefined;
      };

      const pickupLatitude = extractNumber(
        "pickupLatitude",
        "originLatitude",
        "startLatitude"
      );
      if (pickupLatitude === undefined || Math.abs(pickupLatitude) > 90) {
        return res.status(400).json({
          success: false,
          message: "La latitud de recogida es requerida y debe ser válida",
        });
      }

      const pickupLongitude = extractNumber(
        "pickupLongitude",
        "originLongitude",
        "startLongitude"
      );
      if (pickupLongitude === undefined || Math.abs(pickupLongitude) > 180) {
        return res.status(400).json({
          success: false,
          message: "La longitud de recogida es requerida y debe ser válida",
        });
      }

      const dropoffLatitude = extractNumber(
        "dropoffLatitude",
        "destinationLatitude",
        "endLatitude"
      );
      if (dropoffLatitude === undefined || Math.abs(dropoffLatitude) > 90) {
        return res.status(400).json({
          success: false,
          message: "La latitud de destino es requerida y debe ser válida",
        });
      }

      const dropoffLongitude = extractNumber(
        "dropoffLongitude",
        "destinationLongitude",
        "endLongitude"
      );
      if (dropoffLongitude === undefined || Math.abs(dropoffLongitude) > 180) {
        return res.status(400).json({
          success: false,
          message: "La longitud de destino es requerida y debe ser válida",
        });
      }

      const averageSpeedKmh = extractNumber("averageSpeedKmh");
      const maxAdditionalMinutes = extractNumber("maxAdditionalMinutes");
      const maxDeviationMeters = extractNumber("maxDeviationMeters");
      const timeWindowMinutes = extractNumber("timeWindowMinutes");
      const maxResultsRaw = extractNumber("maxResults");

      const pickupTimeInput =
        typeof body.pickupTime === "string" ? body.pickupTime : undefined;
      const pickupDateInput =
        typeof body.pickupDate === "string" ? body.pickupDate : undefined;

      let pickupDateTime: Date | undefined;
      if (pickupTimeInput) {
        const parsedTime = new Date(pickupTimeInput);
        if (!Number.isNaN(parsedTime.valueOf())) {
          pickupDateTime = parsedTime;
        }
      } else if (pickupDateInput) {
        const parsedDate = new Date(pickupDateInput);
        if (!Number.isNaN(parsedDate.valueOf())) {
          parsedDate.setHours(0, 0, 0, 0);
          pickupDateTime = parsedDate;
        }
      }

      const result = await travelService.findMatchingTravelsForPassenger(
        passengerId,
        {
          pickupLatitude,
          pickupLongitude,
          dropoffLatitude,
          dropoffLongitude,
        },
        {
          ...(averageSpeedKmh !== undefined
            ? { averageSpeedKmh }
            : undefined),
          ...(maxAdditionalMinutes !== undefined
            ? { maxAdditionalMinutes }
            : undefined),
          ...(maxDeviationMeters !== undefined
            ? { maxDeviationMeters }
            : undefined),
          ...(timeWindowMinutes !== undefined
            ? { timeWindowMinutes }
            : undefined),
          ...(maxResultsRaw !== undefined
            ? { maxResults: Math.trunc(maxResultsRaw) }
            : undefined),
          ...(pickupDateTime ? { pickupDateTime } : undefined),
        }
      );

      res.status(200).json(result);
    } catch (error) {
      console.error("Error finding matching travels:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al buscar coincidencias de viajes",
      });
    }
  }

  async leaveTravel(req: AuthRequest, res: Response) {
    try {
      const passengerId = req.user?.id;
      if (!passengerId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");

      if (isNaN(travelId)) {
        return res.status(400).json({
          success: false,
          message: "ID de viaje inválido"
        });
      }

      const result = await travelService.leaveTravel(travelId, passengerId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in leaveTravel:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al abandonar viaje"
      });
    }
  }

  // ✅ GET /travels/:id/messages - Obtener historial de chat del viaje
  async getTravelMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = Number(req.params.id);
      if (!Number.isFinite(travelId)) {
        return res.status(400).json({
          success: false,
          message: "ID de viaje inválido"
        });
      }

      const messages = await chatService.getMessages(travelId, userId);
      return res.status(200).json({
        success: true,
        messages
      });
    } catch (error) {
      console.error("Error in getTravelMessages:", error);
      const message = error instanceof Error ? error.message : "Error al obtener mensajes";
      const status = message.includes("no encontrado")
        ? 404
        : message.includes("autorizado")
          ? 403
          : 500;
      return res.status(status).json({
        success: false,
        message
      });
    }
  }

  // ✅ POST /travels/:id/messages - Enviar mensaje del viaje
  async sendTravelMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = Number(req.params.id);
      if (!Number.isFinite(travelId)) {
        return res.status(400).json({
          success: false,
          message: "ID de viaje inválido"
        });
      }

      const body: unknown = req.body?.body ?? req.body?.message ?? req.body?.text;
      if (typeof body !== "string" || body.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "El mensaje es requerido"
        });
      }

      const message = await chatService.sendMessage({
        travelId,
        senderId: userId,
        body
      });

      return res.status(201).json({
        success: true,
        message: "Mensaje enviado",
        data: message
      });
    } catch (error) {
      console.error("Error in sendTravelMessage:", error);
      const message = error instanceof Error ? error.message : "Error al enviar mensaje";
      const status = message.includes("no encontrado")
        ? 404
        : message.includes("autorizado")
          ? 403
          : 500;
      return res.status(status).json({
        success: false,
        message
      });
    }
  }
}
