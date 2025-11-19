import { useAuth } from "@/context/authContext";
import type { TravelCoordinate, TravelPlannedStop } from "@/types/travel";
import { resolveGoogleMapsApiKey } from "@/utils/googleMaps";
import { decodePolyline } from "@/utils/polyline";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "@/components/common/MapView";

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
  price?: number | string | null;
  route_waypoints?: TravelCoordinate[] | null;
  routeWaypoints?: TravelCoordinate[] | null;
  planned_stops?: TravelPlannedStop[] | null;
};

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

const STOP_TYPES_TO_IGNORE: ReadonlyArray<TravelPlannedStop["type"]> = ["start", "end"];
const COORDINATE_EPSILON = 1e-5;

const isSameCoordinate = (reference: TravelCoordinate | null, candidate: TravelCoordinate) => {
  if (!reference) return false;
  return (
    Math.abs(reference.latitude - candidate.latitude) <= COORDINATE_EPSILON &&
    Math.abs(reference.longitude - candidate.longitude) <= COORDINATE_EPSILON
  );
};

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

const formatDate = (value?: string | Date) => {
  if (!value) return "Fecha pendiente";

  const date =
    typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("es-CL");
};

const formatTime = (value?: string | Date) => {
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

const formatDuration = (start?: string | Date, end?: string | Date) => {
  if (!start || !end) return "--";

  const s = typeof start === "string" || typeof start === "number" ? new Date(start) : start;
  const e = typeof end === "string" || typeof end === "number" ? new Date(end) : end;

  if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "--";

  const diffMs = e.getTime() - s.getTime();
  if (diffMs < 0) return "--";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatPrice = (value?: number | string | null) => {
  if (value === undefined || value === null) return "-- CLP";
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return `${value} CLP`;
  return `${numeric.toLocaleString("es-CL")} CLP`;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function Passenger_Historial_Travel() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    travel?: string;
    passengers?: string;
    driver?: string;
  }>();
  const { user } = useAuth();
  const googleMapsApiKey = useMemo(() => resolveGoogleMapsApiKey()?.trim(), []);

  const travelFromParams = useMemo(() => parseJSONParam<TravelParam>(params.travel), [params.travel]);

  const passengersFromParams = useMemo(() => parseJSONParam<Passenger[]>(params.passengers), [params.passengers]);

  const travel: TravelParam = travelFromParams ?? DEFAULT_TRAVEL;
  const passengers: Passenger[] = passengersFromParams ?? [];
  const driverFromParams = useMemo(() => parseJSONParam<any>(params.driver), [params.driver]);
  const driverFromTravel = (travel as any)?.driver_id ?? (travel as any)?.driver ?? null;
  const driver: any = driverFromParams ?? driverFromTravel ?? null;
  const travelId = useMemo(() => {
    const rawId = travel?.id;
    if (rawId === undefined || rawId === null) {
      return undefined;
    }
    const parsed = typeof rawId === "string" ? Number(rawId) : rawId;
    return Number.isFinite(parsed) ? Number(parsed) : undefined;
  }, [travel?.id]);

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

  const passengerStops = useMemo(() => {
    if (!Array.isArray(travel.planned_stops)) {
      return [] as { coordinate: TravelCoordinate; label: string | null }[];
    }

    return travel.planned_stops.reduce<{ coordinate: TravelCoordinate; label: string | null }[]>((accumulator, stop) => {
      const latitude = toNumber(stop.latitude);
      const longitude = toNumber(stop.longitude);
      if (latitude === null || longitude === null) {
        return accumulator;
      }

      const coordinate = { latitude, longitude };
      const stopType = stop.type;

      const shouldIgnoreType = typeof stopType === "string" && STOP_TYPES_TO_IGNORE.includes(stopType as TravelPlannedStop["type"]);

      if (shouldIgnoreType) {
        return accumulator;
      }

      if (isSameCoordinate(startCoordinate, coordinate) || isSameCoordinate(endCoordinate, coordinate)) {
        return accumulator;
      }

      let label: string | null = null;

      if (stop && typeof stop === "object") {
        const s = stop as unknown as Record<string, unknown>;
        const locationName = s["locationName"];
        if (typeof locationName === "string" && locationName.trim().length) {
          label = locationName;
        } else {
          const legacyLocationName = s["location_name"];
          if (typeof legacyLocationName === "string" && legacyLocationName.trim().length) {
            label = legacyLocationName;
          } else {
            const fallbackName = s["name"];
            if (typeof fallbackName === "string" && fallbackName.trim().length) {
              label = fallbackName;
            }
          }
        }
      }

      accumulator.push({ coordinate, label });
      return accumulator;
    }, []);
  }, [endCoordinate, startCoordinate, travel.planned_stops]);

  const stopCoordinates = useMemo<TravelCoordinate[]>(() => passengerStops.map((stop) => stop.coordinate), [passengerStops]);

  const routeCoordinates = useMemo<TravelCoordinate[]>(() => {
    const waypoints = travel.route_waypoints && travel.route_waypoints.length >= 2 ? travel.route_waypoints : travel.routeWaypoints;

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

  const [polylineCoordinates, setPolylineCoordinates] = useState<TravelCoordinate[]>(routeCoordinates);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);

  useEffect(() => {
    setPolylineCoordinates(routeCoordinates);
  }, [routeCoordinates]);

  useEffect(() => {
    let mounted = true;
    if (!travelId || !user) {
      setHasReviewed(null);
      return;
    }

    (async () => {
      try {
        const reviewApiService = (await import('@/Services/ReviewApiService')).default;
        const res = await reviewApiService.getTravelReviews(Number(travelId));
        const reviews = (res?.reviews ?? []) as Array<{ reviewer_id?: number }>;
        const found = reviews.some((r) => r.reviewer_id === (user as any)?.id);
        if (mounted) setHasReviewed(found);
      } catch (error) {
        if (mounted) setHasReviewed(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [travelId, user]);

  useEffect(() => {
    if (!googleMapsApiKey || !startCoordinate || !endCoordinate || routeCoordinates.length > 2) {
      return;
    }

    let cancelled = false;

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoordinate.latitude},${startCoordinate.longitude}&destination=${endCoordinate.latitude},${endCoordinate.longitude}&mode=driving&language=es&key=${googleMapsApiKey}`
        );

        if (!response.ok) {
          throw new Error(`Directions API error: ${response.status}`);
        }

        const data: {
          status?: string;
          routes?: Array<{ overview_polyline?: { points?: string } }>;
        } = await response.json();

        if (data.status !== "OK") {
          throw new Error(`Directions API status: ${data.status ?? "UNKNOWN"}`);
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
  }, [endCoordinate, googleMapsApiKey, routeCoordinates.length, startCoordinate]);

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

  const detailRows = [
    {
      icon: "map-pin" as const,
      label: "Origen",
      value: travel.start_location_name ?? "Por confirmar",
    },
    {
      icon: "flag" as const,
      label: "Destino",
      value: travel.end_location_name ?? "Por confirmar",
    },
    {
      icon: "calendar" as const,
      label: "Fecha",
      value: formatDate(travel.start_time),
    },
    {
      icon: "clock" as const,
      label: "Hora de inicio",
      value: formatTime(travel.start_time),
    },
    {
      icon: "clock" as const,
      label: "Hora de Termino",
      value: formatTime((travel as any)?.end_time ?? (travel as any)?.endTime),
    },
    {
      icon: "clock" as const,
      label: "Duración",
      value: formatDuration(travel.start_time, (travel as any)?.end_time ?? (travel as any)?.endTime),
    },
    {
      icon: "dollar-sign" as const,
      label: "Precio",
      value: formatPrice(travel.price),
    },
  ];

  const mapRegionKey = `${mapRegion.latitude}-${mapRegion.longitude}-${mapRegion.latitudeDelta}-${mapRegion.longitudeDelta}`;

  const renderRouteMap = (mode: "preview" | "fullscreen") => (
    <MapView
      key={`${mode}-${mapRegionKey}`}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={mapRegion}
      showsCompass={mode === "fullscreen"}
      toolbarEnabled={mode === "fullscreen"}
      scrollEnabled
      zoomEnabled
      rotateEnabled={mode === "fullscreen"}
      pitchEnabled={mode === "fullscreen"}
    >
      {polylineCoordinates.length >= 2 ? (
        <Polyline coordinates={polylineCoordinates} strokeColor="#4C6EF5" strokeWidth={4} />
      ) : null}

      {startCoordinate ? (
        <Marker coordinate={startCoordinate}>
          <View style={styles.marker}>
            <Feather name="play" size={14} color="#FFFFFF" />
          </View>
        </Marker>
      ) : null}

      {endCoordinate ? (
        <Marker coordinate={endCoordinate}>
          <View style={[styles.marker, styles.markerDestination]}>
            <Feather name="flag" size={14} color="#FFFFFF" />
          </View>
        </Marker>
      ) : null}

      {/* Passenger planned stops markers */}
      {passengerStops.map((stop, idx) => {
        const label = stop.label ?? `Parada pasajero ${idx + 1}`;
        return (
          <Marker
            key={`passenger-stop-${idx}`}
            coordinate={stop.coordinate}
            title={label}
          >
            <View style={styles.stopMarker}>
              <Text style={styles.stopMarkerText}>{String(idx + 1)}</Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );

  const handleOpenChat = () => {
    const paramsPayload: Record<string, string> = {
      travel: JSON.stringify(travel),
      passengers: JSON.stringify(passengers),
    };

    if (travelId !== undefined) {
      paramsPayload.travelId = String(travelId);
    }

    router.push({ pathname: "/Passenger/PassengerChat", params: paramsPayload });
  };

  const handleOpenChatWithDriver = () => {
    const paramsPayload: Record<string, string> = {
      travel: JSON.stringify(travel),
      passengers: JSON.stringify(driver ? [driver] : []),
    };

    if (travelId !== undefined) {
      paramsPayload.travelId = String(travelId);
    }

    router.push({ pathname: "/Passenger/PassengerChat", params: paramsPayload });
  };

  const handleCallPassenger = (phone?: string | null) => {
    if (!phone) {
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color="#121417" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Viaje</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mapCard}>
          {renderRouteMap("preview")}
          <TouchableOpacity
            style={styles.expandHint}
            onPress={() => setIsMapExpanded(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Feather name="maximize" size={16} color="#FFFFFF" />
            <Text style={styles.expandHintText}>Ver mapa completo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del viaje</Text>
          {detailRows.map((row) => (
            <View key={row.label} style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name={row.icon} size={18} color="#121417" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conductor</Text>
          {driver ? (
            <View key={driver.id ?? "driver"} style={styles.passengerRow}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/Passenger/PassengerDriverProfile",
                    params: {
                      driverId: String((driver as any)?.id ?? (driver as any)?.user_id ?? (driver as any)?.driver_id ?? ""),
                      name: (driver as any)?.name ?? "",
                    },
                  })
                }
                activeOpacity={0.85}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              >
                {driver.profile_picture ? (
                  <Image source={{ uri: driver.profile_picture }} style={styles.passengerAvatar} />
                ) : (
                  <View style={styles.passengerFallbackAvatar}>
                    <Text style={styles.passengerInitials}>{getInitials(driver.name ?? "-")}</Text>
                  </View>
                )}
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerName}>{driver.name ?? "Conductor"}</Text>
                  <Text style={styles.passengerRole}>{(driver as any)?.role ?? "Conductor"}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.contactActions}>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyStateText}>Información del conductor no disponible.</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer with rating button: only show if travelId exists and user has NOT reviewed this travel */}
      {travelId !== undefined && hasReviewed === false ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => {
              const paramsPayload: Record<string, string> = {};
              paramsPayload.travelId = String(travelId);
              router.push({ pathname: "/Passenger/Passenger_Travel_ended", params: paramsPayload });
            }}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Calificar conductor</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal
        visible={isMapExpanded}
        animationType="fade"
        transparent
        onRequestClose={() => setIsMapExpanded(false)}
      >
        <View style={styles.fullscreenMapContainer}>
          <View style={styles.fullscreenMapWrapper}>
            {renderRouteMap("fullscreen")}
            <TouchableOpacity
              style={styles.closeMapButton}
              onPress={() => setIsMapExpanded(false)}
              accessibilityRole="button"
            >
              <Feather name="x" size={22} color="#121417" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#121417",
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    padding: 16,
    paddingBottom: 140,
    gap: 20,
  },
  mapCard: {
    borderRadius: 16,
    overflow: "hidden",
    height: 220,
    backgroundColor: "#F4F5F7",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  expandHint: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(18, 20, 23, 0.6)",
  },
  expandHintText: {
    color: "#FFFFFF",
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#121417",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F4F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    color: "#121417",
  },
  detailValue: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    marginTop: 2,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  passengerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  passengerFallbackAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FDE3D6",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerInitials: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#F97316",
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#121417",
  },
  passengerRole: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    marginTop: 2,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFECE3",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  contactButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    color: "#F97316",
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    backgroundColor: "#FFFFFF",
  },
  callButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    color: "#1E40AF",
  },
  emptyStateText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  primaryButton: {
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
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4C6EF5",
    alignItems: "center",
    justifyContent: "center",
  },
  markerDestination: {
    backgroundColor: "#F97316",
  },
  stopMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  stopMarkerText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 14,
    color: "#FFFFFF",
  },
  fullscreenMapContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  fullscreenMapWrapper: {
    width: "100%",
    height: "85%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F4F5F7",
  },
  closeMapButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
