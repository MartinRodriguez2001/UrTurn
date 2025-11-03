import NextTravelCard from "@/components/driverComps/NextTravelCard";
import PendingRequestCard from "@/components/driverComps/PendingRequestCard";
import { useAuth } from "@/context/authContext";
import { useDriverStatus } from "@/hooks/useDriverStatus";
import travelApiService from "@/Services/TravelApiService";
import {
  PassengerConfirmedTravel,
  PassengerRequestedTravel,
  ProcessedTravel,
  RequestStatus,
  TravelCoordinate,
  TravelPassenger,
  TravelPlannedStop,
} from "@/types/travel";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  route_waypoints?: TravelCoordinate[] | null;
  routeWaypoints?: TravelCoordinate[] | null;
  planned_stops?: TravelPlannedStop[] | null;
};

type PassengerParam = {
  id: number | string;
  name: string;
  role?: string;
  avatar?: string | null;
  phone?: string | null;
};

export default function PassengerHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    canAccessDriverMode,
    needsVehicleRegistration,
    loading,
    refreshStatus,
  } = useDriverStatus();

  const [confirmedTravels, setConfirmedTravels] = useState<PassengerConfirmedTravel[]>([]);
  const [requestedTravels, setRequestedTravels] = useState<PassengerRequestedTravel[]>([]);
  const [loadingTravels, setLoadingTravels] = useState(false);
  const [travelsError, setTravelsError] = useState<string | null>(null);
  const refreshStatusRef = useRef(refreshStatus);

  useEffect(() => {
    refreshStatusRef.current = refreshStatus;
  }, [refreshStatus]);

  const triggerStatusRefresh = useCallback(async () => {
    const currentRefresh = refreshStatusRef.current;
    if (currentRefresh) {
      await currentRefresh();
    }
  }, []);

  useEffect(() => {
    triggerStatusRefresh();
  }, [triggerStatusRefresh]);

  const fetchPassengerTravels = useCallback(async () => {
    try {
      setLoadingTravels(true);
      setTravelsError(null);
      const response = await travelApiService.getPassengerTravels();
      if (response.success && response.data) {
        setRequestedTravels(response.data.requested ?? []);
        setConfirmedTravels(response.data.confirmed ?? []);
      } else {
        setRequestedTravels([]);
        setConfirmedTravels([]);
        setTravelsError(response.message ?? "No pudimos obtener tus viajes");
      }
    } catch (error) {
      setTravelsError("No pudimos actualizar tus viajes");
      setRequestedTravels([]);
      setConfirmedTravels([]);
    } finally {
      setLoadingTravels(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshData = async () => {
        await triggerStatusRefresh();
        if (!isActive) return;
        await fetchPassengerTravels();
      };

      refreshData();

      return () => {
        isActive = false;
      };
    }, [fetchPassengerTravels, triggerStatusRefresh])
  );

  const formatRouteLabel = (travel?: ProcessedTravel | null) => {
    if (!travel) return "Ruta pendiente";
    const origin = travel.start_location_name ?? travel.start_location ?? "Origen por definir";
    const destination =
      travel.end_location_name ?? travel.end_location ?? "Destino por definir";
    return `${origin} -> ${destination}`;
  };

  const formatTravelDate = (travel?: ProcessedTravel | null) => {
    if (!travel?.start_time) return "Fecha pendiente";
    const date = new Date(travel.start_time);
    if (Number.isNaN(date.getTime())) return "Fecha pendiente";
    return date.toLocaleDateString("es-CL");
  };

  const formatTravelTime = (travel?: ProcessedTravel | null) => {
    if (!travel?.start_time) return "--:--";
    const date = new Date(travel.start_time);
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  };

  const getDestinationLabel = (travel?: ProcessedTravel | null) => {
    if (!travel) return "Destino por definir";
    return travel.end_location_name ?? travel.end_location ?? "Destino por definir";
  };

  const scheduledTravels = useMemo(() => {
    return confirmedTravels
      .filter((item) => item.travel)
      .sort((a, b) => {
        const dateA = new Date(a.travel?.start_time ?? 0).getTime();
        const dateB = new Date(b.travel?.start_time ?? 0).getTime();
        return dateA - dateB;
      });
  }, [confirmedTravels]);

  const pendingRequests = useMemo(
    () =>
      requestedTravels.filter(
        (item) => item.travel && item.status === RequestStatus.PENDIENTE
      ),
    [requestedTravels]
  );

  const buildTravelPayload = (travel?: ProcessedTravel | null): TravelPayload | null => {
    if (!travel) return null;
    const waypoints = travel.route_waypoints ?? travel.routeWaypoints ?? null;

    return {
      id: travel.id,
      start_location_name: travel.start_location_name ?? travel.start_location ?? null,
      start_latitude: travel.start_latitude,
      start_longitude: travel.start_longitude,
      end_location_name: travel.end_location_name ?? travel.end_location ?? null,
      end_latitude: travel.end_latitude,
      end_longitude: travel.end_longitude,
      start_time: travel.start_time,
      price: travel.price,
      route_waypoints: waypoints ?? null,
      routeWaypoints: waypoints ?? null,
      planned_stops: travel.planned_stops ?? null,
    };
  };

  const mapConfirmedPassengers = (travel?: ProcessedTravel | null): PassengerParam[] => {
    const confirmedPassengers: TravelPassenger[] =
      travel?.passengers?.confirmed ?? [];

    return confirmedPassengers.map((passenger) => ({
      id: passenger.id,
      name: passenger.name,
      role: "Pasajero",
      avatar: passenger.profile_picture ?? null,
      phone: passenger.phone_number ?? null,
    }));
  };

  const handleScheduledTravelPress = (item: PassengerConfirmedTravel) => {
    const payload = buildTravelPayload(item.travel);
    if (!payload) return;

    const passengersPayload = mapConfirmedPassengers(item.travel);
    const driver = item.travel?.driver_id
      ? {
          id: item.travel.driver_id.id,
          name: item.travel.driver_id.name,
          avatar: item.travel.driver_id.profile_picture ?? null,
          phone: item.travel.driver_id.phone_number ?? null,
        }
      : null;

    router.push({
      pathname: "/Passenger/PassengerTravel",
      params: {
        travel: JSON.stringify(payload),
        passengers: JSON.stringify(passengersPayload),
        ...(driver ? { driver: JSON.stringify(driver) } : {}),
      },
    });
  };

  const handlePendingTravelPress = (item: PassengerRequestedTravel) => {
    if (!item.travel) return;

    const payload = buildTravelPayload(item.travel);
    if (!payload) return;

    const passengersPayload = mapConfirmedPassengers(item.travel);
    const driver = item.travel.driver_id
      ? {
          id: item.travel.driver_id.id,
          name: item.travel.driver_id.name,
          avatar: item.travel.driver_id.profile_picture ?? null,
          phone: item.travel.driver_id.phone_number ?? null,
        }
      : null;

    router.push({
      pathname: "/Passenger/PassengerTravel",
      params: {
        travel: JSON.stringify(payload),
        passengers: JSON.stringify(passengersPayload),
        ...(driver ? { driver: JSON.stringify(driver) } : {}),
      },
    });
  };

  const handleDriverAction = () => {
    if (loading) return;

    if (canAccessDriverMode) {
      router.push("/Driver/DriverHomePage");
    } else {
      router.push("/Passenger/DriverRegister");
    }
  };

  const handleRefresh = async () => {
    await Promise.all([triggerStatusRefresh(), fetchPassengerTravels()]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Página Principal</Text>
          <Text style={styles.subTitle}>Hola, {user?.name ?? "Pasajero"}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingTravels}
            onRefresh={handleRefresh}
            tintColor="#F99F7C"
          />
        }
      >
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.driverCard}
            onPress={handleDriverAction}
            disabled={loading}
          >
            <View style={styles.driverCardContent}>
              <View style={styles.driverIconContainer}>
                <Feather name="user" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverTitle}>
                  {loading
                    ? "Verificando estado..."
                    : canAccessDriverMode
                    ? "Cambiar a Driver"
                    : "¿Quieres ser Driver?"}
                </Text>
                <Text style={styles.driverSubtitle}>
                  {loading
                    ? "Comprobando si tienes vehículos registrados..."
                    : canAccessDriverMode
                    ? "Cambia al modo conductor para crear viajes"
                    : needsVehicleRegistration
                    ? "Registra tu vehículo para empezar a compartir viajes"
                    : "Comparte viajes y gana dinero mientras estudias"}
                </Text>
              </View>
              <View style={styles.driverArrow}>
                <Text style={styles.arrowIcon}>➜</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Viajes programados</Text>
            {scheduledTravels.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{scheduledTravels.length}</Text>
              </View>
            )}
          </View>
          {loadingTravels ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F99F7C" />
              <Text style={styles.loadingText}>Cargando viajes...</Text>
            </View>
          ) : scheduledTravels.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalTravelList}
            >
              {scheduledTravels.map((item) => (
                <NextTravelCard
                  key={item.id}
                  Route={formatRouteLabel(item.travel)}
                  Date={formatTravelDate(item.travel)}
                  Time={formatTravelTime(item.travel)}
                  onPress={() => handleScheduledTravelPress(item)}
                  style={styles.scheduledCard}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Feather name="check" size={48} color="#CED4DA" style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateTitle}>Sin viajes confirmados</Text>
              <Text style={styles.emptyStateMessage}>
                Aún no tienes viajes confirmados con conductores. Solicita un viaje y aparecerá aquí.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Viajes solicitados</Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </View>
          {loadingTravels ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F99F7C" />
              <Text style={styles.loadingText}>Cargando solicitudes...</Text>
            </View>
          ) : pendingRequests.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalTravelList}
            >
              {pendingRequests.map((item) => (
                <PendingRequestCard
                  key={item.id}
                  passengerName={item.travel?.driver_id?.name ?? "Conductor"}
                  pickupLocation={item.start_location_name ?? "Origen por definir"}
                  destination={getDestinationLabel(item.travel)}
                  dateLabel={formatTravelDate(item.travel)}
                  timeLabel={formatTravelTime(item.travel)}
                  onPress={item.travel ? () => handlePendingTravelPress(item) : undefined}
                  style={styles.scheduledCard}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Feather name="inbox" size={48} color="#CED4DA" style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateTitle}>No tienes solicitudes pendientes</Text>
              <Text style={styles.emptyStateMessage}>
                Cuando envíes una solicitud a un conductor, podrás ver su estado aquí.
              </Text>
            </View>
          )}
        </View>

        {travelsError ? <Text style={styles.errorText}>{travelsError}</Text> : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.searchButtonContainer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push("/Passenger/PassengerSearchRider")}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>Buscar un viaje</Text>
        </TouchableOpacity>
      </View>

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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 20,
    color: "#121417",
  },
  subTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFE4D6",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#F97316",
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  driverCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  driverCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  driverIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  driverInfo: {
    flex: 1,
  },
  driverTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#121417",
  },
  driverSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    marginTop: 4,
  },
  driverArrow: {
    marginLeft: 8,
  },
  arrowIcon: {
    fontSize: 18,
    color: "#61758A",
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#121417",
  },
  badge: {
    backgroundColor: "#FFE0D3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 12,
    color: "#F97316",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  loadingText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
  },
  horizontalTravelList: {
    paddingVertical: 8,
    gap: 12,
  },
  scheduledCard: {
    width: 280,
    marginRight: 12,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#121417",
    marginBottom: 4,
  },
  emptyStateMessage: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    textAlign: "center",
  },
  errorText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#B91C1C",
    textAlign: "center",
    marginTop: 8,
  },
  bottomSpacer: {
    height: 120,
  },
  searchButtonContainer: {
    position: "absolute",
    bottom: 30, // Ajustado para quedar encima del navbar
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F99F7C",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  searchIcon: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginRight: 8,
  },
  searchText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
});
