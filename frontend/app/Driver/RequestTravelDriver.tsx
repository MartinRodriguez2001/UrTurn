import travelApiService from "@/Services/TravelApiService";
import { ProcessedTravel, TravelPlannedStop } from "@/types/travel";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from "react-native-maps";

type PassengerDetails = {
  id: number | string;
  name: string;
  phoneNumber?: string | null;
  profilePicture?: string | null;
};

type TravelPayload = {
  id?: number;
  start_location_name?: string | null;
  start_latitude?: number | string | null;
  start_longitude?: number | string | null;
  end_location_name?: string | null;
  end_latitude?: number | string | null;
  end_longitude?: number | string | null;
  travel_date?: string | Date | null;
  start_time?: string | Date;
  price?: number | string | null;
  route_waypoints?: Array<{ latitude: number; longitude: number }> | null;
  routeWaypoints?: Array<{ latitude: number; longitude: number }> | null;
  planned_stops?: TravelPlannedStop[] | null;
};

type PassengerParam = {
  id: number | string;
  name: string;
  role?: string;
  avatar?: string | null;
  phone?: string | null;
};

type RequestDetails = {
  requestId?: number | string | null;
  pickupLocation: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  destination: string;
  dropoffLocation?: string;
  dropoffLatitude?: number | null;
  dropoffLongitude?: number | null;
  startTime?: string | Date | null;
  travelId?: number;
  passenger: PassengerDetails;
  travel?: TravelPayload;
  confirmedPassengers?: PassengerParam[];
};

const DEFAULT_TRAVEL_PAYLOAD: TravelPayload = {
  id: 0,
  start_location_name: "Residencia Universitaria",
  start_latitude: -33.4053,
  start_longitude: -70.5111,
  end_location_name: "Facultad de Ingeniería",
  end_latitude: -33.45,
  end_longitude: -70.6,
  start_time: new Date().toISOString(),
  route_waypoints: null,
  routeWaypoints: null,
  planned_stops: null,
};

const DEFAULT_REQUEST: RequestDetails = {
  requestId: null,
  pickupLocation: "Residencia Universitaria",
  destination: "Facultad de Ingeniería",
  dropoffLocation: "Facultad de Ingeniería",
  dropoffLatitude: -33.45,
  dropoffLongitude: -70.6,
  startTime: new Date().toISOString(),
  passenger: {
    id: "default",
    name: "Pasajero",
    phoneNumber: null,
  },
  travel: DEFAULT_TRAVEL_PAYLOAD,
  confirmedPassengers: [],
};

const parseJSONParam = <T,>(raw?: string | string[]) => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Unable to parse request param", error);
    return null;
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatTime = (value?: string | Date | null) => {
  if (!value) return "--:--";
  const date =
    typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "Fecha por definir";
  const date =
    typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "Fecha por definir";
  }
  return date.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const toDate = (value?: string | number | Date | null) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const toNumber = (value?: number | string | null): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeRouteWaypoints = (payload: TravelPayload | undefined) => {
  if (!payload) return [];
  const raw = payload.route_waypoints ?? payload.routeWaypoints ?? [];
  const normalized = Array.isArray(raw)
    ? raw
        .map((point) => {
          const latitude = toNumber(point.latitude);
          const longitude = toNumber(point.longitude);
          if (latitude === null || longitude === null) return null;
          return { latitude, longitude };
        })
        .filter(Boolean) as Array<{ latitude: number; longitude: number }>
    : [];

  if (normalized.length >= 2) {
    return normalized;
  }

  const startLat = toNumber(payload.start_latitude);
  const startLng = toNumber(payload.start_longitude);
  const endLat = toNumber(payload.end_latitude);
  const endLng = toNumber(payload.end_longitude);

  const fallback: Array<{ latitude: number; longitude: number }> = [];
  if (startLat !== null && startLng !== null) {
    fallback.push({ latitude: startLat, longitude: startLng });
  }
  if (endLat !== null && endLng !== null) {
    fallback.push({ latitude: endLat, longitude: endLng });
  }
  return fallback;
};

const MIN_REGION_DELTA = 0.01;

const DEFAULT_REGION: Region = {
  latitude: -33.4489,
  longitude: -70.6693,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const createRegionFromPoints = (
  points: Array<{ latitude: number; longitude: number }>
): Region | null => {
  if (!points.length) {
    return null;
  }

  let minLatitude = points[0]!.latitude;
  let maxLatitude = points[0]!.latitude;
  let minLongitude = points[0]!.longitude;
  let maxLongitude = points[0]!.longitude;

  for (const point of points) {
    if (point.latitude < minLatitude) minLatitude = point.latitude;
    if (point.latitude > maxLatitude) maxLatitude = point.latitude;
    if (point.longitude < minLongitude) minLongitude = point.longitude;
    if (point.longitude > maxLongitude) maxLongitude = point.longitude;
  }

  const latitudeDelta = Math.max((maxLatitude - minLatitude) * 1.5, MIN_REGION_DELTA);
  const longitudeDelta = Math.max((maxLongitude - minLongitude) * 1.5, MIN_REGION_DELTA);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta,
    longitudeDelta,
  };
};

const addPickupStopToTravel = (
  payload: TravelPayload | undefined,
  pickupLatitude?: number | null,
  pickupLongitude?: number | null
) => {
  if (!payload) return undefined;
  if (pickupLatitude === undefined || pickupLatitude === null) return payload;
  if (pickupLongitude === undefined || pickupLongitude === null) return payload;

  const pickupPoint = { latitude: pickupLatitude, longitude: pickupLongitude };
  const baseRoute = normalizeRouteWaypoints(payload);

  let updatedRoute: Array<{ latitude: number; longitude: number }> = [];

  if (baseRoute.length >= 2) {
    updatedRoute = [
      ...baseRoute.slice(0, baseRoute.length - 1),
      pickupPoint,
      baseRoute[baseRoute.length - 1],
    ];
  } else if (baseRoute.length === 1) {
    updatedRoute = [baseRoute[0], pickupPoint];
  } else {
    updatedRoute = [pickupPoint];
  }

  return {
    ...payload,
    route_waypoints: updatedRoute,
    routeWaypoints: updatedRoute,
  };
};

const buildTravelPayloadFromProcessed = (
  travel: ProcessedTravel
): TravelPayload => {
  const waypoints = travel.route_waypoints ?? travel.routeWaypoints ?? null;
  return {
    id: travel.id,
    start_location_name: travel.start_location_name ?? travel.start_location,
    start_latitude: travel.start_latitude,
    start_longitude: travel.start_longitude,
    end_location_name: travel.end_location_name ?? travel.end_location,
    end_latitude: travel.end_latitude,
    end_longitude: travel.end_longitude,
    start_time: travel.start_time,
    price: travel.price,
    route_waypoints: waypoints ?? undefined,
    routeWaypoints: waypoints ?? undefined,
    planned_stops: travel.planned_stops ?? null,
  };
};

const mapConfirmedPassengersFromProcessed = (
  travel: ProcessedTravel
): PassengerParam[] => {
  const confirmed = travel.passengers?.confirmed ?? [];
  if (!confirmed.length) {
    return [];
  }
  return confirmed.map((passenger) => ({
    id: passenger.id,
    name: passenger.name,
    role: "Confirmado",
    avatar: passenger.profile_picture ?? null,
    phone: passenger.phone_number ?? null,
  }));
};

export default function RequestTravelDriver() {
  const router = useRouter();
  const params = useLocalSearchParams<{ request?: string }>();
  const [accepting, setAccepting] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const requestFromParams = useMemo(
    () => parseJSONParam<RequestDetails>(params.request),
    [params.request]
  );

  const request = requestFromParams ?? DEFAULT_REQUEST;

  const passengerName = request.passenger?.name ?? "Pasajero";
  const passengerInitials = getInitials(passengerName);
  const pickupLocation = request.pickupLocation ?? "Origen por definir";
  const dropoffLocationLabel =
    request.dropoffLocation ?? request.destination ?? "Destino por definir";
  const destination = dropoffLocationLabel;
  const travelDateValue = toDate(request.travel?.travel_date ?? null);
  const startDateTime =
    toDate(request.startTime) ??
    toDate(request.travel?.start_time) ??
    travelDateValue;
  const dateForDisplay = travelDateValue ?? startDateTime;
  const departureTime = formatTime(startDateTime ?? null);
  const departureDate = formatDate(dateForDisplay ?? null);
  const phoneNumber = request.passenger?.phoneNumber ?? "Sin teléfono";
  const confirmedPassengers = request.confirmedPassengers ?? [];

  const pickupLat = toNumber(request.pickupLatitude);
  const pickupLng = toNumber(request.pickupLongitude);
  const dropoffLat = toNumber(request.dropoffLatitude);
  const dropoffLng = toNumber(request.dropoffLongitude);

  const pickupCoordinate = useMemo(
    () =>
      pickupLat !== null && pickupLng !== null
        ? { latitude: pickupLat, longitude: pickupLng }
        : null,
    [pickupLat, pickupLng]
  );

  const dropoffCoordinate = useMemo(
    () =>
      dropoffLat !== null && dropoffLng !== null
        ? { latitude: dropoffLat, longitude: dropoffLng }
        : null,
    [dropoffLat, dropoffLng]
  );

  const travelRoute = useMemo(
    () => normalizeRouteWaypoints(request.travel) ?? [],
    [request.travel]
  );

  const passengerSegment = useMemo(
    () =>
      pickupCoordinate && dropoffCoordinate
        ? [pickupCoordinate, dropoffCoordinate]
        : [],
    [pickupCoordinate, dropoffCoordinate]
  );

  const travelPolyline = travelRoute.length >= 2 ? travelRoute : [];

  const mapRegion = useMemo(() => {
    const passengerPoints: Array<{ latitude: number; longitude: number }> = [];
    if (pickupCoordinate) {
      passengerPoints.push(pickupCoordinate);
    }
    if (dropoffCoordinate) {
      passengerPoints.push(dropoffCoordinate);
    }

    if (passengerPoints.length) {
      const region = createRegionFromPoints(passengerPoints);
      if (region) {
        return region;
      }
    }

    if (travelRoute.length) {
      const region = createRegionFromPoints(travelRoute);
      if (region) {
        return region;
      }
    }

    return DEFAULT_REGION;
  }, [pickupCoordinate, dropoffCoordinate, travelRoute]);

  const details = [
    { id: "origin", title: "Origen", subtitle: pickupLocation, icon: "map-pin" as const },
    { id: "destination", title: "Destino", subtitle: destination, icon: "navigation" as const },
    { id: "date", title: "Fecha", subtitle: departureDate, icon: "calendar" as const },
    { id: "time", title: "Hora de salida", subtitle: departureTime, icon: "clock" as const },
  ];

  const mapRegionKey = `${mapRegion.latitude}-${mapRegion.longitude}-${mapRegion.latitudeDelta}-${mapRegion.longitudeDelta}`;

  const renderRouteMap = (mode: "preview" | "fullscreen") => (
    <MapView
      key={`${mode}-${mapRegionKey}`}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={mapRegion}
      showsBuildings
      showsCompass={mode === "fullscreen"}
      toolbarEnabled={mode === "fullscreen"}
      scrollEnabled
      zoomEnabled
      rotateEnabled={mode === "fullscreen"}
      pitchEnabled={mode === "fullscreen"}
    >
      {travelPolyline.length >= 2 ? (
        <Polyline
          coordinates={travelPolyline}
          strokeWidth={3}
          strokeColor="#2563EB"
        />
      ) : null}
      {passengerSegment.length >= 2 ? (
        <Polyline
          coordinates={passengerSegment}
          strokeWidth={3}
          strokeColor="#F97316"
          lineDashPattern={[8, 6]}
        />
      ) : null}
      {pickupCoordinate ? (
        <Marker
          coordinate={pickupCoordinate}
          title="Punto de recogida"
          description={pickupLocation}
          pinColor="#2563EB"
        />
      ) : null}
      {dropoffCoordinate ? (
        <Marker
          coordinate={dropoffCoordinate}
          title="Destino del pasajero"
          description={dropoffLocationLabel}
          pinColor="#F97316"
        />
      ) : null}
    </MapView>
  );

  const handleAccept = async () => {
    if (accepting) {
      return;
    }

    try {
      setAccepting(true);

      if (request.requestId) {
        await travelApiService.respondToTravelRequest(Number(request.requestId), true);
      }

      let travelPayload = request.travel ?? DEFAULT_TRAVEL_PAYLOAD;
      let forcePickupInjection = true;
      const acceptedPassenger: PassengerParam = {
        id: request.passenger.id,
        name: passengerName,
        role: "Pendiente de recogida",
        avatar: request.passenger.profilePicture ?? null,
        phone: request.passenger.phoneNumber ?? undefined,
      };
      let passengersPayload: PassengerParam[] = [
        ...confirmedPassengers,
        acceptedPassenger,
      ];

      if (request.travel?.id) {
        const refreshedTravels = await travelApiService.getDriverTravels();
        if (refreshedTravels.success) {
          const updatedTravel = refreshedTravels.travels.find(
            (travel) => travel.id === request.travel?.id
          );
          if (updatedTravel) {
            travelPayload = buildTravelPayloadFromProcessed(updatedTravel);
            const serverPassengers = mapConfirmedPassengersFromProcessed(updatedTravel);
            const alreadyIncludesPassenger = serverPassengers.some(
              (passenger) => passenger.id === acceptedPassenger.id
            );
            passengersPayload = alreadyIncludesPassenger
              ? serverPassengers
              : [...serverPassengers, acceptedPassenger];
            forcePickupInjection = false;
          }
        }
      }

      if (forcePickupInjection) {
        travelPayload =
          addPickupStopToTravel(
            travelPayload,
            request.pickupLatitude,
            request.pickupLongitude
          ) ?? travelPayload;
      }

      router.push({
        pathname: "/Driver/DriverTravel",
        params: {
          travel: JSON.stringify(travelPayload),
          passengers: JSON.stringify(passengersPayload),
        },
      });
    } catch (error) {
      console.error("Error accepting travel request", error);
      Alert.alert(
        "Error",
        "No pudimos aceptar la solicitud. Inténtalo nuevamente en unos minutos."
      );
    } finally {
      setAccepting(false);
    }
  };

    return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color="#121417" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitud de viaje</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.passengerCard}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.passengerInitials}>{passengerInitials}</Text>
          </View>
          <View style={styles.passengerText}>
            <Text style={styles.passengerName}>{passengerName}</Text>
            <Text style={styles.passengerPhone}>{phoneNumber}</Text>
          </View>
          <TouchableOpacity style={styles.contactButton} activeOpacity={0.85}>
            <Feather name="phone" size={16} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contactar</Text>
          </TouchableOpacity>
        </View>

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
          {details.map((detail) => (
            <View key={detail.id} style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name={detail.icon} size={18} color="#121417" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{detail.title}</Text>
                <Text style={styles.detailValue}>{detail.subtitle}</Text>
                
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, accepting && styles.primaryButtonDisabled]}
          onPress={handleAccept}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Aceptar</Text>
          )}
        </TouchableOpacity>
      </View>

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
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#121417",
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 20,
  },
  passengerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  passengerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F4F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerInitials: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#121417",
  },
  passengerText: {
    flex: 1,
  },
  passengerName: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#121417",
  },
  passengerPhone: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    marginTop: 2,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F99F7C",
  },
  contactButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    color: "#FFFFFF",
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
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
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
    width: 44,
    height: 44,
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
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 15,
    color: "#121417",
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 15,
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});


