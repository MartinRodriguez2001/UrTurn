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
} from "@/types/travel";
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

        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>{user?.name?.[0] ?? "U"}</Text>
          </View>
        </TouchableOpacity>
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
                <Text style={styles.driverIcon}>🚗</Text>
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
                  style={styles.scheduledCard}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>🗓️</Text>
              <Text style={styles.emptyStateTitle}>Sin viajes confirmados</Text>
              <Text style={styles.emptyStateMessage}>
                Aún no tienes viajes confirmados con conductores. Solicita un viaje y aparecerá acá.
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
                  style={styles.scheduledCard}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📭</Text>
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

      <View style={styles.bottomNavigation}>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabelActive}>Inicio</Text>
        </View>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/Passenger/PassengerRiderOffers")}
        >
          <Text style={styles.navIcon}>🧭</Text>
          <Text style={styles.navLabel}>Explorar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/Passenger/PassengerProfile")}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Perfil</Text>
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
    bottom: 91,
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
    borderRadius: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchIcon: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  searchText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
  bottomNavigation: {
    flexDirection: "row",
    height: 75,
    backgroundColor: "#FFFFFF",
    paddingTop: 9,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navIcon: {
    fontSize: 22,
    textAlignVertical: "center",
  },
  navLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "500",
    fontSize: 12,
    color: "#61758A",
    textAlign: "center",
  },
  navLabelActive: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 12,
    color: "#121417",
    textAlign: "center",
  },
});
