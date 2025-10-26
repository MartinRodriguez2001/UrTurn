import type { TravelCoordinate } from "@/types/travel";
import { resolveGoogleMapsApiKey } from "@/utils/googleMaps";
import { decodePolyline } from "@/utils/polyline";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
};

const DEFAULT_REGION = {
  latitude: -33.4273,
  longitude: -70.55,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
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

export default function DriverTravel() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    travel?: string;
    passengers?: string;
  }>();
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

    if (startCoordinate && endCoordinate) {
      return [startCoordinate, endCoordinate];
    }

    return DEFAULT_ROUTE;
  }, [endCoordinate, startCoordinate, travel.routeWaypoints, travel.route_waypoints]);

  const [polylineCoordinates, setPolylineCoordinates] =
    useState<TravelCoordinate[]>(routeCoordinates);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

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

  const detailRows = [
    {
      icon: "map-pin" as const,
      label: "Origen",
      value: travel.start_location_name ?? "Por confirmar",
    },
    {
      icon: "navigation" as const,
      label: "Destino",
      value: travel.end_location_name ?? "Por confirmar",
    },
    {
      icon: "clock" as const,
      label: "Hora de inicio",
      value: formatTime(travel.start_time),
    },
    {
      icon: "dollar-sign" as const,
      label: "Precio",
      value: formatPrice(travel.price),
    },
  ];

  const renderRouteMap = (interactive: boolean) => (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      region={mapRegion}
      initialRegion={mapRegion}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={interactive}
      pitchEnabled={interactive}
      pointerEvents={interactive ? "auto" : "none"}
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
    </MapView>
  );

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
        <TouchableOpacity
          activeOpacity={0.95}
          style={styles.mapCard}
          onPress={() => setIsMapExpanded(true)}
        >
          {renderRouteMap(false)}
          <View style={styles.expandHint}>
            <Feather name="maximize" size={16} color="#FFFFFF" />
            <Text style={styles.expandHintText}>Ver mapa completo</Text>
          </View>
        </TouchableOpacity>

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
          <Text style={styles.sectionTitle}>Pasajeros confirmados</Text>
          {passengers.map((passenger) => (
            <View key={passenger.id} style={styles.passengerRow}>
              {passenger.avatar ? (
                <Image source={{ uri: passenger.avatar }} style={styles.passengerAvatar} />
              ) : (
                <View style={styles.passengerFallbackAvatar}>
                  <Text style={styles.passengerInitials}>{getInitials(passenger.name)}</Text>
                </View>
              )}
              <View style={styles.passengerInfo}>
                <Text style={styles.passengerName}>{passenger.name}</Text>
                <Text style={styles.passengerRole}>{passenger.role ?? "Pasajero"}</Text>
              </View>
              <TouchableOpacity style={styles.contactButton} activeOpacity={0.85}>
                <Text style={styles.contactButtonText}>Contactar</Text>
              </TouchableOpacity>
            </View>
          ))}
          {!passengers.length ? (
            <Text style={styles.emptyStateText}>
              Aún no se confirman pasajeros para este viaje.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={isMapExpanded}
        animationType="fade"
        transparent
        onRequestClose={() => setIsMapExpanded(false)}
      >
        <View style={styles.fullscreenMapContainer}>
          <View style={styles.fullscreenMapWrapper}>
            {renderRouteMap(true)}
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

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={() => router.push("/Driver/DriverOnTravel")}
        >
          <Text style={styles.primaryButtonText}>Empezar viaje</Text>
        </TouchableOpacity>
      </View>
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
  contactButton: {
    backgroundColor: "#FFECE3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contactButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    color: "#F97316",
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
