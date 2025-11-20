const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
function toRadians(value) {
    return value * DEG_TO_RAD;
}
function haversineDistanceKm(a, b) {
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);
    const deltaLat = lat2 - lat1;
    const deltaLon = toRadians(b.longitude - a.longitude);
    const sinLat = Math.sin(deltaLat / 2);
    const sinLon = Math.sin(deltaLon / 2);
    const c = sinLat * sinLat +
        Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(c)));
}
export function estimateRouteMetrics(waypoints, averageSpeedKmh) {
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
function insertWaypoint(waypoints, index, waypoint) {
    return [
        ...waypoints.slice(0, index),
        waypoint,
        ...waypoints.slice(index),
    ];
}
function projectToMeters(point, referenceLatitude) {
    const latRad = toRadians(referenceLatitude);
    const metersPerDegreeLat = 111132;
    const metersPerDegreeLon = 111320 * Math.cos(latRad);
    return {
        x: point.longitude * metersPerDegreeLon,
        y: point.latitude * metersPerDegreeLat,
    };
}
function pointToSegmentDistanceMeters(point, segmentStart, segmentEnd) {
    // Avoid division by zero for identical points.
    if (segmentStart.latitude === segmentEnd.latitude &&
        segmentStart.longitude === segmentEnd.longitude) {
        return haversineDistanceKm(point, segmentStart) * 1000;
    }
    const referenceLatitude = (segmentStart.latitude + segmentEnd.latitude) / 2;
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
    const segmentLengthSquared = segmentVector.x * segmentVector.x +
        segmentVector.y * segmentVector.y;
    const projectionFactor = segmentLengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, (pointVector.x * segmentVector.x +
            pointVector.y * segmentVector.y) /
            segmentLengthSquared));
    const closestPoint = {
        x: startMeters.x + projectionFactor * segmentVector.x,
        y: startMeters.y + projectionFactor * segmentVector.y,
    };
    const distanceX = pointMeters.x - closestPoint.x;
    const distanceY = pointMeters.y - closestPoint.y;
    return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}
function metersToLatitudeDegrees(meters) {
    return meters / 111_132;
}
function metersToLongitudeDegrees(meters, referenceLatitude) {
    const latRad = toRadians(referenceLatitude);
    const metersPerDegreeLon = 111_320 * Math.cos(latRad);
    if (metersPerDegreeLon === 0) {
        return 0;
    }
    return meters / metersPerDegreeLon;
}
export function computeRouteBoundingBox(route) {
    if (!route.length) {
        return null;
    }
    let minLatitude = route[0].latitude;
    let maxLatitude = route[0].latitude;
    let minLongitude = route[0].longitude;
    let maxLongitude = route[0].longitude;
    for (const waypoint of route) {
        if (!waypoint) {
            continue;
        }
        if (waypoint.latitude < minLatitude) {
            minLatitude = waypoint.latitude;
        }
        if (waypoint.latitude > maxLatitude) {
            maxLatitude = waypoint.latitude;
        }
        if (waypoint.longitude < minLongitude) {
            minLongitude = waypoint.longitude;
        }
        if (waypoint.longitude > maxLongitude) {
            maxLongitude = waypoint.longitude;
        }
    }
    return {
        minLatitude,
        maxLatitude,
        minLongitude,
        maxLongitude,
    };
}
export function expandBoundingBox(boundingBox, meters) {
    if (meters <= 0) {
        return boundingBox;
    }
    const averageLatitude = (boundingBox.minLatitude + boundingBox.maxLatitude) / 2;
    const latDelta = metersToLatitudeDegrees(meters);
    const lonDelta = metersToLongitudeDegrees(meters, averageLatitude);
    return {
        minLatitude: boundingBox.minLatitude - latDelta,
        maxLatitude: boundingBox.maxLatitude + latDelta,
        minLongitude: boundingBox.minLongitude - lonDelta,
        maxLongitude: boundingBox.maxLongitude + lonDelta,
    };
}
export function isCoordinateWithinBoundingBox(coordinate, boundingBox) {
    return (coordinate.latitude >= boundingBox.minLatitude &&
        coordinate.latitude <= boundingBox.maxLatitude &&
        coordinate.longitude >= boundingBox.minLongitude &&
        coordinate.longitude <= boundingBox.maxLongitude);
}
function minimalDistanceToRouteMeters(route, point) {
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
        const distance = pointToSegmentDistanceMeters(point, start, end);
        if (distance < minDistance) {
            minDistance = distance;
        }
    }
    return minDistance;
}
function removeConsecutiveDuplicates(route) {
    if (route.length === 0) {
        return [];
    }
    const deduped = [route[0]];
    for (let index = 1; index < route.length; index++) {
        const current = route[index];
        const last = deduped[deduped.length - 1];
        if (current &&
            last &&
            (Math.abs(current.latitude - last.latitude) > 1e-6 ||
                Math.abs(current.longitude - last.longitude) > 1e-6)) {
            deduped.push(current);
        }
    }
    return deduped;
}
function douglasPeucker(route, epsilonMeters) {
    if (route.length <= 2) {
        return route;
    }
    let maxDistance = 0;
    let maxIndex = 0;
    const start = route[0];
    const end = route[route.length - 1];
    for (let index = 1; index < route.length - 1; index++) {
        const point = route[index];
        if (!point) {
            continue;
        }
        const distance = pointToSegmentDistanceMeters(point, start, end);
        if (distance > maxDistance) {
            maxDistance = distance;
            maxIndex = index;
        }
    }
    if (maxDistance <= epsilonMeters) {
        return [start, end];
    }
    const left = douglasPeucker(route.slice(0, maxIndex + 1), epsilonMeters);
    const right = douglasPeucker(route.slice(maxIndex), epsilonMeters);
    return [...left.slice(0, -1), ...right];
}
export function simplifyRouteWaypoints(routeWaypoints, toleranceMeters, minimumPoints = 2) {
    if (routeWaypoints.length <= minimumPoints) {
        return routeWaypoints.slice();
    }
    const epsilon = Math.max(toleranceMeters, 0);
    if (epsilon === 0) {
        return removeConsecutiveDuplicates(routeWaypoints);
    }
    const deduped = removeConsecutiveDuplicates(routeWaypoints);
    if (deduped.length <= minimumPoints) {
        return deduped;
    }
    const simplified = douglasPeucker(deduped, epsilon);
    if (simplified.length < minimumPoints) {
        return deduped.slice(0, minimumPoints);
    }
    return simplified;
}
export function evaluatePassengerInsertion(routeWaypoints, passengerStops, options) {
    if (routeWaypoints.length < 2) {
        throw new Error("Se requieren al menos dos puntos para evaluar la ruta del conductor.");
    }
    const averageSpeedKmh = options.averageSpeedKmh ?? 30;
    const baseMetrics = estimateRouteMetrics(routeWaypoints, averageSpeedKmh);
    const maxDeviationMeters = typeof options.maxDeviationMeters === "number" &&
        Number.isFinite(options.maxDeviationMeters)
        ? options.maxDeviationMeters
        : undefined;
    if (maxDeviationMeters !== undefined) {
        const pickupDeviation = minimalDistanceToRouteMeters(routeWaypoints, passengerStops.pickup);
        if (pickupDeviation > maxDeviationMeters) {
            return null;
        }
        const dropoffDeviation = minimalDistanceToRouteMeters(routeWaypoints, passengerStops.dropoff);
        if (dropoffDeviation > maxDeviationMeters) {
            return null;
        }
    }
    let bestCandidate = null;
    let bestAdditionalMinutes = Number.POSITIVE_INFINITY;
    outerLoop: for (let pickupIndex = 0; pickupIndex < routeWaypoints.length - 1; pickupIndex++) {
        const withPickup = insertWaypoint(routeWaypoints, pickupIndex + 1, passengerStops.pickup);
        for (let dropIndex = pickupIndex + 1; dropIndex < withPickup.length - 1; dropIndex++) {
            const updatedRoute = insertWaypoint(withPickup, dropIndex + 1, passengerStops.dropoff);
            const updatedMetrics = estimateRouteMetrics(updatedRoute, averageSpeedKmh);
            const additionalMinutes = updatedMetrics.totalDurationMinutes -
                baseMetrics.totalDurationMinutes;
            if (additionalMinutes > options.maxAdditionalMinutes) {
                continue;
            }
            if (additionalMinutes > bestAdditionalMinutes + 1e-3) {
                continue;
            }
            const additionalDistanceKm = updatedMetrics.totalDistanceKm - baseMetrics.totalDistanceKm;
            const candidate = {
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
                bestAdditionalMinutes = candidate.additionalMinutes;
                continue;
            }
            if (additionalMinutes < bestCandidate.additionalMinutes ||
                (Math.abs(additionalMinutes - bestCandidate.additionalMinutes) < 1e-3 &&
                    additionalDistanceKm < bestCandidate.additionalDistanceKm)) {
                bestCandidate = candidate;
                bestAdditionalMinutes = candidate.additionalMinutes;
                if (bestAdditionalMinutes <= 1e-3) {
                    break outerLoop;
                }
            }
        }
    }
    return bestCandidate;
}
export function summarizeAssignmentCandidate(candidate) {
    return {
        pickupInsertIndex: candidate.pickupInsertIndex,
        dropoffInsertIndex: candidate.dropoffInsertIndex,
        additionalMinutes: candidate.additionalMinutes,
        additionalDistanceKm: candidate.additionalDistanceKm,
        newTotalMinutes: candidate.updatedMetrics.totalDurationMinutes,
        newTotalDistanceKm: candidate.updatedMetrics.totalDistanceKm,
        timeIncreasePercent: candidate.baseMetrics.totalDurationMinutes === 0
            ? 0
            : (candidate.additionalMinutes /
                candidate.baseMetrics.totalDurationMinutes) *
                100,
        distanceIncreasePercent: candidate.baseMetrics.totalDistanceKm === 0
            ? 0
            : (candidate.additionalDistanceKm /
                candidate.baseMetrics.totalDistanceKm) *
                100,
    };
}
//# sourceMappingURL=route-assignment.js.map