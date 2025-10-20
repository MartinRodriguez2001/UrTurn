export interface TravelAvailables {
  travels: Travel[];
  count: number;
  message: string;
}

export interface Travel {
  start_location: string;
  end_location: string;
  capacity: number;
  price: number;
  start_time: Date;
  end_time: Date;
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

export interface ProcessedTravel {
  id: number;
  start_location: string;
  end_location: string;
  capacity: number;
  price: number;
  start_time: Date;
  end_time: Date;
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
  start_location: string;
  end_location: string;
  capacity: number;
  price: number;
  start_time: Date;
  end_time: Date;
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
