export interface Coordinate {
    latitude: number;
    longitude: number;
}
export interface PassengerStops {
    pickup: Coordinate;
    dropoff: Coordinate;
}
export interface RouteEvaluationOptions {
    /**
     * Average speed assumed for the route in km/h.
     * Defaults to 30 km/h when not provided.
     */
    averageSpeedKmh?: number;
    /**
     * Maximum extra minutes allowed after inserting the passenger.
     */
    maxAdditionalMinutes: number;
    /**
     * Maximum lateral deviation from the original route permitted, in meters.
     */
    maxDeviationMeters?: number;
}
export interface RouteMetrics {
    totalDistanceKm: number;
    totalDurationMinutes: number;
}
export interface AssignmentCandidate {
    pickupInsertIndex: number;
    dropoffInsertIndex: number;
    additionalMinutes: number;
    additionalDistanceKm: number;
    updatedRoute: Coordinate[];
    updatedMetrics: RouteMetrics;
    baseMetrics: RouteMetrics;
}
export interface RouteBoundingBox {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
}
export declare function estimateRouteMetrics(waypoints: Coordinate[], averageSpeedKmh: number): RouteMetrics;
export declare function computeRouteBoundingBox(route: Coordinate[]): RouteBoundingBox | null;
export declare function expandBoundingBox(boundingBox: RouteBoundingBox, meters: number): RouteBoundingBox;
export declare function isCoordinateWithinBoundingBox(coordinate: Coordinate, boundingBox: RouteBoundingBox): boolean;
export declare function simplifyRouteWaypoints(routeWaypoints: Coordinate[], toleranceMeters: number, minimumPoints?: number): Coordinate[];
export declare function evaluatePassengerInsertion(routeWaypoints: Coordinate[], passengerStops: PassengerStops, options: RouteEvaluationOptions): AssignmentCandidate | null;
export declare function summarizeAssignmentCandidate(candidate: AssignmentCandidate): {
    pickupInsertIndex: number;
    dropoffInsertIndex: number;
    additionalMinutes: number;
    additionalDistanceKm: number;
    newTotalMinutes: number;
    newTotalDistanceKm: number;
    timeIncreasePercent: number;
    distanceIncreasePercent: number;
};
//# sourceMappingURL=route-assignment.d.ts.map