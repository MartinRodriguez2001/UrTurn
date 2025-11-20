import { Prisma, TravelStatus } from "../../generated/prisma/index.js";
import type { AssignmentCandidate, Coordinate, RouteMetrics } from "../utils/route-assignment.js";
import { summarizeAssignmentCandidate } from "../utils/route-assignment.js";
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
        profile_picture: Uint8Array | string | null;
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
export declare class TravelService {
    registerTravel(travelData: TravelData, driverId: number): Promise<{
        success: boolean;
        travel: {
            start_location: string | null;
            end_location: string | null;
            vehicle: {
                year: number;
                id: number;
                licence_plate: string;
                model: string;
                brand: string;
            };
            driver_id: {
                id: number;
                institutional_email: string;
                name: string;
                phone_number: string;
            };
            id: number;
            userId: number;
            status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            route_waypoints: Prisma.JsonValue | null;
            planned_stops: Prisma.JsonValue | null;
            capacity: number;
            price: number;
            travel_date: Date;
            start_time: Date;
            end_time: Date | null;
            spaces_available: number;
            carId: number;
        };
        message: string;
    }>;
    private validateTravelData;
    private validateNoOverlappingTravels;
    private mapTravelForResponse;
    private sanitizeRouteWaypoints;
    private parseStoredRouteWaypoints;
    private buildInitialStopsForTravel;
    private parseStoredStops;
    private ensureDriverEndpoints;
    private serializePlannedStops;
    private buildRouteFromStops;
    private resolveMapsApiKey;
    private calculateRouteWaypointsFromStops;
    private tryGoogleDirections;
    private tryOsrmDirections;
    private createPassengerStopEntries;
    private applyPassengerInsertionToStops;
    private fallbackAddPassengerStops;
    getDriverTravels(driverId: number): Promise<{
        success: boolean;
        travels: {
            id: number;
            start_location: string | null;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location: string | null;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            route_waypoints: Coordinate[];
            routeWaypoints: Coordinate[];
            planned_stops: {
                requestId?: number | undefined;
                passengerId?: number | undefined;
                type: TravelStopType;
                latitude: number;
                longitude: number;
                locationName: string | null;
            }[];
            travel_date: Date;
            capacity: number;
            price: number;
            start_time: Date;
            end_time: Date | null;
            spaces_available: number;
            status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
            driver: {
                id: number;
                institutional_email: string;
                name: string;
                phone_number: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
                description: string | null;
            };
            vehicle: {
                year: number;
                id: number;
                licence_plate: string;
                model: string;
                brand: string;
            };
            passengers: {
                confirmed: {
                    confirmedAt: Date;
                    status: string;
                    id: number;
                    institutional_email: string;
                    name: string;
                    phone_number: string;
                    profile_picture: Uint8Array<ArrayBufferLike> | null;
                }[];
                pending: {
                    requestId: number;
                    requestedAt: Date;
                    location: string | null;
                    start_location_name: string | null;
                    start_latitude: number;
                    start_longitude: number;
                    end_location_name: string | null;
                    end_latitude: number;
                    end_longitude: number;
                    status: string;
                    id: number;
                    institutional_email: string;
                    name: string;
                    phone_number: string;
                    profile_picture: Uint8Array<ArrayBufferLike> | null;
                }[];
                accepted: {
                    requestId: number;
                    acceptedAt: Date;
                    location: string | null;
                    start_location_name: string | null;
                    start_latitude: number;
                    start_longitude: number;
                    end_location_name: string | null;
                    end_latitude: number;
                    end_longitude: number;
                    status: string;
                    id: number;
                    institutional_email: string;
                    name: string;
                    phone_number: string;
                    profile_picture: Uint8Array<ArrayBufferLike> | null;
                }[];
            };
            stats: {
                totalRequests: number;
                confirmedPassengers: number;
                availableSpaces: number;
                averageRating: number | null;
                totalReviews: number;
            };
            reviews: ({
                reviewer: {
                    id: number;
                    name: string;
                    profile_picture: Uint8Array<ArrayBufferLike> | null;
                };
                user_target: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                date: Date;
                review: string;
                reviewer_id: number;
                user_target_id: number;
                travel_id: number;
                starts: number;
            })[];
            reports: ({
                usuario: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                description: string;
                travelId: number;
                usuarioId: number;
                date: Date;
            })[];
        }[];
        count: number;
        summary: {
            total: number;
            byStatus: {
                pendiente: number;
                confirmado: number;
                finalizado: number;
                cancelado: number;
            };
        };
        message: string;
    }>;
    getAvaibleTravels(filters?: {
        start_location?: string;
        end_location?: string;
        start_date?: Date;
        min_spaces?: number;
        max_price: number;
    }): Promise<{
        success: boolean;
        travels: {
            driver_rating: number | null;
            vehicle: {
                year: number;
                licence_plate: string;
                model: string;
                brand: string;
            };
            reviews: {
                user_target_id: number;
                starts: number;
            }[];
            driver_id: {
                id: number;
                name: string;
                phone_number: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
            id: number;
            userId: number;
            status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            route_waypoints: Prisma.JsonValue | null;
            planned_stops: Prisma.JsonValue | null;
            capacity: number;
            price: number;
            travel_date: Date;
            start_time: Date;
            end_time: Date | null;
            spaces_available: number;
            carId: number;
            start_location: string | null;
            end_location: string | null;
        }[];
        count: number;
        message: string;
    }>;
    requestToJoinTravel(travelId: number, passengerId: number, pickupLocation: string, pickupLatitude: number, pickupLongitude: number, dropoffLocation: string, dropoffLatitude: number, dropoffLongitude: number, pickupDate?: Date, pickupTime?: Date): Promise<{
        success: boolean;
        request: {
            location: string | null;
            travel: {
                id: number;
                start_location_name: string | null;
                start_latitude: number;
                start_longitude: number;
                end_location_name: string | null;
                end_latitude: number;
                end_longitude: number;
                start_time: Date;
            } | null;
            passenger: {
                id: number;
                institutional_email: string;
                name: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
            id: number;
            created_at: Date;
            travelId: number | null;
            status: import("../../generated/prisma/index.js").$Enums.RequestStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            pickup_date: Date | null;
            pickup_time: Date | null;
            passengerId: number;
        };
        message: string;
    }>;
    createOpenTravelRequest(passengerId: number, data: OpenTravelRequestData): Promise<{
        success: boolean;
        request: {
            id: number;
            created_at: Date;
            travelId: number | null;
            status: import("../../generated/prisma/index.js").$Enums.RequestStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            pickup_date: Date | null;
            pickup_time: Date | null;
            passengerId: number;
        };
        message: string;
    }>;
    respondToTravelRequest(requestId: number, driverId: number, accept: boolean): Promise<{
        message: string;
        insertionSummary?: {
            pickupInsertIndex: number;
            dropoffInsertIndex: number;
            additionalMinutes: number;
            additionalDistanceKm: number;
            newTotalMinutes: number;
            newTotalDistanceKm: number;
            timeIncreasePercent: number;
            distanceIncreasePercent: number;
        } | undefined;
        plannedStops?: TravelStop[] | undefined;
        updatedRoute?: Coordinate[] | undefined;
        success: boolean;
        request: {
            passenger: {
                id: number;
                institutional_email: string;
                name: string;
            };
        } & {
            id: number;
            created_at: Date;
            travelId: number | null;
            status: import("../../generated/prisma/index.js").$Enums.RequestStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            pickup_date: Date | null;
            pickup_time: Date | null;
            passengerId: number;
        };
    }>;
    cancelTravel(travelId: number, userId: number, reason?: string): Promise<{
        success: boolean;
        travel: {
            id: number;
            userId: number;
            status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            route_waypoints: Prisma.JsonValue | null;
            planned_stops: Prisma.JsonValue | null;
            capacity: number;
            price: number;
            travel_date: Date;
            start_time: Date;
            end_time: Date | null;
            spaces_available: number;
            carId: number;
        };
        affected_passengers: ({
            usuario: {
                id: number;
                institutional_email: string;
                name: string;
            };
        } & {
            id: number;
            travelId: number;
            usuarioId: number;
            date: Date;
        })[];
        message: string;
    }>;
    completeTravel(travelId: number, driverId: number): Promise<{
        success: boolean;
        travel: {
            id: number;
            userId: number;
            status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            route_waypoints: Prisma.JsonValue | null;
            planned_stops: Prisma.JsonValue | null;
            capacity: number;
            price: number;
            travel_date: Date;
            start_time: Date;
            end_time: Date | null;
            spaces_available: number;
            carId: number;
        };
        message: string;
    }>;
    startTravel(travelId: number, driverId: number): Promise<{
        success: boolean;
        travel: {
            id: number;
            userId: number;
            status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            route_waypoints: Prisma.JsonValue | null;
            planned_stops: Prisma.JsonValue | null;
            capacity: number;
            price: number;
            travel_date: Date;
            start_time: Date;
            end_time: Date | null;
            spaces_available: number;
            carId: number;
        };
        message: string;
    }>;
    getTravelRequests(travelId: number, driverId: number): Promise<{
        success: boolean;
        requests: ({
            passenger: {
                id: number;
                institutional_email: string;
                name: string;
                phone_number: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
        } & {
            id: number;
            created_at: Date;
            travelId: number | null;
            status: import("../../generated/prisma/index.js").$Enums.RequestStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            pickup_date: Date | null;
            pickup_time: Date | null;
            passengerId: number;
        })[];
        count: number;
        message: string;
    }>;
    getTravelById(travelId: number): Promise<{
        success: boolean;
        travel: {
            passengers: {
                confirmed: {
                    id: any;
                    name: any;
                    profile_picture: any;
                    phone_number: any;
                }[];
            };
            confirmations: ({
                usuario: {
                    id: number;
                    name: string;
                    phone_number: string;
                    profile_picture: Uint8Array<ArrayBufferLike> | null;
                };
            } & {
                id: number;
                travelId: number;
                usuarioId: number;
                date: Date;
            })[];
            vehicle: {
                year: number;
                id: number;
                licence_plate: string;
                model: string;
                brand: string;
                validation: boolean;
                userId: number;
            };
            driver_id: {
                id: number;
                name: string;
                phone_number: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
            id: number;
            userId: number;
            status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            route_waypoints: Prisma.JsonValue | null;
            planned_stops: Prisma.JsonValue | null;
            capacity: number;
            price: number;
            travel_date: Date;
            start_time: Date;
            end_time: Date | null;
            spaces_available: number;
            carId: number;
        };
        message: string;
    }>;
    getPassengerTravels(passengerId: number): Promise<{
        success: boolean;
        data: {
            requested: {
                travel: ({
                    vehicle: {
                        licence_plate: string;
                        model: string;
                        brand: string;
                    };
                    driver_id: {
                        id: number;
                        name: string;
                        phone_number: string;
                        profile_picture: Uint8Array<ArrayBufferLike> | null;
                    };
                } & {
                    id: number;
                    userId: number;
                    status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
                    start_location_name: string | null;
                    start_latitude: number;
                    start_longitude: number;
                    end_location_name: string | null;
                    end_latitude: number;
                    end_longitude: number;
                    route_waypoints: Prisma.JsonValue | null;
                    planned_stops: Prisma.JsonValue | null;
                    capacity: number;
                    price: number;
                    travel_date: Date;
                    start_time: Date;
                    end_time: Date | null;
                    spaces_available: number;
                    carId: number;
                } & {
                    start_location: string | null;
                    end_location: string | null;
                }) | null;
                id: number;
                created_at: Date;
                travelId: number | null;
                status: import("../../generated/prisma/index.js").$Enums.RequestStatus;
                start_location_name: string | null;
                start_latitude: number;
                start_longitude: number;
                end_location_name: string | null;
                end_latitude: number;
                end_longitude: number;
                pickup_date: Date | null;
                pickup_time: Date | null;
                passengerId: number;
            }[];
            confirmed: {
                travel: ({
                    vehicle: {
                        licence_plate: string;
                        model: string;
                        brand: string;
                    };
                    driver_id: {
                        id: number;
                        name: string;
                        phone_number: string;
                        profile_picture: Uint8Array<ArrayBufferLike> | null;
                    };
                } & {
                    id: number;
                    userId: number;
                    status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
                    start_location_name: string | null;
                    start_latitude: number;
                    start_longitude: number;
                    end_location_name: string | null;
                    end_latitude: number;
                    end_longitude: number;
                    route_waypoints: Prisma.JsonValue | null;
                    planned_stops: Prisma.JsonValue | null;
                    capacity: number;
                    price: number;
                    travel_date: Date;
                    start_time: Date;
                    end_time: Date | null;
                    spaces_available: number;
                    carId: number;
                } & {
                    start_location: string | null;
                    end_location: string | null;
                }) | null;
                id: number;
                travelId: number;
                usuarioId: number;
                date: Date;
            }[];
        };
        message: string;
    }>;
    removePassenger(travelId: number, passengerId: number, driverId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    searchTravelsByLocation(query: string): Promise<{
        success: boolean;
        travels: ({
            vehicle: {
                licence_plate: string;
                model: string;
                brand: string;
            };
            driver_id: {
                id: number;
                name: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
        } & {
            id: number;
            userId: number;
            status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            route_waypoints: Prisma.JsonValue | null;
            planned_stops: Prisma.JsonValue | null;
            capacity: number;
            price: number;
            travel_date: Date;
            start_time: Date;
            end_time: Date | null;
            spaces_available: number;
            carId: number;
        })[];
        count: number;
        message: string;
    }>;
    cancelTravelRequest(requestId: number, passengerId: number): Promise<{
        success: boolean;
        request: {
            travel: ({
                id: number;
                start_location_name: string | null;
                start_latitude: number;
                start_longitude: number;
                end_location_name: string | null;
                end_latitude: number;
                end_longitude: number;
                start_time: Date;
            } & {
                start_location: string | null;
                end_location: string | null;
            }) | null;
            id: number;
            created_at: Date;
            travelId: number | null;
            status: import("../../generated/prisma/index.js").$Enums.RequestStatus;
            start_location_name: string | null;
            start_latitude: number;
            start_longitude: number;
            end_location_name: string | null;
            end_latitude: number;
            end_longitude: number;
            pickup_date: Date | null;
            pickup_time: Date | null;
            passengerId: number;
        };
        message: string;
    }>;
    leaveTravel(travelId: number, passengerId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    evaluatePassengerAssignment(travelId: number, passenger: PassengerAssignmentInput, config?: PassengerAssignmentConfig): Promise<{
        success: boolean;
        summary?: AssignmentSummary;
        candidate?: AssignmentCandidate;
        baseMetrics: RouteMetrics;
        originalRoute: Coordinate[];
        updatedRoute?: Coordinate[];
        message?: string;
    }>;
    findMatchingTravelsForPassenger(passengerId: number | null, passenger: PassengerAssignmentInput, options?: PassengerMatchingOptions): Promise<{
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
    }>;
}
export {};
//# sourceMappingURL=travel.service.d.ts.map