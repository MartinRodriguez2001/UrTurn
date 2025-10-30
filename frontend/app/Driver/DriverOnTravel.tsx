import type { TravelCoordinate, TravelPlannedStop } from "@/types/travel";
import { resolveGoogleMapsApiKey } from "@/utils/googleMaps";
import { decodePolyline } from "@/utils/polyline";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type MapViewProps,
} from "react-native-maps";

type Passenger = {
  id: string | number;
  name: string;
  role?: string;
  avatar?: string | null;
  phone?: string | null;
};

type TravelParam = {
  id?: number;
  start_location_name?: string | null;
  start_latitude?: number | string | null;
  start_longitude?: number | string | null;
  end_location_name?: string | null;
  end_latitude?: number | string | null;
  end_longitude?: number | string | null;
  start_time?: string | Date;
  end_time?: string | Date | null;
  price?: number | string | null;
  route_waypoints?: TravelCoordinate[] | null;
  routeWaypoints?: TravelCoordinate[] | null;
  planned_stops?: TravelPlannedStop[] | null;
};

type StopInfo = {
  key: string;
  coordinate: TravelCoordinate;
  label: string;
  subtitle?: string | null;
  type: TravelPlannedStop["type"] | "start" | "end";
  passengerId?: number;
};

type LatLngLike = { latitude: number; longitude: number };
const DEFAULT_ROUTE: TravelCoordinate[] = [
  { latitude: -33.4053, longitude: -70.5111 },
  { latitude: -33.4138, longitude: -70.533 },
  { latitude: -33.4209, longitude: -70.5527 },
  { latitude: -33.4312, longitude: -70.5873 },
];

const DEFAULT_TRAVEL: TravelParam = {
  id: 1,
  start_location_name: "Universidad de los Andes",
  start_latitude: -33.4053,
  start_longitude: -70.5111,
  end_location_name: "Francisco Bilbao 2567",
  end_latitude: -33.4312,
  end_longitude: -70.5873,
  start_time: new Date().toISOString(),
  price: 1000,
  route_waypoints: DEFAULT_ROUTE,
  planned_stops: null,
};

const DEFAULT_REGION = {
  latitude: -33.4273,
  longitude: -70.55,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

const COORDINATE_EPSILON = 1e-5;
const STOP_VISIT_DISTANCE_METERS = 60;

const parseJSONParam = <T,>(raw?: string | string[]) => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Unable to parse param", error);
    return null;
  }
};

const toNumber = (value?: string | number | null): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const isSameCoordinate = (reference: TravelCoordinate | null, candidate: TravelCoordinate) => {
  if (!reference) return false;
  return (
    Math.abs(reference.latitude - candidate.latitude) <= COORDINATE_EPSILON &&
    Math.abs(reference.longitude - candidate.longitude) <= COORDINATE_EPSILON
  );
};

const deg2rad = (value: number) => (value * Math.PI) / 180;

const getDistanceMeters = (origin: LatLngLike | null | undefined, destination: LatLngLike) => {
  if (!origin) return Number.POSITIVE_INFINITY;
  const R = 6371000;
  const dLat = deg2rad(destination.latitude - origin.latitude);
  const dLon = deg2rad(destination.longitude - origin.longitude);
  const lat1 = deg2rad(origin.latitude);
  const lat2 = deg2rad(destination.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const formatTime = (value?: string | Date | null) => {
  if (!value) return "--:--";

  const date =
    typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Devuelve el primer nombre (primer token) de un nombre completo.
// Si `full` es falsy devuelve null.
const getFirstName = (full?: string | null): string | null => {
  if (!full) return null;
  const trimmed = full.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/\s+/);
  return parts.length ? parts[0] : null;
};

const FOLLOW_CAMERA_ANIMATION_MS = 750;
export default function DriverOnTravel() {
  const router = useRouter();
  const params = useLocalSearchParams<{ travel?: string; passengers?: string }>();
  const googleMapsApiKey = useMemo(
    () => resolveGoogleMapsApiKey()?.trim(),
    []
  );

  const travelFromParams = useMemo(
    () => parseJSONParam<TravelParam>(params.travel),
    [params.travel]
  );

  const passengersFromParams = useMemo(
    () => parseJSONParam<Passenger[]>(params.passengers),
    [params.passengers]
  );

  const travel: TravelParam = travelFromParams ?? DEFAULT_TRAVEL;
  const passengers: Passenger[] = passengersFromParams ?? [];

  const passengerMap = useMemo(() => {
    const map = new Map<string, Passenger>();
    passengers.forEach((passenger) => {
      map.set(String(passenger.id), passenger);
    });
    return map;
  }, [passengers]);

  const startCoordinate = useMemo(() => {
    const latitude = toNumber(travel.start_latitude);
    const longitude = toNumber(travel.start_longitude);
    if (latitude === null || longitude === null) return null;
    return { latitude, longitude };
  }, [travel.start_latitude, travel.start_longitude]);

  const endCoordinate = useMemo(() => {
    const latitude = toNumber(travel.end_latitude);
    const longitude = toNumber(travel.end_longitude);
    if (latitude === null || longitude === null) return null;
    return { latitude, longitude };
  }, [travel.end_latitude, travel.end_longitude]);

  const stops = useMemo<StopInfo[]>(() => {
    const result: StopInfo[] = [];

    const pushStop = (stop: StopInfo) => {
      const alreadyExists = result.some(
        (existing) => existing.type === stop.type && isSameCoordinate(existing.coordinate, stop.coordinate)
      );
      if (!alreadyExists) {
        result.push(stop);
      }
    };

    if (startCoordinate) {
      pushStop({
        key: "start",
        coordinate: startCoordinate,
        label: "Inicio del viaje",
        subtitle: travel.start_location_name ?? null,
        type: "start",
      });
    }

    if (Array.isArray(travel.planned_stops)) {
      travel.planned_stops.forEach((plannedStop, index) => {
        const latitude = toNumber(plannedStop.latitude);
        const longitude = toNumber(plannedStop.longitude);
        if (latitude === null || longitude === null) {
          return;
        }

        const coordinate = { latitude, longitude };
        const passenger =
          plannedStop.passengerId !== undefined
            ? passengerMap.get(String(plannedStop.passengerId))
            : undefined;

        let label = "Parada del viaje";
        if (plannedStop.type === "pickup") {
          const displayName = passenger && passenger.name ? getFirstName(passenger.name) || passenger.name : null;
          label = displayName ? `Recoger a ${displayName}` : "Recoger pasajero";
        } else if (plannedStop.type === "dropoff") {
          const displayName = passenger && passenger.name ? getFirstName(passenger.name) || passenger.name : null;
          label = displayName ? `Dejar a ${displayName}` : "Dejar pasajero";
        } else if (plannedStop.type === "start") {
          label = "Punto de partida";
        } else if (plannedStop.type === "end") {
          label = "Fin del viaje";
        }

        const subtitle =
          plannedStop.locationName && plannedStop.locationName.trim().length
            ? plannedStop.locationName
            : passenger?.role ?? null;

        pushStop({
          key: "planned-" + index + "-" + latitude + "-" + longitude,
          coordinate,
          label,
          subtitle,
          type: plannedStop.type,
          passengerId:
            typeof plannedStop.passengerId === "number" ? plannedStop.passengerId : undefined,
        });
      });
    }

    if (endCoordinate) {
      pushStop({
        key: "end",
        coordinate: endCoordinate,
        label: "Destino final",
        subtitle: travel.end_location_name ?? null,
        type: "end",
      });
    }

    return result;
  }, [
    endCoordinate,
    passengerMap,
    startCoordinate,
    travel.end_location_name,
    travel.planned_stops,
    travel.start_location_name,
  ]);
  const stopCoordinates = useMemo<TravelCoordinate[]>(
    () => stops.map((stop) => stop.coordinate),
    [stops]
  );

  const routeCoordinates = useMemo<TravelCoordinate[]>(() => {
    const waypoints =
      travel.route_waypoints && travel.route_waypoints.length >= 2
        ? travel.route_waypoints
        : travel.routeWaypoints;

    if (Array.isArray(waypoints) && waypoints.length >= 2) {
      const normalized = waypoints
        .map((point) => {
          const latitude = toNumber(point.latitude);
          const longitude = toNumber(point.longitude);
          if (latitude === null || longitude === null) return null;
          return { latitude, longitude };
        })
        .filter(Boolean) as TravelCoordinate[];
      if (normalized.length >= 2) {
        return normalized;
      }
    }

    if (stopCoordinates.length >= 2) {
      return stopCoordinates;
    }

    if (startCoordinate && endCoordinate) {
      return [startCoordinate, endCoordinate];
    }

    return DEFAULT_ROUTE;
  }, [endCoordinate, startCoordinate, stopCoordinates, travel.routeWaypoints, travel.route_waypoints]);

  const [polylineCoordinates, setPolylineCoordinates] =
    useState<TravelCoordinate[]>(routeCoordinates);
  const [locationStatus, setLocationStatus] = useState<Location.PermissionStatus | "checking">(
    "checking"
  );
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [visitedStops, setVisitedStops] = useState<Record<string, true>>({});
  const [isBottomSheetCollapsed, setIsBottomSheetCollapsed] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const hasFitRouteRef = useRef(false);
  const lastCameraUpdateRef = useRef(0);
  useEffect(() => {
    setPolylineCoordinates(routeCoordinates);
  }, [routeCoordinates]);

  useEffect(() => {
    if (
      !googleMapsApiKey ||
      !startCoordinate ||
      !endCoordinate ||
      routeCoordinates.length > 2
    ) {
      return;
    }

    let cancelled = false;

    const fetchRoute = async () => {
      try {
        const url =
          "https://maps.googleapis.com/maps/api/directions/json?origin=" +
          startCoordinate.latitude +
          "," +
          startCoordinate.longitude +
          "&destination=" +
          endCoordinate.latitude +
          "," +
          endCoordinate.longitude +
          "&mode=driving&language=es&key=" +
          googleMapsApiKey;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Directions API error: " + response.status);
        }

        const data: {
          status?: string;
          routes?: Array<{ overview_polyline?: { points?: string } }>;
        } = await response.json();

        if (data.status !== "OK") {
          throw new Error("Directions API status: " + (data.status ?? "UNKNOWN"));
        }

        const encoded = data.routes?.[0]?.overview_polyline?.points;
        if (!encoded) {
          throw new Error("Directions API missing polyline");
        }

        const decoded = decodePolyline(encoded);
        if (!cancelled && decoded.length >= 2) {
          setPolylineCoordinates(decoded);
        }
      } catch (error) {
        console.warn("No se pudo obtener la ruta desde Google Maps", error);
      }
    };

    fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [
    endCoordinate,
    googleMapsApiKey,
    routeCoordinates.length,
    startCoordinate,
  ]);
  const mapRegion = useMemo(() => {
    if (!polylineCoordinates.length) {
      return DEFAULT_REGION;
    }

    const lats = polylineCoordinates.map((point) => point.latitude);
    const lngs = polylineCoordinates.map((point) => point.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latitudeDelta = Math.max((maxLat - minLat) * 1.6, 0.02);
    const longitudeDelta = Math.max((maxLng - minLng) * 1.6, 0.02);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta,
      longitudeDelta,
    };
  }, [polylineCoordinates]);
  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        let status = existingStatus;

        if (status !== Location.PermissionStatus.GRANTED) {
          const request = await Location.requestForegroundPermissionsAsync();
          status = request.status;
        }

        if (!isMounted) {
          return;
        }

        setLocationStatus(status);

        if (status !== Location.PermissionStatus.GRANTED) {
          setLocationError(
            "Habilita el acceso a tu ubicación para seguir el viaje en tiempo real."
          );
          return;
        }

        setLocationError(null);

        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown?.coords && isMounted) {
          setCurrentLocation(lastKnown.coords);
        }

        locationSubscriptionRef.current?.remove();

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 5,
            timeInterval: 2000,
          },
          (location) => {
            if (!isMounted) return;
            setCurrentLocation(location.coords);
          }
        );

        if (!isMounted) {
          subscription.remove();
          return;
        }

        locationSubscriptionRef.current = subscription;
      } catch (error) {
        console.warn("No se pudo iniciar el seguimiento de ubicación", error);
        if (isMounted) {
          setLocationError("Error al obtener la ubicación actual.");
        }
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (!mapRef.current || hasFitRouteRef.current) return;
    if (polylineCoordinates.length >= 2) {
      mapRef.current.fitToCoordinates(polylineCoordinates, {
        edgePadding: { top: 180, right: 60, bottom: 360, left: 60 },
        animated: true,
      });
      hasFitRouteRef.current = true;
    }
  }, [polylineCoordinates]);
  useEffect(() => {
    if (!currentLocation || !isFollowingUser || !mapRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastCameraUpdateRef.current < FOLLOW_CAMERA_ANIMATION_MS * 0.6) {
      return;
    }

    const heading =
      typeof currentLocation.heading === "number" && currentLocation.heading >= 0
        ? currentLocation.heading
        : 0;

    mapRef.current.animateCamera(
      {
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        pitch: 50,
        heading,
        zoom: 16,
      },
      { duration: FOLLOW_CAMERA_ANIMATION_MS }
    );

    lastCameraUpdateRef.current = now;
  }, [currentLocation, isFollowingUser]);
  useEffect(() => {
    if (!currentLocation || !stops.length) return;

    setVisitedStops((prev) => {
      let changed = false;
      const nextState = { ...prev };

      stops.forEach((stop) => {
        if (nextState[stop.key]) return;
        const distance = getDistanceMeters(currentLocation, stop.coordinate);
        if (distance <= STOP_VISIT_DISTANCE_METERS) {
          nextState[stop.key] = true;
          changed = true;
        }
      });

      return changed ? nextState : prev;
    });
  }, [currentLocation, stops]);
  const upcomingStops = useMemo(
    () => stops.filter((stop) => !visitedStops[stop.key]),
    [stops, visitedStops]
  );
  const nextStop = upcomingStops[0] ?? null;

  const nextStopDistanceText = useMemo(() => {
    if (!currentLocation || !nextStop) return null;
    const distance = getDistanceMeters(currentLocation, nextStop.coordinate);
    if (!Number.isFinite(distance)) return null;
    if (distance >= 1000) {
      return (distance / 1000).toFixed(1) + " km";
    }
    const meters = Math.max(1, Math.round(distance));
    return meters + " m";
  }, [currentLocation, nextStop]);

  const arrivalEstimate =
    travel.end_time && travel.end_time !== travel.start_time
      ? formatTime(travel.end_time)
      : formatTime(travel.start_time);

  const currentHeading =
    typeof currentLocation?.heading === "number" && currentLocation.heading >= 0
      ? currentLocation.heading
      : 0;
  const headingRotation = currentHeading + "deg";
  const nextStopSubtitleText = nextStop
    ? "Siguiente: " + nextStop.label
    : "Todas las paradas completadas";

  const handleBack = () => {
    router.back();
  };

  const handleEnableFollow = () => {
    setIsFollowingUser(true);
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          pitch: 50,
          heading: currentHeading,
          zoom: 16,
        },
        { duration: FOLLOW_CAMERA_ANIMATION_MS }
      );
    }
  };

  const handleManualMapInteraction: MapViewProps["onPanDrag"] = () => {
    setIsFollowingUser((prev) => (prev ? false : prev));
  };
  const toggleBottomSheet = () => {
    setIsBottomSheetCollapsed((prev) => !prev);
  };

  const expandBottomSheet = () => {
    setIsBottomSheetCollapsed(false);
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          showsCompass={false}
          showsBuildings
          showsTraffic={false}
          rotateEnabled
          pitchEnabled
          onPanDrag={handleManualMapInteraction}
          toolbarEnabled={false}
        >
          {polylineCoordinates.length >= 2 ? (
            <Polyline
              coordinates={polylineCoordinates}
              strokeColor="#2563EB"
              strokeWidth={5}
            />
          ) : null}

          {stops.map((stop) => {
            const isVisited = Boolean(visitedStops[stop.key]);
            const isNext = nextStop?.key === stop.key;
            const markerStyle = [
              styles.stopMarker,
              isNext && styles.stopMarkerNext,
              isVisited && styles.stopMarkerVisited,
            ];

            let icon: React.ComponentProps<typeof Feather>["name"] = "map-pin";
            if (stop.type === "start") {
              icon = "play";
            } else if (stop.type === "end") {
              icon = "flag";
            } else if (stop.type === "pickup") {
              icon = "user-plus";
            } else if (stop.type === "dropoff") {
              icon = "user-check";
            }

            return (
              <Marker
                key={stop.key}
                coordinate={stop.coordinate}
                title={stop.label}
                description={stop.subtitle ?? undefined}
              >
                <View style={markerStyle}>
                  <Feather
                    name={icon}
                    size={isNext ? 16 : 14}
                    color={isNext ? "#FFFFFF" : "#111827"}
                  />
                </View>
              </Marker>
            );
          })}

          {currentLocation ? (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.driverMarker}>
                <View
                  style={[
                    styles.driverHeadingPointer,
                    { transform: [{ rotate: headingRotation }] },
                  ]}
                >
                  <Feather name="navigation" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.driverMarkerCore} />
              </View>
            </Marker>
          ) : null}
        </MapView>
      </View>
      <View style={styles.topControls}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.circleButton}
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>

        <View style={styles.topInfo}>
          <Text style={styles.topTitle}>Viaje en curso</Text>
          <Text style={styles.topSubtitle}>{nextStopSubtitleText}</Text>
        </View>

        <TouchableOpacity
          onPress={handleEnableFollow}
          style={[
            styles.circleButton,
            isFollowingUser && styles.circleButtonActive,
          ]}
          accessibilityRole="button"
        >
          <Feather
            name="navigation"
            size={18}
            color={isFollowingUser ? "#FFFFFF" : "#111827"}
            style={{ transform: [{ rotate: headingRotation }] }}
          />
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.bottomSheet,
          isBottomSheetCollapsed && styles.bottomSheetCollapsed,
        ]}
      >
        <TouchableOpacity
          style={styles.bottomHandlePressable}
          onPress={toggleBottomSheet}
          accessibilityRole="button"
          accessibilityLabel={
            isBottomSheetCollapsed
              ? "Expandir detalles del viaje"
              : "Contraer detalles del viaje"
          }
        >
          <View style={styles.bottomHandle} />
          <Feather
            name={isBottomSheetCollapsed ? "chevron-up" : "chevron-down"}
            size={18}
            color="#475569"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={expandBottomSheet}
          style={[
            styles.nextStopCard,
            isBottomSheetCollapsed && styles.nextStopCardCollapsed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ver siguiente parada"
        >
          {isBottomSheetCollapsed ? (
            <View style={styles.nextStopCollapsedRow}>
              <Feather name="map-pin" size={16} color="#1E3A8A" />
              <Text style={styles.nextStopCollapsedLabel}>Siguiente parada</Text>
              <Feather name="chevron-up" size={18} color="#1E3A8A" />
            </View>
          ) : (
            <>
              <View>
                <Text style={styles.nextStopLabel}>Siguiente parada</Text>
                <Text style={styles.nextStopTitle}>
                  {nextStop ? nextStop.label : "Ruta completada"}
                </Text>
                {nextStop && nextStop.subtitle ? (
                  <Text style={styles.nextStopSubtitle}>{nextStop.subtitle}</Text>
                ) : null}
              </View>
              <View style={styles.nextStopMeta}>
                <Feather name="clock" size={18} color="#2563EB" />
                <Text style={styles.nextStopMetaText}>
                  {"Llegada estimada: " + arrivalEstimate}
                </Text>
                {nextStopDistanceText ? (
                  <Text style={styles.nextStopDistance}>
                    {"A " + nextStopDistanceText}
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </TouchableOpacity>

        {!isBottomSheetCollapsed ? (
          <>
            {locationStatus === "checking" ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.statusText}>Esperando señal de GPS…</Text>
              </View>
            ) : null}

            {locationError ? (
              <View style={styles.alertRow}>
                <Feather name="alert-triangle" size={18} color="#B91C1C" />
                <Text style={styles.alertText}>{locationError}</Text>
              </View>
            ) : null}

            <ScrollView
              style={styles.stopList}
              contentContainerStyle={styles.stopListContent}
              showsVerticalScrollIndicator={false}
            >
              {stops.map((stop, index) => {
                const isVisited = Boolean(visitedStops[stop.key]);
                const isNext = nextStop?.key === stop.key;

                const badgeStyle = [
                  styles.stopBadge,
                  isVisited && styles.stopBadgeVisited,
                  isNext && styles.stopBadgeActive,
                ];

                let badgeIcon: React.ComponentProps<typeof Feather>["name"] = "map-pin";
                if (stop.type === "start") {
                  badgeIcon = "play";
                } else if (stop.type === "end") {
                  badgeIcon = "flag";
                } else if (stop.type === "pickup") {
                  badgeIcon = "user-plus";
                } else if (stop.type === "dropoff") {
                  badgeIcon = "user-check";
                }

                return (
                  <View key={stop.key} style={styles.stopRow}>
                    <View style={styles.stopIndex}>
                      <Text style={styles.stopIndexText}>{index + 1}</Text>
                    </View>

                    <View style={badgeStyle}>
                      <Feather
                        name={badgeIcon}
                        size={14}
                        color={isNext ? "#FFFFFF" : isVisited ? "#065F46" : "#111827"}
                      />
                    </View>

                    <View style={styles.stopTextContainer}>
                      <Text
                        style={[
                          styles.stopLabel,
                          isVisited && styles.stopLabelVisited,
                          isNext && styles.stopLabelActive,
                        ]}
                      >
                        {stop.label}
                      </Text>
                      {stop.subtitle ? (
                        <Text style={styles.stopSubtitle}>{stop.subtitle}</Text>
                      ) : null}
                    </View>

                    {isVisited ? (
                      <Feather name="check-circle" size={18} color="#059669" />
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={() => {}}
              >
                <Feather name="alert-circle" size={18} color="#1E3A8A" />
                <Text style={styles.secondaryButtonText}>Reportar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.9}
                onPress={() => {}}
              >
                <Text style={styles.primaryButtonText}>Terminar viaje</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  topControls: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  circleButtonActive: {
    backgroundColor: "#2563EB",
  },
  topInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  topTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 17,
    color: "#FFFFFF",
  },
  topSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#E2E8F0",
    marginTop: 4,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    zIndex: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomSheetCollapsed: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
  },
  bottomHandlePressable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    paddingVertical: 6,
  },
  bottomHandle: {
    width: 60,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "#CBD5F5",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#1D4ED8",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  alertText: {
    flex: 1,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#B91C1C",
  },
  nextStopCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
  },
  nextStopLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  nextStopTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#0F172A",
    marginTop: 4,
  },
  nextStopSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#334155",
    marginTop: 4,
  },
  nextStopMeta: {
    alignItems: "flex-end",
    gap: 6,
  },
  nextStopMetaText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#1E3A8A",
  },
  nextStopDistance: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#0F172A",
  },
  nextStopCardCollapsed: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  nextStopCollapsedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nextStopCollapsedLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#1E3A8A",
  },
  stopList: {
    maxHeight: 240,
  },
  stopListContent: {
    paddingBottom: 6,
    gap: 12,
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stopIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stopIndexText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 13,
    color: "#1E293B",
  },
  stopBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  stopBadgeVisited: {
    backgroundColor: "#D1FAE5",
  },
  stopBadgeActive: {
    backgroundColor: "#2563EB",
  },
  stopTextContainer: {
    flex: 1,
  },
  stopLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 15,
    color: "#0F172A",
  },
  stopLabelVisited: {
    color: "#047857",
  },
  stopLabelActive: {
    color: "#1D4ED8",
  },
  stopSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E3A8A",
    backgroundColor: "#EFF6FF",
  },
  secondaryButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 15,
    color: "#1E3A8A",
  },
  primaryButton: {
    flex: 1.4,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
  driverMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  driverHeadingPointer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "0deg" }],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  driverMarkerCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    marginTop: -14,
    borderWidth: 2,
    borderColor: "#2563EB",
  },
  stopMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1D4ED8",
  },
  stopMarkerNext: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  stopMarkerVisited: {
    backgroundColor: "#D1FAE5",
    borderColor: "#047857",
  },
});
