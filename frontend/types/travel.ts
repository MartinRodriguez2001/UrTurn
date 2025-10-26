export interface TravelAvailables {
  travels: Travel[];
  count: number;
  message: string;
}

export interface Travel {
  start_location: string | null;
  start_location_name: string | null;
  start_latitude: number;
  start_longitude: number;
  end_location: string | null;
  end_location_name: string | null;
  end_latitude: number;
  end_longitude: number;
  route_waypoints?: TravelCoordinate[] | null;
  routeWaypoints?: TravelCoordinate[] | null;
  planned_stops?: TravelPlannedStop[] | null;
  capacity: number;
  price: number;
  travel_date: Date;
  start_time: Date;
  end_time?: Date;
  spaces_available: number;
  carId: number;
  status?: TravelStatus;
}

export enum TravelStatus {
  PENDIENTE = "pendiente",
  CONFIRMADO = "confirmado",
  CANCELADO = "cancelado",
  FINALIZADO = "finalizado",
}

export type TravelPassengerStatus = "pending" | "accepted" | "confirmed";

export interface TravelPassenger {
  id: number;
  name: string;
  institutional_email?: string | null;
  phone_number?: string | null;
  profile_picture?: string | null;
  description?: string | null;
  requestId?: number;
  requestedAt?: string;
  acceptedAt?: string;
  confirmedAt?: string;
  location?: string | null;
  start_location_name?: string | null;
  start_latitude?: number;
  start_longitude?: number;
  status: TravelPassengerStatus;
}

export interface TravelPassengersGroup {
  confirmed: TravelPassenger[];
  pending: TravelPassenger[];
  accepted: TravelPassenger[];
}

export interface TravelStats {
  totalRequests: number;
  confirmedPassengers: number;
  availableSpaces: number;
  averageRating: number | null;
  totalReviews: number;
}

export enum RequestStatus {
  PENDIENTE = "pendiente",
  ACEPTADA = "aceptada",
  RECHAZADA = "rechazada",
}

export interface ProcessedTravel {
  id: number;
  start_location: string | null;
  start_location_name: string | null;
  start_latitude: number;
  start_longitude: number;
  end_location: string | null;
  end_location_name: string | null;
  end_latitude: number;
  end_longitude: number;
  route_waypoints?: TravelCoordinate[] | null;
  routeWaypoints?: TravelCoordinate[] | null;
  planned_stops?: TravelPlannedStop[] | null;
  travel_date: Date;
  capacity: number;
  price: number;
  start_time: Date;
  end_time?: Date;
  spaces_available: number;
  status: TravelStatus;
  userId: number;
  carId: number;

  driver_id: {
    id: number;
    name: string;
    profile_picture: string | null;
    phone_number: string | null;
  };

  vehicle: {
    licence_plate: string;
    brand: string;
    model: string;
    year: number;
  };

  reviews: {
    starts: number;
  }[];

  driver_rating: number | null;

  passengers?: TravelPassengersGroup;
  stats?: TravelStats;
}

export interface TravelFilters {
  start_location?: string;
  end_location?: string;
  start_date?: Date;
  min_spaces?: number;
  max_price?: number;
}

export interface TravelCreateData {
  start_location_name: string;
  start_latitude: number;
  start_longitude: number;
  end_location_name: string;
  end_latitude: number;
  end_longitude: number;
  routeWaypoints?: TravelCoordinate[];
  travel_date: Date;
  capacity: number;
  price: number;
  start_time: Date;
  end_time?: Date;
  carId: number;
  spaces_available: number;
}

export interface TravelResponse {
  travel?: ProcessedTravel;
  affected_passengers?: Array<unknown>;
}

export interface TravelsResponse {
  travels: ProcessedTravel[];
  count: number;
  summary?: Summary;
}

export interface Summary {
  byStatus: ByStatus;
  total: number;
}

export interface ByStatus {
  cancelado: number;
  confirmado: number;
  finalizado: number;
  pendiente: number;
}

export interface TravelRequestCreatePayload {
  startLocationName?: string;
  startLatitude: number;
  startLongitude: number;
  endLocationName?: string;
  endLatitude: number;
  endLongitude: number;
  pickupDate?: string;
  pickupTime?: string;
}

export interface TravelRequestRecord {
  id: number;
  travelId: number | null;
  start_location_name: string | null;
  start_latitude: number;
  start_longitude: number;
  end_location_name: string | null;
  end_latitude: number;
  end_longitude: number;
  pickup_date: string | null;
  pickup_time: string | null;
  status: RequestStatus;
  passengerId: number;
  created_at: string;
}

export interface TravelCoordinate {
  latitude: number;
  longitude: number;
}

export type TravelStopType = "start" | "pickup" | "dropoff" | "end";

export interface TravelPlannedStop {
  type: TravelStopType;
  latitude: number;
  longitude: number;
  locationName?: string | null;
  passengerId?: number;
  requestId?: number;
}

export interface RouteMetricsSummary {
  totalDistanceKm: number;
  totalDurationMinutes: number;
}

export interface TravelMatchSummary {
  pickupInsertIndex: number;
  dropoffInsertIndex: number;
  additionalMinutes: number;
  additionalDistanceKm: number;
  newTotalMinutes: number;
  newTotalDistanceKm: number;
  timeIncreasePercent: number;
  distanceIncreasePercent: number;
}

export interface TravelMatchResult {
  travelId: number;
  price: number;
  startTime: string;
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
  summary: TravelMatchSummary;
  baseMetrics: RouteMetricsSummary;
  originalRoute: TravelCoordinate[];
  updatedRoute?: TravelCoordinate[];
}

export interface TravelMatchAppliedConfig {
  averageSpeedKmh: number;
  maxAdditionalMinutes: number;
  maxDeviationMeters: number | null;
  timeWindowMinutes: number;
  maxResults: number;
  pickupDateTime: string | null;
}

export interface TravelMatchResponse {
  matches: TravelMatchResult[];
  count: number;
  totalCandidates: number;
  appliedConfig: TravelMatchAppliedConfig;
}

export interface TravelMatchRequestPayload {
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  pickupDate?: string;
  pickupTime?: string;
  averageSpeedKmh?: number;
  maxAdditionalMinutes?: number;
  maxDeviationMeters?: number;
  timeWindowMinutes?: number;
  maxResults?: number;
}
