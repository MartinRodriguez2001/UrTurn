import travelApiService from "@/Services/TravelApiService";
import type { TravelMatchAppliedConfig, TravelMatchResult } from "@/types/travel";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MAX_RESULTS = 10;

const formatCurrencyCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.valueOf())) {
    return "Horario por definir";
  }
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatMinutes = (minutes: number) =>
  `+${minutes.toFixed(minutes >= 10 ? 0 : 1)} min`;

const formatDistanceKm = (distance: number) =>
  `+${distance.toFixed(distance >= 10 ? 0 : 1)} km`;

const buildInitials = (name: string) => {
  if (!name.trim()) {
    return "?";
  }
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part.charAt(0));
  return initials.join("").toUpperCase();
};

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function PassengerRiderOffers() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const pickupDateParam = getParam(params.pickupDate);
  const pickupTimeParam = getParam(params.pickupTime);
  const pickupLocationParam = getParam(params.pickupLocation) ?? "";
  const requestIdParam = getParam(params.requestId) ?? "";
  const originLatParam = getParam(params.originLat);
  const originLngParam = getParam(params.originLng);
  const destinationLatParam = getParam(params.destinationLat);
  const destinationLngParam = getParam(params.destinationLng);
  const originNameParam = getParam(params.origin) ?? pickupLocationParam;
  const destinationNameParam = getParam(params.destination) ?? "";

  const pickupLatitude =
    originLatParam !== undefined && originLatParam !== null
      ? Number(originLatParam)
      : undefined;
  const pickupLongitude =
    originLngParam !== undefined && originLngParam !== null
      ? Number(originLngParam)
      : undefined;
  const dropoffLatitude =
    destinationLatParam !== undefined && destinationLatParam !== null
      ? Number(destinationLatParam)
      : undefined;
  const dropoffLongitude =
    destinationLngParam !== undefined && destinationLngParam !== null
      ? Number(destinationLngParam)
      : undefined;

  const [matches, setMatches] = useState<TravelMatchResult[]>([]);
  const [appliedConfig, setAppliedConfig] =
    useState<TravelMatchAppliedConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      if (
        pickupLatitude === undefined ||
        pickupLongitude === undefined ||
        dropoffLatitude === undefined ||
        dropoffLongitude === undefined ||
        !Number.isFinite(pickupLatitude) ||
        !Number.isFinite(pickupLongitude) ||
        !Number.isFinite(dropoffLatitude) ||
        !Number.isFinite(dropoffLongitude)
      ) {
        setError(
          "No fue posible leer las coordenadas de origen y destino para buscar conductores."
        );
        setMatches([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await travelApiService.matchTravelsForPassenger({
          pickupLatitude,
          pickupLongitude,
          dropoffLatitude,
          dropoffLongitude,
          ...(pickupDateParam ? { pickupDate: pickupDateParam } : {}),
          ...(pickupTimeParam ? { pickupTime: pickupTimeParam } : {}),
          maxResults: MAX_RESULTS,
        });

        if (!response.success) {
          throw new Error(
            response.message ??
              "No se pudieron obtener coincidencias de conductores."
          );
        }

        setMatches(response.matches);
        setAppliedConfig(response.appliedConfig);
      } catch (err) {
        console.error("matchTravelsForPassenger error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las coincidencias."
        );
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [
    pickupLatitude,
    pickupLongitude,
    dropoffLatitude,
    dropoffLongitude,
    pickupDateParam,
    pickupTimeParam,
  ]);

  const summaryLabel = useMemo(() => {
    if (isLoading) {
      return "Buscando coincidencias...";
    }
    if (error) {
      return "Ocurrio un problema al buscar coincidencias.";
    }
    if (matches.length === 0) {
      return "No encontramos conductores compatibles para tu ruta.";
    }
    if (matches.length === 1) {
      return "Encontramos 1 conductor compatible.";
    }
    return `Encontramos ${matches.length} conductores compatibles.`;
  }, [isLoading, error, matches.length]);

  const renderMatchCard = (match: TravelMatchResult) => {
    const vehicleLabel = match.vehicle
      ? `${match.vehicle.brand} ${match.vehicle.model}`
      : "Vehiculo no registrado";
    const additionalMinutes = formatMinutes(match.summary.additionalMinutes);
    const additionalDistance = formatDistanceKm(
      match.summary.additionalDistanceKm
    );
    const routeTime = formatTime(match.startTime);
    const priceLabel = formatCurrencyCLP(match.price);
    const capacityLabel =
      match.spacesAvailable === 1
        ? "1 cupo disponible"
        : `${match.spacesAvailable} cupos disponibles`;
    const ratingLabel =
      match.driver.rating !== null
        ? `${match.driver.rating.toFixed(1)} / 5`
        : "Sin evaluaciones";

    return (
      <TouchableOpacity
        key={match.travelId}
        style={styles.driverCard}
        onPress={() =>
          router.push({
            pathname: "/Passenger/PassengerDriverProfile",
            params: {
              name: match.driver.name,
              vehicle: vehicleLabel,
              price: priceLabel,
              priceValue: match.price.toString(),
              driverId: match.driver.id.toString(),
              driverPhone: match.driver.phone_number ?? "",
              driverRating:
                match.driver.rating !== null
                  ? match.driver.rating.toString()
                  : "",
              travelId: match.travelId.toString(),
              spacesAvailable: match.spacesAvailable.toString(),
              startTime: match.startTime,
              pickupDate: pickupDateParam ?? "",
              pickupTime: pickupTimeParam ?? "",
              pickupLocation: pickupLocationParam,
              requestId: requestIdParam,
              pickupLatitude: pickupLatitude?.toString() ?? "",
              pickupLongitude: pickupLongitude?.toString() ?? "",
              dropoffLocation: destinationNameParam,
              dropoffLatitude: dropoffLatitude?.toString() ?? "",
              dropoffLongitude: dropoffLongitude?.toString() ?? "",
              additionalMinutes: match.summary.additionalMinutes.toString(),
              additionalDistanceKm:
                match.summary.additionalDistanceKm.toString(),
              routeWaypoints: JSON.stringify(match.originalRoute ?? []),
            },
          })
        }
      >
        <View style={styles.driverInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {buildInitials(match.driver.name)}
            </Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{match.driver.name}</Text>
            <Text style={styles.vehicleName}>{vehicleLabel}</Text>
            <View style={styles.badgesRow}>
              <Text style={styles.badge}>{routeTime}</Text>
              <Text style={styles.badge}>{capacityLabel}</Text>
              <Text style={styles.badge}>{ratingLabel}</Text>
            </View>
          </View>
        </View>
        <View style={styles.driverMetrics}>
          <Text style={styles.priceText}>{priceLabel}</Text>
          <Text style={styles.metricText}>{additionalMinutes}</Text>
          <Text style={styles.metricText}>{additionalDistance}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
          >
            <Feather name="arrow-left" size={22} color="#121417" />
          </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Conductores disponibles</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{summaryLabel}</Text>
          {appliedConfig && (
            <Text style={styles.summaryCaption}>
              Tiempo extra maximo {appliedConfig.maxAdditionalMinutes} min
              {appliedConfig.maxDeviationMeters !== null
                ? ` · Desvio maximo ${appliedConfig.maxDeviationMeters} m`
                : " · Se considera solo el tiempo adicional"}
            </Text>
          )}
        </View>

        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#F99F7C" />
          </View>
        )}

        {error && !isLoading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!isLoading && !error && matches.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin coincidencias</Text>
            <Text style={styles.emptyCaption}>
              Intenta ajustar tu horario o punto de recogida para ampliar las
              opciones disponibles.
            </Text>
          </View>
        )}

        {!isLoading && !error && matches.length > 0 && (
          <View style={styles.matchesContainer}>
            {matches.map(renderMatchCard)}
          </View>
        )}

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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#121417",
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#121417",
  },
  headerSubtitle: {
    marginTop: 2,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#61758A",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: "#F5F0F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 15,
    color: "#121417",
    marginBottom: 4,
  },
  summaryCaption: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#61758A",
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorCard: {
    backgroundColor: "#FDECEA",
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#B42318",
  },
  emptyCard: {
    backgroundColor: "#F0F2F5",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#121417",
  },
  emptyCaption: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    textAlign: "center",
  },
  matchesContainer: {
    gap: 12,
  },
  driverCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#121417",
  },
  driverDetails: {
    flex: 1,
    gap: 4,
  },
  driverName: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#121417",
  },
  vehicleName: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#475467",
    backgroundColor: "#EEF2F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  driverMetrics: {
    alignItems: "flex-end",
    gap: 4,
    marginLeft: 12,
  },
  priceText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#121417",
  },
  metricText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#61758A",
  },
  bottomSpacer: {
    height: 80,
  },
});
