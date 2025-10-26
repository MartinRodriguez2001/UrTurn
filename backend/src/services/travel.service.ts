import { Prisma, PrismaClient, TravelStatus } from "../../generated/prisma/index.js";
import { decodePolyline } from "../utils/polyline.js";
import type {
  AssignmentCandidate,
  Coordinate,
  PassengerStops,
  RouteMetrics,
} from "../utils/route-assignment.js";
import {
  estimateRouteMetrics,
  evaluatePassengerInsertion,
  summarizeAssignmentCandidate,
} from "../utils/route-assignment.js";

const prisma = new PrismaClient();

export interface TravelData {
  start_location_name: string;
  start_latitude: number;
  start_longitude: number;
  end_location_name: string;
  end_latitude: number;
  end_longitude: number;
  routeWaypoints?: Coordinate[];
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

interface PassengerAssignmentInput {
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
}

interface PassengerAssignmentConfig {
  averageSpeedKmh?: number;
  maxAdditionalMinutes?: number;
  maxDeviationMeters?: number;
  routeWaypoints?: Coordinate[];
}

type AssignmentSummary = ReturnType<typeof summarizeAssignmentCandidate>;

type TravelStopType = "start" | "pickup" | "dropoff" | "end";

interface TravelStop {
  type: TravelStopType;
  latitude: number;
  longitude: number;
  locationName?: string | null;
  passengerId?: number;
  requestId?: number;
}

export interface TravelMatchResult {
  travelId: number;
  price: number;
  startTime: Date;
  spacesAvailable: number;
  driver: {
    id: number;
    name: string;
    profile_picture: string | null;
    institutional_email: string;
    phone_number: string | null;
    rating: number | null;
  };
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    licence_plate: string;
  } | null;
  summary: AssignmentSummary;
  candidate: AssignmentCandidate;
  baseMetrics: RouteMetrics;
  originalRoute: Coordinate[];
  updatedRoute?: Coordinate[];
}

export interface PassengerMatchingOptions extends PassengerAssignmentConfig {
  pickupDateTime?: Date;
  timeWindowMinutes?: number;
  maxResults?: number;
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

      const normalizedRouteWaypoints = this.sanitizeRouteWaypoints(
        travelData.routeWaypoints
      );
      const initialPlannedStops = this.buildInitialStopsForTravel(travelData);
      const computedRouteFromStops = await this.calculateRouteWaypointsFromStops(
        initialPlannedStops
      );
      const initialRouteWaypoints =
        normalizedRouteWaypoints ??
        computedRouteFromStops ??
          this.buildRouteFromStops(initialPlannedStops);
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
          route_waypoints: initialRouteWaypoints.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          })),
          planned_stops: this.serializePlannedStops(initialPlannedStops),
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

  private sanitizeRouteWaypoints(
    waypoints?: Coordinate[]
  ): Coordinate[] | null {
    if (!waypoints || waypoints.length === 0) {
      return null;
    }

    const normalized: Coordinate[] = [];

    for (const waypoint of waypoints) {
      if (
        !waypoint ||
        waypoint.latitude === undefined ||
        waypoint.longitude === undefined
      ) {
        throw new Error("Los puntos de ruta incluyen valores incompletos");
      }

      const latitude = Number(waypoint.latitude);
      const longitude = Number(waypoint.longitude);

      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) {
        throw new Error("La latitud de un punto de ruta es inválida");
      }
      if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) {
        throw new Error("La longitud de un punto de ruta es inválida");
      }

      const alreadyAdded = normalized[normalized.length - 1];
      if (
        alreadyAdded &&
        Math.abs(alreadyAdded.latitude - latitude) <= 1e-6 &&
        Math.abs(alreadyAdded.longitude - longitude) <= 1e-6
      ) {
        continue;
      }

      normalized.push({ latitude, longitude });
    }

    return normalized.length >= 2 ? normalized : null;
  }

  private parseStoredRouteWaypoints(stored: unknown): Coordinate[] | null {
    if (!stored) {
      return null;
    }

    if (!Array.isArray(stored)) {
      return null;
    }

    const candidateWaypoints: Coordinate[] = [];

    for (const raw of stored) {
      if (!raw || typeof raw !== "object") {
        continue;
      }

      const maybeLatitude =
        (raw as { latitude?: unknown; lat?: unknown }).latitude ??
        (raw as { lat?: unknown }).lat;
      const maybeLongitude =
        (raw as { longitude?: unknown; lng?: unknown }).longitude ??
        (raw as { lng?: unknown }).lng;

      const latitude = Number(maybeLatitude);
      const longitude = Number(maybeLongitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      candidateWaypoints.push({ latitude, longitude });
    }

    return this.sanitizeRouteWaypoints(candidateWaypoints);
  }

  private buildInitialStopsForTravel(travelData: TravelData): TravelStop[] {
    return [
      {
        type: "start",
        latitude: Number(travelData.start_latitude),
        longitude: Number(travelData.start_longitude),
        locationName: travelData.start_location_name?.trim() ?? null,
      },
      {
        type: "end",
        latitude: Number(travelData.end_latitude),
        longitude: Number(travelData.end_longitude),
        locationName: travelData.end_location_name?.trim() ?? null,
      },
    ];
  }

  private parseStoredStops(stored: unknown): TravelStop[] {
    if (!Array.isArray(stored)) {
      return [];
    }

    const stops: TravelStop[] = [];

    for (const raw of stored) {
      if (!raw || typeof raw !== "object") {
        continue;
      }

      const possibleType = (raw as { type?: unknown }).type;
      if (
        possibleType !== "start" &&
        possibleType !== "pickup" &&
        possibleType !== "dropoff" &&
        possibleType !== "end"
      ) {
        continue;
      }

      const latitude = Number(
        (raw as { latitude?: unknown; lat?: unknown }).latitude ??
          (raw as { lat?: unknown }).lat
      );
      const longitude = Number(
        (raw as { longitude?: unknown; lng?: unknown }).longitude ??
          (raw as { lng?: unknown }).lng
      );

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      const stop: TravelStop = {
        type: possibleType,
        latitude,
        longitude,
      };

      const maybeLocation = (raw as { locationName?: unknown }).locationName;
      if (
        typeof maybeLocation === "string" ||
        maybeLocation === null
      ) {
        stop.locationName = maybeLocation;
      }

      const maybePassengerId = (raw as { passengerId?: unknown }).passengerId;
      if (
        typeof maybePassengerId === "number" &&
        Number.isInteger(maybePassengerId)
      ) {
        stop.passengerId = maybePassengerId;
      }

      const maybeRequestId = (raw as { requestId?: unknown }).requestId;
      if (
        typeof maybeRequestId === "number" &&
        Number.isInteger(maybeRequestId)
      ) {
        stop.requestId = maybeRequestId;
      }

      stops.push(stop);
    }

    return stops;
  }

  private ensureDriverEndpoints(
    storedStops: unknown,
    travel: {
      start_latitude: number;
      start_longitude: number;
      start_location_name: string | null;
      end_latitude: number;
      end_longitude: number;
      end_location_name: string | null;
    }
  ): TravelStop[] {
    const parsed = this.parseStoredStops(storedStops);

    const driverStart: TravelStop = {
      type: "start",
      latitude: Number(travel.start_latitude),
      longitude: Number(travel.start_longitude),
      locationName: travel.start_location_name,
    };

    const driverEnd: TravelStop = {
      type: "end",
      latitude: Number(travel.end_latitude),
      longitude: Number(travel.end_longitude),
      locationName: travel.end_location_name,
    };

    if (parsed.length === 0) {
      return [driverStart, driverEnd];
    }

    const stops = parsed.filter((stop) =>
      Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)
    );

    const [first] = stops;
    if (!first || first.type !== "start") {
      stops.unshift(driverStart);
    } else {
      stops[0] = {
        type: "start",
        latitude: driverStart.latitude,
        longitude: driverStart.longitude,
        locationName: driverStart.locationName,
      };
    }

    const last = stops[stops.length - 1];
    if (!last || last.type !== "end") {
      stops.push(driverEnd);
    } else {
      stops[stops.length - 1] = {
        type: "end",
        latitude: driverEnd.latitude,
        longitude: driverEnd.longitude,
        locationName: driverEnd.locationName,
      };
    }

    if (stops.length < 2) {
      stops.push(driverEnd);
    }

    return stops;
  }

  private serializePlannedStops(stops: TravelStop[]): Prisma.InputJsonValue {
    return stops.map((stop) => ({
      type: stop.type,
      latitude: stop.latitude,
      longitude: stop.longitude,
      locationName: stop.locationName ?? null,
      ...(stop.passengerId !== undefined
        ? { passengerId: stop.passengerId }
        : {}),
      ...(stop.requestId !== undefined
        ? { requestId: stop.requestId }
        : {}),
    }));
  }

  private buildRouteFromStops(stops: TravelStop[]): Coordinate[] {
    const coordinates = stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));

    return this.sanitizeRouteWaypoints(coordinates) ?? coordinates;
  }

  private resolveMapsApiKey(): string | null {
    const candidates = [
      process.env.GOOGLE_MAPS_DIRECTIONS_KEY,
      process.env.GOOGLE_MAPS_API_KEY,
      process.env.GOOGLE_MAPS_KEY,
      process.env.MAPS_API_KEY,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }

    return null;
  }

  private async calculateRouteWaypointsFromStops(
    stops: TravelStop[]
  ): Promise<Coordinate[] | null> {
    if (stops.length < 2) {
      return null;
    }

    const googleRoute = await this.tryGoogleDirections(stops);
    if (googleRoute && googleRoute.length >= 2) {
      return googleRoute;
    }

    const osrmRoute = await this.tryOsrmDirections(stops);
    if (osrmRoute && osrmRoute.length >= 2) {
      return osrmRoute;
    }

    return this.buildRouteFromStops(stops);
  }

  private async tryGoogleDirections(
    stops: TravelStop[]
  ): Promise<Coordinate[] | null> {
    const apiKey = this.resolveMapsApiKey();
    if (!apiKey) {
      return null;
    }

    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];
    if (!firstStop || !lastStop) {
      return null;
    }

    const origin = `${firstStop.latitude},${firstStop.longitude}`;
    const destination = `${lastStop.latitude},${lastStop.longitude}`;
    const intermediateStops = stops.slice(1, stops.length - 1);
    const waypointParam =
      intermediateStops.length > 0
        ? intermediateStops
            .map((stop) => `via:${stop.latitude},${stop.longitude}`)
            .join("|")
        : null;

    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("units", "metric");
    url.searchParams.set("key", apiKey);
    if (waypointParam) {
      url.searchParams.set("waypoints", waypointParam);
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Direcciones respondió con estado ${response.status}`);
      }

      const payload: unknown = await response.json();
      const routes =
        payload && typeof payload === "object"
          ? (payload as { routes?: Array<Record<string, unknown>> }).routes ?? []
          : [];

      if (!routes || routes.length === 0) {
        throw new Error("El servicio de direcciones no devolvió rutas");
      }

      const primaryRoute = routes[0];
      const overview =
        primaryRoute && typeof primaryRoute === "object"
          ? (primaryRoute as { overview_polyline?: { points?: string } }).overview_polyline
          : undefined;

      let points = overview?.points ? decodePolyline(overview.points) : [];

      if (points.length === 0) {
        const legs =
          primaryRoute && typeof primaryRoute === "object"
            ? (primaryRoute as { legs?: Array<Record<string, unknown>> }).legs ?? []
            : [];

        const legPoints: { latitude: number; longitude: number }[] = [];

        for (const leg of legs) {
          const steps =
            leg && typeof leg === "object"
              ? (leg as { steps?: Array<Record<string, unknown>> }).steps ?? []
              : [];

          for (const step of steps) {
            const encoded =
              step && typeof step === "object"
                ? (step as { polyline?: { points?: string } }).polyline?.points
                : undefined;
            if (!encoded) {
              continue;
            }
            const decoded = decodePolyline(encoded);
            if (decoded.length > 0) {
              legPoints.push(...decoded);
            }
          }
        }

        if (legPoints.length > 0) {
          points = legPoints;
        }
      }

      if (points.length === 0) {
        throw new Error("No se pudieron decodificar puntos de la ruta");
      }

      const coordinates = points.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      }));

      return this.sanitizeRouteWaypoints(coordinates) ?? coordinates;
    } catch (error) {
      console.warn(
        "[TravelService] Google Directions falló, usando rutas alternativas:",
        error
      );
      return null;
    }
  }

  private async tryOsrmDirections(
    stops: TravelStop[]
  ): Promise<Coordinate[] | null> {
    if (stops.length < 2) {
      return null;
    }

    try {
      const baseUrl = "https://router.project-osrm.org/route/v1/driving";
      const coordinatePath = stops
        .map((stop) => `${stop.longitude},${stop.latitude}`)
        .join(";");
      const url = new URL(`${baseUrl}/${coordinatePath}`);
      url.searchParams.set("overview", "full");
      url.searchParams.set("steps", "false");
      url.searchParams.set("geometries", "geojson");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`OSRM respondió con estado ${response.status}`);
      }

      const payload: unknown = await response.json();
      const routes =
        payload && typeof payload === "object"
          ? (payload as {
              routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> } }>;
            }).routes ?? []
          : [];

      const coordinates = routes?.[0]?.geometry?.coordinates ?? [];
      if (!Array.isArray(coordinates) || coordinates.length === 0) {
        return null;
      }

      const mapped = coordinates.map(([longitude, latitude]) => ({
        latitude,
        longitude,
      }));

      return this.sanitizeRouteWaypoints(mapped) ?? mapped;
    } catch (error) {
      console.warn(
        "[TravelService] OSRM Directions falló, se usará ruta directa entre paradas:",
        error
      );
      return null;
    }
  }

  private createPassengerStopEntries(
    request: {
      id: number;
      passengerId: number;
      start_latitude: number;
      start_longitude: number;
      end_latitude: number;
      end_longitude: number;
      start_location_name: string | null;
      end_location_name: string | null;
    }
  ): { pickup: TravelStop; dropoff: TravelStop } {
    return {
      pickup: {
        type: "pickup",
        latitude: Number(request.start_latitude),
        longitude: Number(request.start_longitude),
        locationName: request.start_location_name,
        passengerId: request.passengerId,
        requestId: request.id,
      },
      dropoff: {
        type: "dropoff",
        latitude: Number(request.end_latitude),
        longitude: Number(request.end_longitude),
        locationName: request.end_location_name,
        passengerId: request.passengerId,
        requestId: request.id,
      },
    };
  }

  private applyPassengerInsertionToStops(
    existingStops: TravelStop[],
    passengerStops: { pickup: TravelStop; dropoff: TravelStop },
    indexes: { pickup: number; dropoff: number }
  ): TravelStop[] {
    const updated = [...existingStops];

    const pickupIndex = Math.min(
      Math.max(indexes.pickup, 1),
      updated.length
    );
    updated.splice(pickupIndex, 0, passengerStops.pickup);

    let dropoffIndex = indexes.dropoff;
    if (dropoffIndex <= pickupIndex) {
      dropoffIndex = pickupIndex + 1;
    }
    dropoffIndex = Math.min(Math.max(dropoffIndex, pickupIndex + 1), updated.length);
    updated.splice(dropoffIndex, 0, passengerStops.dropoff);

    return updated;
  }

  private fallbackAddPassengerStops(
    existingStops: TravelStop[],
    passengerStops: { pickup: TravelStop; dropoff: TravelStop }
  ): TravelStop[] {
    const updated = [...existingStops];
    const insertionIndex = Math.max(updated.length - 1, 1);
    updated.splice(insertionIndex, 0, passengerStops.pickup);
    updated.splice(insertionIndex + 1, 0, passengerStops.dropoff);
    return updated;
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
      const processedTravels = travels.map((travel) => {
        const plannedStops = this.ensureDriverEndpoints(
          travel.planned_stops,
          {
            start_latitude: travel.start_latitude,
            start_longitude: travel.start_longitude,
            start_location_name: travel.start_location_name ?? null,
            end_latitude: travel.end_latitude,
            end_longitude: travel.end_longitude,
            end_location_name: travel.end_location_name ?? null,
          }
        );

        const normalizedRoute =
          this.parseStoredRouteWaypoints(travel.route_waypoints) ??
          this.buildRouteFromStops(plannedStops);

        const formattedStops = plannedStops.map((stop) => ({
          type: stop.type,
          latitude: stop.latitude,
          longitude: stop.longitude,
          locationName: stop.locationName ?? null,
          ...(stop.passengerId !== undefined
            ? { passengerId: stop.passengerId }
            : {}),
          ...(stop.requestId !== undefined ? { requestId: stop.requestId } : {}),
        }));

        return {
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
        route_waypoints: normalizedRoute,
        routeWaypoints: normalizedRoute,
        planned_stops: formattedStops,
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
        };
      });

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

      // Si acepta, recalcular la ruta y persistirla
      let updatedRoute: Coordinate[] | null = null;
      let plannedStopsForResponse: TravelStop[] | null = null;
      let insertionSummary: AssignmentSummary | undefined;

      if (accept) {
        console.log("[TravelService] Starting route update", {
          requestId,
          travelId,
          passengerId: request.passengerId,
        });

        const pickupLat = Number(request.start_latitude);
        const pickupLng = Number(request.start_longitude);
        const dropoffLat = Number(request.end_latitude);
        const dropoffLng = Number(request.end_longitude);

        const driverStopsContext = {
          start_latitude: Number(request.travel.start_latitude),
          start_longitude: Number(request.travel.start_longitude),
          start_location_name: request.travel.start_location_name ?? null,
          end_latitude: Number(request.travel.end_latitude),
          end_longitude: Number(request.travel.end_longitude),
          end_location_name: request.travel.end_location_name ?? null,
        };

        let plannedStops = this.ensureDriverEndpoints(
          request.travel.planned_stops,
          driverStopsContext
        );

        const baselineRoute = plannedStops.map((stop) => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        }));

        const passengerStops = this.createPassengerStopEntries({
          id: request.id,
          passengerId: request.passengerId,
          start_latitude: pickupLat,
          start_longitude: pickupLng,
          end_latitude: dropoffLat,
          end_longitude: dropoffLng,
          start_location_name:
            request.start_location_name ??
            request.travel.start_location_name ??
            null,
          end_location_name:
            request.end_location_name ??
            request.travel.end_location_name ??
            null,
        });

        const hasValidPickup =
          Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
        const hasValidDropoff =
          Number.isFinite(dropoffLat) && Number.isFinite(dropoffLng);

        let insertionIndexes: { pickup: number; dropoff: number } | null = null;

        if (hasValidPickup && hasValidDropoff && baselineRoute.length >= 2) {
          const passengerInput: PassengerAssignmentInput = {
            pickupLatitude: pickupLat,
            pickupLongitude: pickupLng,
            dropoffLatitude: dropoffLat,
            dropoffLongitude: dropoffLng,
          };

          try {
            const evaluation = await this.evaluatePassengerAssignment(
              travelId,
              passengerInput,
              {
                averageSpeedKmh: 30,
                maxAdditionalMinutes: 60,
                routeWaypoints: baselineRoute,
              }
            );

            if (evaluation.success && evaluation.candidate) {
              insertionIndexes = {
                pickup: evaluation.candidate.pickupInsertIndex,
                dropoff: evaluation.candidate.dropoffInsertIndex,
              };
              insertionSummary = evaluation.summary;
              console.log("[TravelService] Assignment evaluator produced plan", {
                requestId,
                travelId,
                pickupIndex: insertionIndexes.pickup,
                dropoffIndex: insertionIndexes.dropoff,
                additionalMinutes: evaluation.summary?.additionalMinutes,
              });
            }
          } catch (evaluationError) {
            console.warn(
              "No se pudo recalcular la ruta con el evaluador de asignaciones:",
              evaluationError
            );
          }
        }

        if (insertionIndexes) {
          plannedStops = this.applyPassengerInsertionToStops(
            plannedStops,
            passengerStops,
            insertionIndexes
          );
        } else {
          plannedStops = this.fallbackAddPassengerStops(
            plannedStops,
            passengerStops
          );
          console.log("[TravelService] Using fallback stop insertion", {
            requestId,
            travelId,
            totalStops: plannedStops.length,
          });
        }

        const recalculatedRoute =
          (await this.calculateRouteWaypointsFromStops(plannedStops)) ??
          this.buildRouteFromStops(plannedStops);
        updatedRoute = recalculatedRoute;
        plannedStopsForResponse = plannedStops;

        await prisma.confirmation.create({
          data: {
            travelId,
            usuarioId: request.passengerId,
          },
        });

        const travelUpdateData: Prisma.TravelUpdateInput = {
          spaces_available: {
            decrement: 1,
          },
          planned_stops: this.serializePlannedStops(plannedStops),
        };

        travelUpdateData.route_waypoints = recalculatedRoute.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
        })) as Prisma.InputJsonValue;

        await prisma.travel.update({
          where: { id: travelId },
          data: travelUpdateData,
        });

        console.log("[TravelService] Planned stops and route persisted", {
          travelId,
          requestId,
          totalStops: plannedStops.length,
          totalWaypoints: recalculatedRoute.length,
        });
      }

      return {
        success: true,
        request: updatedRequest,
        ...(updatedRoute ? { updatedRoute } : {}),
        ...(plannedStopsForResponse ? { plannedStops: plannedStopsForResponse } : {}),
        ...(insertionSummary ? { insertionSummary } : {}),
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

  async evaluatePassengerAssignment(
    travelId: number,
    passenger: PassengerAssignmentInput,
    config?: PassengerAssignmentConfig
  ): Promise<{
    success: boolean;
    summary?: AssignmentSummary;
    candidate?: AssignmentCandidate;
    baseMetrics: RouteMetrics;
    originalRoute: Coordinate[];
    updatedRoute?: Coordinate[];
    message?: string;
  }> {
    try {
      const travel = await prisma.travel.findUnique({
        where: { id: travelId },
      });

      if (!travel) {
        throw new Error("El viaje solicitado no existe");
      }

      const ensureCoordinate = (
        value: number,
        min: number,
        max: number,
        errorMessage: string
      ) => {
        if (!Number.isFinite(value) || value < min || value > max) {
          throw new Error(errorMessage);
        }
      };

      ensureCoordinate(
        passenger.pickupLatitude,
        -90,
        90,
        "La latitud de recogida es inválida"
      );
      ensureCoordinate(
        passenger.pickupLongitude,
        -180,
        180,
        "La longitud de recogida es inválida"
      );
      ensureCoordinate(
        passenger.dropoffLatitude,
        -90,
        90,
        "La latitud de destino del pasajero es inválida"
      );
      ensureCoordinate(
        passenger.dropoffLongitude,
        -180,
        180,
        "La longitud de destino del pasajero es inválida"
      );

      const averageSpeedKmh = config?.averageSpeedKmh ?? 30;
      const maxAdditionalMinutes = config?.maxAdditionalMinutes ?? 5;
      const maxDeviationMeters =
        config?.maxDeviationMeters !== undefined &&
        Number.isFinite(config.maxDeviationMeters)
          ? config.maxDeviationMeters
          : undefined;

      const startCoordinate: Coordinate = {
        latitude: travel.start_latitude,
        longitude: travel.start_longitude,
      };
      const endCoordinate: Coordinate = {
        latitude: travel.end_latitude,
        longitude: travel.end_longitude,
      };

      const providedRoute =
        config?.routeWaypoints && config.routeWaypoints.length >= 2
          ? config.routeWaypoints
          : undefined;

      const initialRoute: Coordinate[] = providedRoute
        ? [...providedRoute]
        : [startCoordinate, endCoordinate];

      const coordinatesAreClose = (
        a: Coordinate | undefined,
        b: Coordinate
      ) =>
        !!a &&
        Math.abs(a.latitude - b.latitude) <= 1e-5 &&
        Math.abs(a.longitude - b.longitude) <= 1e-5;

      if (!coordinatesAreClose(initialRoute[0], startCoordinate)) {
        initialRoute.unshift(startCoordinate);
      }

      if (
        !coordinatesAreClose(
          initialRoute[initialRoute.length - 1],
          endCoordinate
        )
      ) {
        initialRoute.push(endCoordinate);
      }

      const originalRoute: Coordinate[] = [];
      for (const waypoint of initialRoute) {
        const last = originalRoute[originalRoute.length - 1];
        if (
          last &&
          Math.abs(last.latitude - waypoint.latitude) <= 1e-6 &&
          Math.abs(last.longitude - waypoint.longitude) <= 1e-6
        ) {
          continue;
        }
        originalRoute.push(waypoint);
      }

      if (originalRoute.length < 2) {
        throw new Error(
          "La ruta del conductor debe incluir al menos origen y destino"
        );
      }

      const baseMetrics = estimateRouteMetrics(
        originalRoute,
        averageSpeedKmh
      );

      const passengerStops: PassengerStops = {
        pickup: {
          latitude: passenger.pickupLatitude,
          longitude: passenger.pickupLongitude,
        },
        dropoff: {
          latitude: passenger.dropoffLatitude,
          longitude: passenger.dropoffLongitude,
        },
      };

      const candidate = evaluatePassengerInsertion(
        originalRoute,
        passengerStops,
        {
          averageSpeedKmh,
          maxAdditionalMinutes,
          ...(maxDeviationMeters !== undefined
            ? { maxDeviationMeters }
            : {}),
        }
      );

      if (!candidate) {
        return {
          success: false,
          baseMetrics,
          originalRoute,
          message:
            "El pasajero no se puede insertar sin superar el límite de minutos extra o el desvío máximo configurado",
        };
      }

      const summary = summarizeAssignmentCandidate(candidate);

      return {
        success: true,
        summary,
        candidate,
        baseMetrics: candidate.baseMetrics,
        originalRoute,
        updatedRoute: candidate.updatedRoute,
      };
    } catch (error) {
      console.error("Error evaluating passenger assignment:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al evaluar la asignación del pasajero"
      );
    }
  }

  async findMatchingTravelsForPassenger(
    passengerId: number | null,
    passenger: PassengerAssignmentInput,
    options?: PassengerMatchingOptions
  ): Promise<{
    success: boolean;
    matches: TravelMatchResult[];
    count: number;
    totalCandidates: number;
    appliedConfig: {
      averageSpeedKmh: number;
      maxAdditionalMinutes: number;
      maxDeviationMeters: number | null;
      timeWindowMinutes: number;
      maxResults: number;
      pickupDateTime: string | null;
    };
  }> {
    const averageSpeedKmh = options?.averageSpeedKmh ?? 30;
    const maxAdditionalMinutes = options?.maxAdditionalMinutes ?? 5;
    const maxDeviationMeters =
      options?.maxDeviationMeters !== undefined &&
      Number.isFinite(options.maxDeviationMeters)
        ? options.maxDeviationMeters
        : undefined;
    const timeWindowMinutes = options?.timeWindowMinutes ?? 90;
    const maxResults = Math.max(options?.maxResults ?? 10, 1);
    const pickupDateTime = options?.pickupDateTime ?? null;

    const whereClause: Record<string, unknown> = {
      status: TravelStatus.confirmado,
      spaces_available: { gt: 0 },
    };

    if (passengerId) {
      whereClause.userId = { not: passengerId };
    }

    if (pickupDateTime) {
      const windowMs = timeWindowMinutes * 60 * 1000;
      const windowStart = new Date(pickupDateTime.getTime() - windowMs);
      const windowEnd = new Date(pickupDateTime.getTime() + windowMs);
      whereClause.start_time = {
        gte: windowStart,
        lte: windowEnd,
      };
    } else {
      whereClause.start_time = {
        gte: new Date(),
      };
    }

    const initialCandidates = await prisma.travel.findMany({
      where: whereClause,
      include: {
        driver_id: {
          select: {
            id: true,
            name: true,
            profile_picture: true,
            institutional_email: true,
            phone_number: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            licence_plate: true,
          },
        },
        reviews: {
          select: {
            starts: true,
          },
        },
      },
      orderBy: {
        start_time: "asc",
      },
      ...(maxResults ? { take: Math.max(maxResults * 3, maxResults) } : {}),
    });

    const evaluations = await Promise.all(
      initialCandidates.map(async (travel) => {
        try {
          const routeWaypoints = this.parseStoredRouteWaypoints(
            travel.route_waypoints
          );

          const evaluationConfig: PassengerAssignmentConfig = {
            averageSpeedKmh,
            maxAdditionalMinutes,
            ...(maxDeviationMeters !== undefined
              ? { maxDeviationMeters }
              : {}),
            ...(routeWaypoints ? { routeWaypoints } : {}),
          };

          const evaluation = await this.evaluatePassengerAssignment(
            travel.id,
            passenger,
            evaluationConfig
          );

          if (!evaluation.success || !evaluation.summary || !evaluation.candidate) {
            return null;
          }

          const rating =
            travel.reviews.length > 0
              ? travel.reviews.reduce((sum, review) => sum + review.starts, 0) /
                travel.reviews.length
              : null;

          const match: TravelMatchResult = {
            travelId: travel.id,
            price: travel.price,
            startTime: travel.start_time,
            spacesAvailable: travel.spaces_available,
            driver: {
              id: travel.driver_id.id,
              name: travel.driver_id.name,
              profile_picture: travel.driver_id.profile_picture,
              institutional_email: travel.driver_id.institutional_email,
              phone_number: travel.driver_id.phone_number,
              rating,
            },
            vehicle: travel.vehicle
              ? {
                  id: travel.vehicle.id,
                  brand: travel.vehicle.brand,
                  model: travel.vehicle.model,
                  year: travel.vehicle.year,
                  licence_plate: travel.vehicle.licence_plate,
                }
              : null,
            summary: evaluation.summary,
            candidate: evaluation.candidate,
            baseMetrics: evaluation.baseMetrics,
            originalRoute: evaluation.originalRoute,
            updatedRoute: evaluation.updatedRoute,
          };

          return match;
        } catch (error) {
          console.error(
            `Error evaluating passenger assignment for travel ${travel.id}:`,
            error
          );
          return null;
        }
      })
    );

    const validMatches = evaluations.filter(
      (item): item is TravelMatchResult => item !== null
    );

    validMatches.sort((a, b) => {
      if (a.summary.additionalMinutes !== b.summary.additionalMinutes) {
        return a.summary.additionalMinutes - b.summary.additionalMinutes;
      }
      if (a.summary.additionalDistanceKm !== b.summary.additionalDistanceKm) {
        return a.summary.additionalDistanceKm - b.summary.additionalDistanceKm;
      }
      return a.price - b.price;
    });

    const limitedMatches = validMatches.slice(0, maxResults);

    return {
      success: true,
      matches: limitedMatches,
      count: limitedMatches.length,
      totalCandidates: validMatches.length,
      appliedConfig: {
        averageSpeedKmh,
        maxAdditionalMinutes,
        maxDeviationMeters: maxDeviationMeters ?? null,
        timeWindowMinutes,
        maxResults,
        pickupDateTime: pickupDateTime ? pickupDateTime.toISOString() : null,
      },
    };
  }
}
