import NextTravelCard from "@/components/driverComps/NextTravelCard";
import PendingRequestCard from "@/components/driverComps/PendingRequestCard";
import { useAuth } from "@/context/authContext";
import { useDriverStatus } from "@/hooks/useDriverStatus";
import travelApiService from "@/Services/TravelApiService";
import {
  ProcessedTravel,
  Summary,
  TravelCoordinate,
  TravelPassenger,
  TravelPlannedStop,
  TravelStatus,
} from "@/types/travel";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface DriverTravelsListResponse {
  success: boolean;
  message: string;
  cound: number;
  summary: Summary;
  travels: ProcessedTravel[];
}

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

type PendingRequestItem = {
  travel: ProcessedTravel;
  travelPayload: TravelPayload;
  passenger: TravelPassenger;
  pickupLocation: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  destination: string;
  dropoffLocation: string;
  dropoffLatitude?: number | null;
  dropoffLongitude?: number | null;
  confirmedPassengers: PassengerParam[];
};

export default function DriverHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canAccessDriverMode, loading, refreshStatus } = useDriverStatus();
  const [travels, setTravels] = useState<ProcessedTravel[]>([]);
  const [loadingTravels, setLoadingTravels] = useState(false);
  const refreshStatusRef = useRef(refreshStatus);

  useEffect(() => {
    refreshStatusRef.current = refreshStatus;
  }, [refreshStatus]);

  const getDriverTravels = useCallback(async () => {
    try {
      setLoadingTravels(true);
      const response = await travelApiService.getDriverTravels();
      if (response.success) {
        const travelsData = response.travels;
        setTravels(travelsData || []);
      } else {
        setTravels([]);
      }
    } catch (error) {
      setTravels([]);
    } finally {
      setLoadingTravels(false);
    }
  }, []);
  const getScheduledTravels = (): ProcessedTravel[] => {
    if (travels.length === 0) return [];

    const now = new Date();
    const futureTravels = travels.filter((travel) => {
      const travelDate = new Date(travel.start_time);
      const normalizedStatus = String(travel.status || "")
        .toLowerCase()
        .trim();
      const hasEnded = Boolean(travel.end_time);
      const isFuture = travelDate > now;
      const isActive = travelDate <= now && !hasEnded;

      return (
        (isFuture || isActive) &&
        (normalizedStatus === TravelStatus.CONFIRMADO ||
          normalizedStatus === TravelStatus.PENDIENTE)
      );
    });

    return futureTravels.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  };

  const triggerStatusRefresh = useCallback(async () => {
    const currentRefresh = refreshStatusRef.current;
    if (currentRefresh) {
      await currentRefresh();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshData = async () => {
        await triggerStatusRefresh();
        if (!isActive) return;
        await getDriverTravels();
      };

      refreshData();

      return () => {
        isActive = false;
      };
    }, [getDriverTravels, triggerStatusRefresh])
  );

  useEffect(() => {
    if (!loading && !canAccessDriverMode) {
      router.replace("/Passenger/DriverRegister");
    }
  }, [loading, canAccessDriverMode, router]);

  const handleRefresh = async () => {
    await Promise.all([triggerStatusRefresh(), getDriverTravels()]);
  };

  // Definir variables para usar en el JSX
  const buildTravelPayload = (travel: ProcessedTravel): TravelPayload => {
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

  const mapConfirmedPassengers = (travel: ProcessedTravel): PassengerParam[] => {
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

  const scheduledTravels = getScheduledTravels();
  const nextTravel = scheduledTravels.length > 0 ? scheduledTravels[0] : null;
  const pendingRequests = useMemo<PendingRequestItem[]>(() => {
    return travels.flatMap((travel) => {
      const pendingPassengers = travel.passengers?.pending ?? [];

      if (!pendingPassengers.length) {
        return [];
      }

      return pendingPassengers.map((passenger) => {
        const pickupLocation =
          passenger.start_location_name ??
          passenger.location ??
          travel.start_location_name ??
          travel.start_location ??
          "Origen por definir";

        const destination =
          passenger.end_location_name ??
          travel.end_location_name ??
          travel.end_location ??
          "Destino por definir";

        const dropoffLatitude = passenger.end_latitude ?? travel.end_latitude ?? null;
        const dropoffLongitude = passenger.end_longitude ?? travel.end_longitude ?? null;

        return {
          travel,
          travelPayload: buildTravelPayload(travel),
          passenger,
          pickupLocation,
          pickupLatitude: passenger.start_latitude ?? null,
          pickupLongitude: passenger.start_longitude ?? null,
          destination,
          dropoffLocation: destination,
          dropoffLatitude,
          dropoffLongitude,
          confirmedPassengers: mapConfirmedPassengers(travel),
        };
      });
    });
  }, [travels]);

  const pendingRequestsCount = pendingRequests.length;

  // Mostrar loading mientras se verifica el estado
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={styles.loadingText}>Cargando</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canAccessDriverMode) {
    return null;
  }

  const formatRouteLabel = (travel: ProcessedTravel) => {
    const origin =
      travel.start_location_name ?? travel.start_location ?? "Origen por definir";
    const destination =
      travel.end_location_name ?? travel.end_location ?? "Destino por definir";
    return `${origin} -> ${destination}`;
  };

  const formatTravelDate = (dateValue: string | Date) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return "Fecha pendiente";
    }
    return date.toLocaleDateString("es-CL");
  };

  const formatTravelTime = (dateValue: string | Date) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return "--:--";
    }
    return date.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTravelCardPress = (travel: ProcessedTravel) => {
    const payload = buildTravelPayload(travel);
    const passengersPayload = mapConfirmedPassengers(travel);

    router.push({
      pathname: "/Driver/DriverTravel",
      params: {
        travel: JSON.stringify(payload),
        passengers: JSON.stringify(passengersPayload),
      },
    });
  };

  const handlePendingRequestPress = (request: PendingRequestItem) => {
    const payload = {
      requestId: request.passenger.requestId ?? null,
      passenger: {
        id: request.passenger.id,
        name: request.passenger.name,
        phoneNumber: request.passenger.phone_number ?? null,
        profilePicture: request.passenger.profile_picture ?? null,
      },
      pickupLocation: request.pickupLocation,
      pickupLatitude: request.pickupLatitude,
      pickupLongitude: request.pickupLongitude,
      destination: request.destination,
  dropoffLocation: request.dropoffLocation,
  dropoffLatitude: request.dropoffLatitude ?? null,
  dropoffLongitude: request.dropoffLongitude ?? null,
      travelId: request.travel.id,
      startTime: request.travel.start_time,
      travel: request.travelPayload,
      confirmedPassengers: request.confirmedPassengers,
    };

    router.push({
      pathname: "/Driver/RequestTravelDriver",
      params: {
        request: JSON.stringify(payload),
      },
    });
  };

  const handleNavigateToPassangerHome = () => {
    router.push("/Passenger/PassengerHomePage");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Página Principal</Text>
          <Text style={styles.subTitle}>Hola, {user?.name ?? "Pasajero"}</Text>
        </View>

        <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/Driver/DriverProfile")}>
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
            style={styles.switchCard}
            onPress={handleNavigateToPassangerHome}
          >
            <View style={styles.switchCardContent}>
              <View style={styles.switchIconContainer}>
                <Text style={styles.switchIcon}>🙋‍♂️</Text>
              </View>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Cambiar a Passenger</Text>
                <Text style={styles.switchSubtitle}>
                  Busca viajes y solicita que te lleven a tu destino.
                </Text>
              </View>
              <View style={styles.switchArrow}>
                <Text style={styles.switchArrowIcon}>&gt;</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Published Trips Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Viajes Programados</Text>
          </View>
          {loadingTravels ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F99F7C" />
              <Text style={styles.loadingText}>Cargando viajes...</Text>
            </View>
          ) : scheduledTravels.length > 0 ? (
            <FlatList
              horizontal
              data={scheduledTravels}
              keyExtractor={(travel) => String(travel.id)}
              renderItem={({ item }) => (
                <NextTravelCard
                  Route={formatRouteLabel(item)}
                  Date={formatTravelDate(item.start_time)}
                  Time={formatTravelTime(item.start_time)}
                  onPress={() => handleTravelCardPress(item)}
                  style={styles.scheduledCard}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalTravelList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              nestedScrollEnabled
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>🚗</Text>
              <Text style={styles.emptyStateTitle}>
                No tienes viajes programados
              </Text>
              <Text style={styles.emptyStateMessage}>
                Publica tu primer viaje y comienza a ganar dinero
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push("/Driver/PublishTravel")}
              >
                <Text style={styles.emptyStateButtonText}>Publicar Viaje</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pending Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Solicitudes Pendientes</Text>
            {pendingRequestsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
              </View>
            )}
          </View>

          {loadingTravels ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F99F7C" />
              <Text style={styles.loadingText}>Cargando solicitudes...</Text>
            </View>
          ) : pendingRequestsCount > 0 ? (
            <FlatList
              horizontal
              data={pendingRequests}
              keyExtractor={(item) =>
                `${item.travel.id}-${item.passenger.requestId ?? item.passenger.id}`
              }
              renderItem={({ item }) => (
                <PendingRequestCard
                  passengerName={item.passenger.name ?? "Pasajero"}
                  pickupLocation={item.pickupLocation}
                  destination={item.destination}
                  dateLabel={formatTravelDate(item.travel.start_time)}
                  timeLabel={formatTravelTime(item.travel.start_time)}
                  onPress={() => handlePendingRequestPress(item)}
                  style={styles.scheduledCard}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalTravelList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              nestedScrollEnabled
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateTitle}>
                No hay solicitudes pendientes
              </Text>
              <Text style={styles.emptyStateMessage}>
                Las solicitudes de pasajeros aparecerán aquí
              </Text>
            </View>
          )}
        </View>

        {/* Travel Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{travels.length}</Text>
              <Text style={styles.statLabel}>Viajes Publicados</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {
                  travels.filter((t) => t.status === TravelStatus.CONFIRMADO)
                    .length
                }
              </Text>
              <Text style={styles.statLabel}>Viajes Confirmados</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {travels.reduce(
                  (sum, t) => sum + (t.capacity - t.spaces_available),
                  0
                )}
              </Text>
              <Text style={styles.statLabel}>Pasajeros Totales</Text>
            </View>
          </View>
        </View>

        {/* Spacer for bottom navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Publish New Trip Button */}
      <View style={styles.publishButtonContainer}>
        <TouchableOpacity
          style={styles.publishButton}
          onPress={() => router.push("/Driver/PublishTravel")}
        >
          <Text style={styles.publishIcon}>+</Text>
          <Text style={styles.publishText}>Publicar Nuevo Viaje</Text>
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
  headerSpacer: {
    width: 48,
    height: 48,
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
    fontWeight: "bold",
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
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  switchCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  switchCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  switchIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  switchInfo: {
    flex: 1,
  },
  switchTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#121417",
  },
  switchSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    marginTop: 4,
  },
  switchArrow: {
    marginLeft: 8,
  },
  switchArrowIcon: {
    fontSize: 18,
    color: "#61758A",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#121417",
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  bottomSpacer: {
    height: 120, // Ajustado para el navbar
  },
  publishButtonContainer: {
    position: "absolute",
    bottom: 30, // Ajustado para quedar encima del navbar
    left: 20,
    right: 20,
    zIndex: 1,
  },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F99F7C",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  publishIcon: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginRight: 8,
  },
  publishText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  loadingText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    color: "#61758A",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    color: "#F99F7C",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  horizontalTravelList: {
    paddingRight: 16,
    paddingVertical: 4,
  },
  scheduledCard: {
    width: 280,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
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
  emptyStateButton: {
    backgroundColor: "#F99F7C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    color: "#FFFFFF",
  },
  badge: {
    backgroundColor: "#FF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 24,
    color: "#F99F7C",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#61758A",
    textAlign: "center",
  },
  subTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    marginTop: 4,
  },
});
