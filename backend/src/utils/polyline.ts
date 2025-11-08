export interface PolylinePoint {
  latitude: number;
  longitude: number;
}

export function decodePolyline(encoded: string | null | undefined): PolylinePoint[] {
  if (!encoded || encoded.length === 0) {
    return [];
  }

  const points: PolylinePoint[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLatitude = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    latitude += deltaLatitude;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLongitude = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    longitude += deltaLongitude;

    points.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return points;
}
