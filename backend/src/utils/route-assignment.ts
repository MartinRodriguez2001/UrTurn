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
  maxDeviationMeters: number;
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

const EARTH_RADIUS_KM = 6371;

const DEG_TO_RAD = Math.PI / 180;

function toRadians(value: number) {
  return value * DEG_TO_RAD;
}

function haversineDistanceKm(a: Coordinate, b: Coordinate): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = toRadians(b.longitude - a.longitude);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLon = Math.sin(deltaLon / 2);

  const c =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(c)));
}

export function estimateRouteMetrics(
  waypoints: Coordinate[],
  averageSpeedKmh: number
): RouteMetrics {
  if (waypoints.length < 2) {
    return {
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
    };
  }

  let totalDistanceKm = 0;

  for (let index = 0; index < waypoints.length - 1; index++) {
    const current = waypoints[index];
    const next = waypoints[index + 1];
    if (!current || !next) {
      continue;
    }
    totalDistanceKm += haversineDistanceKm(current, next);
  }

  const speed = Math.max(averageSpeedKmh, 1);
  const totalDurationMinutes = (totalDistanceKm / speed) * 60;

  return {
    totalDistanceKm,
    totalDurationMinutes,
  };
}

function insertWaypoint(
  waypoints: Coordinate[],
  index: number,
  waypoint: Coordinate
): Coordinate[] {
  return [
    ...waypoints.slice(0, index),
    waypoint,
    ...waypoints.slice(index),
  ];
}

function projectToMeters(
  point: Coordinate,
  referenceLatitude: number
): { x: number; y: number } {
  const latRad = toRadians(referenceLatitude);
  const metersPerDegreeLat = 111132;
  const metersPerDegreeLon = 111320 * Math.cos(latRad);

  return {
    x: point.longitude * metersPerDegreeLon,
    y: point.latitude * metersPerDegreeLat,
  };
}

function pointToSegmentDistanceMeters(
  point: Coordinate,
  segmentStart: Coordinate,
  segmentEnd: Coordinate
): number {
  // Avoid division by zero for identical points.
  if (
    segmentStart.latitude === segmentEnd.latitude &&
    segmentStart.longitude === segmentEnd.longitude
  ) {
    return haversineDistanceKm(point, segmentStart) * 1000;
  }

  const referenceLatitude =
    (segmentStart.latitude + segmentEnd.latitude) / 2;

  const pointMeters = projectToMeters(point, referenceLatitude);
  const startMeters = projectToMeters(segmentStart, referenceLatitude);
  const endMeters = projectToMeters(segmentEnd, referenceLatitude);

  const segmentVector = {
    x: endMeters.x - startMeters.x,
    y: endMeters.y - startMeters.y,
  };
  const pointVector = {
    x: pointMeters.x - startMeters.x,
    y: pointMeters.y - startMeters.y,
  };

  const segmentLengthSquared =
    segmentVector.x * segmentVector.x +
    segmentVector.y * segmentVector.y;

  const projectionFactor =
    segmentLengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            (pointVector.x * segmentVector.x +
              pointVector.y * segmentVector.y) /
              segmentLengthSquared
          )
        );

  const closestPoint = {
    x: startMeters.x + projectionFactor * segmentVector.x,
    y: startMeters.y + projectionFactor * segmentVector.y,
  };

  const distanceX = pointMeters.x - closestPoint.x;
  const distanceY = pointMeters.y - closestPoint.y;

  return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}

function minimalDistanceToRouteMeters(
  route: Coordinate[],
  point: Coordinate
): number {
  if (route.length < 2) {
    return Infinity;
  }

  let minDistance = Infinity;

  for (let index = 0; index < route.length - 1; index++) {
    const start = route[index];
    const end = route[index + 1];
    if (!start || !end) {
      continue;
    }
    const distance = pointToSegmentDistanceMeters(
      point,
      start,
      end
    );
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

export function evaluatePassengerInsertion(
  routeWaypoints: Coordinate[],
  passengerStops: PassengerStops,
  options: RouteEvaluationOptions
): AssignmentCandidate | null {
  if (routeWaypoints.length < 2) {
    throw new Error(
      "Se requieren al menos dos puntos para evaluar la ruta del conductor."
    );
  }

  const averageSpeedKmh = options.averageSpeedKmh ?? 30;
  const baseMetrics = estimateRouteMetrics(
    routeWaypoints,
    averageSpeedKmh
  );

  const pickupDeviation = minimalDistanceToRouteMeters(
    routeWaypoints,
    passengerStops.pickup
  );
  if (pickupDeviation > options.maxDeviationMeters) {
    return null;
  }

  const dropoffDeviation = minimalDistanceToRouteMeters(
    routeWaypoints,
    passengerStops.dropoff
  );
  if (dropoffDeviation > options.maxDeviationMeters) {
    return null;
  }

  let bestCandidate: AssignmentCandidate | null = null;

  for (
    let pickupIndex = 0;
    pickupIndex < routeWaypoints.length - 1;
    pickupIndex++
  ) {
    const withPickup = insertWaypoint(
      routeWaypoints,
      pickupIndex + 1,
      passengerStops.pickup
    );

    for (
      let dropIndex = pickupIndex + 1;
      dropIndex < withPickup.length - 1;
      dropIndex++
    ) {
      const updatedRoute = insertWaypoint(
        withPickup,
        dropIndex + 1,
        passengerStops.dropoff
      );

      const updatedMetrics = estimateRouteMetrics(
        updatedRoute,
        averageSpeedKmh
      );

      const additionalMinutes =
        updatedMetrics.totalDurationMinutes -
        baseMetrics.totalDurationMinutes;
      if (additionalMinutes > options.maxAdditionalMinutes) {
        continue;
      }

      const additionalDistanceKm =
        updatedMetrics.totalDistanceKm - baseMetrics.totalDistanceKm;

      const candidate: AssignmentCandidate = {
        pickupInsertIndex: pickupIndex + 1,
        dropoffInsertIndex: dropIndex + 1,
        additionalMinutes,
        additionalDistanceKm,
        updatedRoute,
        updatedMetrics,
        baseMetrics,
      };

      if (!bestCandidate) {
        bestCandidate = candidate;
        continue;
      }

      if (
        additionalMinutes < bestCandidate.additionalMinutes ||
        (Math.abs(
          additionalMinutes - bestCandidate.additionalMinutes
        ) < 1e-3 &&
          additionalDistanceKm < bestCandidate.additionalDistanceKm)
      ) {
        bestCandidate = candidate;
      }
    }
  }

  return bestCandidate;
}

export function summarizeAssignmentCandidate(
  candidate: AssignmentCandidate
) {
  return {
    pickupInsertIndex: candidate.pickupInsertIndex,
    dropoffInsertIndex: candidate.dropoffInsertIndex,
    additionalMinutes: candidate.additionalMinutes,
    additionalDistanceKm: candidate.additionalDistanceKm,
    newTotalMinutes: candidate.updatedMetrics.totalDurationMinutes,
    newTotalDistanceKm: candidate.updatedMetrics.totalDistanceKm,
    timeIncreasePercent:
      candidate.baseMetrics.totalDurationMinutes === 0
        ? 0
        : (candidate.additionalMinutes /
            candidate.baseMetrics.totalDurationMinutes) *
          100,
    distanceIncreasePercent:
      candidate.baseMetrics.totalDistanceKm === 0
        ? 0
        : (candidate.additionalDistanceKm /
            candidate.baseMetrics.totalDistanceKm) *
          100,
  };
}
