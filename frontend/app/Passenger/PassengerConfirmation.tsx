import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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
  type Region,
} from "react-native-maps";
import { Feather } from "@expo/vector-icons";
import { useTravelRequest } from "@/hooks/useTravelRequest";

type Coordinate = { latitude: number; longitude: number };

const MIN_REGION_DELTA = 0.01;

const DEFAULT_REGION: Region = {
  latitude: -33.4489,
  longitude: -70.6693,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const createRegionFromPoints = (
  points: Coordinate[],
  fallback: Region = DEFAULT_REGION,
) => {
  if (!points.length) {
    return fallback;
  }

  let minLat = points[0]!.latitude;
  let maxLat = points[0]!.latitude;
  let minLng = points[0]!.longitude;
  let maxLng = points[0]!.longitude;

  for (const point of points) {
    if (point.latitude < minLat) minLat = point.latitude;
    if (point.latitude > maxLat) maxLat = point.latitude;
    if (point.longitude < minLng) minLng = point.longitude;
    if (point.longitude > maxLng) maxLng = point.longitude;
  }

  const latitudeDelta = Math.max((maxLat - minLat) * 1.5, MIN_REGION_DELTA);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.5, MIN_REGION_DELTA);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
};

const parseNumber = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === "") return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatDateLabel = (value?: Date) => {
  if (!value || Number.isNaN(value.valueOf())) {
    return "Fecha por definir";
  }
  return value.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const formatTimeLabel = (value?: Date) => {
  if (!value || Number.isNaN(value.valueOf())) {
    return "--:--";
  }
  return value.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrencyCLP = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
};

const parseRouteWaypoints = (raw?: string) => {
  if (!raw) {
    return [] as Coordinate[];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [] as Coordinate[];
    }

    return parsed
      .map((point) => {
        if (!point || typeof point !== "object") {
          return null;
        }
        const latitude = Number((point as any).latitude);
        const longitude = Number((point as any).longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }
        return { latitude, longitude };
      })
      .filter((item): item is Coordinate => item !== null);
  } catch (error) {
    console.warn("Invalid routeWaypoints param", error);
    return [] as Coordinate[];
  }
};

const buildInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

type DetailItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
};

export default function PassengerConfirmation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { requestTravel, loading } = useTravelRequest();

  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const getParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const travelIdParam = getParam(params.travelId);
  const travelId = travelIdParam ? Number(travelIdParam) : NaN;

  const pickupLocation = getParam(params.pickupLocation) ?? "Origen por definir";
  const dropoffLocation =
    getParam(params.dropoffLocation) ?? "Destino por definir";
  const vehicle = getParam(params.vehicle) ?? "";
  const driverName = getParam(params.driverName) ?? "Conductor";
  const driverPhone = getParam(params.driverPhone) ?? "";
  const driverRatingParam = getParam(params.driverRating);
  const driverRating =
    driverRatingParam !== undefined && driverRatingParam !== null
      ? Number(driverRatingParam)
      : NaN;
  const driverRatingLabel = Number.isFinite(driverRating)
    ? `${driverRating.toFixed(1)}?`
    : null;

  const spacesAvailableParam = getParam(params.spacesAvailable);
  const spacesAvailableCount = parseNumber(spacesAvailableParam);
  const spacesAvailableLabel =
    spacesAvailableCount !== null
      ? `${spacesAvailableCount} ${
          spacesAvailableCount === 1 ? "cupo" : "cupos"
        }`
      : null;

  const pickupLatitude = parseNumber(params.pickupLatitude);
  const pickupLongitude = parseNumber(params.pickupLongitude);
  const dropoffLatitude = parseNumber(params.dropoffLatitude);
  const dropoffLongitude = parseNumber(params.dropoffLongitude);

  const pickupCoordinate =
    pickupLatitude !== null && pickupLongitude !== null
      ? { latitude: pickupLatitude, longitude: pickupLongitude }
      : null;
  const dropoffCoordinate =
    dropoffLatitude !== null && dropoffLongitude !== null
      ? { latitude: dropoffLatitude, longitude: dropoffLongitude }
      : null;

  const pickupDateParam = getParam(params.pickupDate);
  const pickupTimeParam = getParam(params.pickupTime);
  const startTimeParam = getParam(params.startTime);
  const routeWaypointsParam = getParam(params.routeWaypoints);

  const pickupDate = pickupDateParam ? new Date(pickupDateParam) : undefined;
  const pickupTime = pickupTimeParam ? new Date(pickupTimeParam) : undefined;
  const startTime = startTimeParam ? new Date(startTimeParam) : undefined;

  const pickupDateLabel = formatDateLabel(pickupTime ?? pickupDate ?? startTime);
  const pickupTimeLabel = formatTimeLabel(pickupTime ?? startTime);
  const driverStartLabel = formatTimeLabel(startTime);

  const travelRoute = useMemo(
    () => parseRouteWaypoints(routeWaypointsParam),
    [routeWaypointsParam],
  );
  const travelPolyline = travelRoute.length >= 2 ? travelRoute : [];

  const priceLabel = getParam(params.price) ?? "--";
  const priceValueParam = getParam(params.priceValue);
  const priceValue =
    priceValueParam !== undefined && priceValueParam !== null
      ? Number(priceValueParam)
      : NaN;
  const priceDisplay = Number.isFinite(priceValue)
    ? formatCurrencyCLP(priceValue)
    : priceLabel;

  const initials = useMemo(() => buildInitials(driverName), [driverName]);

  const passengerSegment = useMemo(() => {
    if (!pickupCoordinate || !dropoffCoordinate) {
      return [];
    }
    return [pickupCoordinate, dropoffCoordinate];
  }, [pickupCoordinate, dropoffCoordinate]);

  const mapRegion = useMemo(() => {
    if (passengerSegment.length >= 2) {
      return createRegionFromPoints(passengerSegment);
    }

    if (travelPolyline.length >= 2) {
      return createRegionFromPoints(travelPolyline);
    }

    const fallbackPoints: Coordinate[] = [];
    if (pickupCoordinate) fallbackPoints.push(pickupCoordinate);
    if (dropoffCoordinate) fallbackPoints.push(dropoffCoordinate);
    if (travelPolyline.length === 1) {
      fallbackPoints.push(travelPolyline[0]!);
    }
    return createRegionFromPoints(fallbackPoints);
  }, [passengerSegment, travelPolyline, pickupCoordinate, dropoffCoordinate]);

  const mapRegionKey = `${mapRegion.latitude}-${mapRegion.longitude}-${mapRegion.latitudeDelta}-${mapRegion.longitudeDelta}`;

  const details: DetailItem[] = useMemo(() => {
    const scheduleTitle =
      pickupTimeLabel !== "--:--" ? pickupTimeLabel : "Horario por definir";

    const items: DetailItem[] = [
      {
        id: "pickup",
        title: pickupLocation,
        subtitle: "Lugar de recogida",
        icon: "map-pin",
      },
      {
        id: "dropoff",
        title: dropoffLocation,
        subtitle: "Destino",
        icon: "flag",
      },
      {
        id: "date",
        title: pickupDateLabel,
        subtitle: "Fecha",
        icon: "calendar",
      },
      {
        id: "schedule",
        title: scheduleTitle,
        subtitle: "Horario estimado",
        icon: "clock",
      },
    ];

    if (driverStartLabel !== "--:--") {
      items.push({
        id: "driver-start",
        title: driverStartLabel,
        subtitle: "Salida del conductor",
        icon: "navigation",
      });
    }

    items.push({
      id: "price",
      title: priceDisplay,
      subtitle: "Precio estimado",
      icon: "dollar-sign",
    });

    return items;
  }, [
    pickupLocation,
    dropoffLocation,
    pickupTimeLabel,
    pickupDateLabel,
    driverStartLabel,
    priceDisplay,
  ]);

  const driverSummary = useMemo(() => {
    const parts: string[] = [];
    if (vehicle) parts.push(vehicle);
    if (driverRatingLabel) parts.push(driverRatingLabel);
    if (spacesAvailableLabel) parts.push(spacesAvailableLabel);
    return parts.join(" • ") || "Información del conductor";
  }, [vehicle, driverRatingLabel, spacesAvailableLabel]);

  const canConfirm = !Number.isNaN(travelId) && pickupCoordinate && dropoffCoordinate;

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
          title="Tu origen"
          description={pickupLocation}
          pinColor="#2563EB"
        />
      ) : null}
      {dropoffCoordinate ? (
        <Marker
          coordinate={dropoffCoordinate}
          title="Tu destino"
          description={dropoffLocation}
          pinColor="#F97316"
        />
      ) : null}
    </MapView>
  );

  const handleContactDriver = () => {
    if (!driverPhone) {
      Alert.alert(
        "Sin número disponible",
        "El conductor aún no registra un número de contacto.",
      );
      return;
    }

    const telUrl = `tel:${driverPhone}`;
    Linking.openURL(telUrl).catch(() => {
      Alert.alert("No se pudo iniciar la llamada", "Intenta nuevamente.");
    });
  };

  const handleConfirmRequest = async () => {
    if (!canConfirm || !pickupCoordinate || !dropoffCoordinate) {
      Alert.alert(
        "Información incompleta",
        "Necesitas confirmar un viaje válido antes de continuar.",
      );
      return;
    }

    try {
      await requestTravel({
        travelId,
        pickupLocation,
        pickupLatitude: pickupCoordinate.latitude,
        pickupLongitude: pickupCoordinate.longitude,
        dropoffLocation,
        dropoffLatitude: dropoffCoordinate.latitude,
        dropoffLongitude: dropoffCoordinate.longitude,
        pickupDate,
        pickupTime,
      });

      Alert.alert(
        "Solicitud enviada",
        "Avisaremos al conductor que quieres unirte a su viaje.",
        [
          {
            text: "Ver mis viajes",
            onPress: () => router.replace("/Passenger/PassengerHomePage"),
          },
        ],
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos enviar tu solicitud. Intenta nuevamente.";
      Alert.alert("No se pudo enviar", message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color="#121417" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Confirmar solicitud</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.passengerSection}>
          <View style={styles.passengerImageContainer}>
            <View style={styles.passengerImagePlaceholder}>
              <Text style={styles.passengerInitial}>{initials || "?"}</Text>
            </View>
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>{driverName}</Text>
            <Text style={styles.passengerRole}>{driverSummary}</Text>
          </View>
          <View style={styles.contactButtonContainer}>
            <TouchableOpacity
              style={[
                styles.contactButton,
                !driverPhone ? styles.contactButtonDisabled : null,
              ]}
              onPress={handleContactDriver}
              disabled={!driverPhone}
            >
              <Text
                style={[
                  styles.contactButtonText,
                  !driverPhone ? styles.contactButtonTextDisabled : null,
                ]}
              >
                Contactar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mapContainer}>
          {renderRouteMap("preview")}
          <TouchableOpacity
            style={styles.expandHint}
            onPress={() => setIsMapExpanded(true)}
            activeOpacity={0.85}
          >
            <Feather name="maximize" size={16} color="#FFFFFF" />
            <Text style={styles.expandHintText}>Ver mapa completo</Text>
          </TouchableOpacity>
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

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.rejectButtonText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            (loading || !canConfirm) && styles.acceptButtonDisabled,
          ]}
          onPress={handleConfirmRequest}
          disabled={loading || !canConfirm}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.acceptButtonText}>Confirmar</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isMapExpanded}
        animationType="fade"
        transparent
        onRequestClose={() => setIsMapExpanded(false)}
      >
        <View style={styles.fullscreenMapOverlay}>
          <View style={styles.fullscreenMapWrapper}>
            {renderRouteMap("fullscreen")}
            <TouchableOpacity
              style={styles.closeMapButton}
              onPress={() => setIsMapExpanded(false)}
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
  },
  scrollContent: {
    paddingBottom: 120,
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
  contactButtonDisabled: {
    backgroundColor: "#F0F2F5",
  },
  contactButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 21,
    color: "#FFFFFF",
  },
  contactButtonTextDisabled: {
    color: "#98A2B3",
  },
  mapContainer: {
    height: 240,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F2F5",
  },
  map: {
    flex: 1,
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
    backgroundColor: "#FFFFFF",
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
  bottomSpacer: {
    height: 20,
  },
  fullscreenMapOverlay: {
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

