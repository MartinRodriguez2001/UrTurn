import travelApiService from "@/Services/TravelApiService";
import { ProcessedTravel, TravelPlannedStop } from "@/types/travel";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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

  const requestFromParams = useMemo(
    () => parseJSONParam<RequestDetails>(params.request),
    [params.request]
  );

  const request = requestFromParams ?? DEFAULT_REQUEST;

  const passengerName = request.passenger?.name ?? "Pasajero";
  const passengerInitials = getInitials(passengerName);
  const pickupLocation = request.pickupLocation ?? "Origen por definir";
  const destination = request.destination ?? "Destino por definir";
  const departureTime = formatTime(request.startTime);
  const phoneNumber = request.passenger?.phoneNumber ?? "Sin teléfono";
  const confirmedPassengers = request.confirmedPassengers ?? [];

  const details = [
    { id: "origin", title: pickupLocation, subtitle: "Origen", icon: "map-pin" as const },
    { id: "destination", title: destination, subtitle: "Destino", icon: "map-pin" as const },
    { id: "time", title: departureTime, subtitle: "Hora de salida", icon: "clock" as const },
  ];

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>⟵</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Solicitudes de viaje</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Passenger Info Section */}
        <View style={styles.passengerSection}>
          <View style={styles.passengerImageContainer}>
            <View style={styles.passengerImagePlaceholder}>
              <Text style={styles.passengerInitial}>{passengerInitials}</Text>
            </View>
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>{passengerName}</Text>
            <Text style={styles.passengerRole}>{phoneNumber}</Text>
          </View>
          <View style={styles.contactButtonContainer}>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contactar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {details.map((detail) => (
          <View style={styles.infoSection} key={detail.id}>
            <View style={styles.iconContainer}>
              <Feather name={detail.icon} size={20} color="#121417" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{detail.title}</Text>
              <Text style={styles.infoSubtitle}>{detail.subtitle}</Text>
            </View>
          </View>
        ))}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.rejectButton}>
            <Text style={styles.rejectButtonText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, accepting && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={accepting}
          >
            {accepting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 59,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 11,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#121417",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#121417",
  },
  placeholder: {
    width: 48,
    height: 48,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  passengerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  passengerImageContainer: {
    width: 56,
    height: 56,
  },
  passengerImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerInitial: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#121417",
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 24,
    color: "#121417",
    marginBottom: 2,
  },
  passengerRole: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#61758A",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 72,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 24,
    color: "#121417",
    marginBottom: 2,
  },
  infoSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#61758A",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  rejectButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 21,
    color: "#121417",
  },
  acceptButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 21,
    color: "#FFFFFF",
  },
  contactButtonContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  contactButton: {
    width: 102,
    height: 41,
    borderRadius: 8,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
  },
  contactButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 21,
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: 20,
  },
});
