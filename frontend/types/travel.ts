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

