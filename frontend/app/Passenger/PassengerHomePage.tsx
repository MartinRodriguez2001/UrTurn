import { useAuth } from "@/context/authContext";
import { useDriverStatus } from "@/hooks/useDriverStatus";
import travelApiService from "@/Services/TravelApiService";
import {
  PassengerConfirmedTravel,
  ProcessedTravel,
  TravelCoordinate,
  TravelPassenger,
  TravelPlannedStop,
} from "@/types/travel";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

  const [refreshing, setRefreshing] = useState(false);
  const [scheduledTravels, setScheduledTravels] = useState<PassengerConfirmedTravel[]>([]);
  const [loadingScheduledTravels, setLoadingScheduledTravels] = useState(false);
  const refreshStatusRef = useRef(refreshStatus);
  const featuredEvents = [
    {
      id: "Islazo",
      tag: "Buses Islazo",
      title: "Islazo",
      date: "Mar 11",
      time: "11:00",
      description: "🌴Islazo Uandes 2025🌴 ⚠️Vuelve lo que todos estaban esperando⚠️",
    },
    {
      id: "Gala Uandes",
      tag: "Buses Gala",
      title: "Gran Gala Uandes",
      date: "Vie 17",
      time: "22:00",
      description: "✨Lo mas grande del semestre vuelve, Gran Gala Uandes en Bosque Luz✨",
    },
    {
      id: "Evento 3",
      tag: "Buses Evento3",
      title: "Evento 3",
      date: "Lun 25",
      time: "11:00",
      description: "Prepárate y comparte viaje con tus compañeros.",
    },
    {
      id: "hackathon",
      tag: "Tecnología",
      title: "Hackathon 24h",
      date: "Sab 30",
      time: "08:00",
      description: "Coordina tu transporte desde temprano.",
    },
  ];

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
    vehicle?: ProcessedTravel["vehicle"] | null;
    driver_rating?: number | null;
  };

  type PassengerParam = {
    id: number | string;
    name: string;
    role?: string;
    avatar?: string | null;
    phone?: string | null;
  };

  type VehiclePayload = {
    brand?: string | null;
    model?: string | null;
    year?: number | string | null;
    licencePlate?: string | null;
  };

  type DriverPayload = {
    id: number;
    name: string;
    avatar: string | null;
    phone: string | null;
    rating?: number | null;
    vehicle?: VehiclePayload | null;
  };

  const mapVehicle = (vehicle?: ProcessedTravel["vehicle"] | null): VehiclePayload | null => {
    if (!vehicle) return null;
    return {
      brand: vehicle.brand ?? null,
      model: vehicle.model ?? null,
      year: vehicle.year ?? null,
      licencePlate:
        vehicle.licence_plate ??
        vehicle.license_plate ??
        vehicle.plate ??
        vehicle.patente ??
        null,
    };
  };

  const buildDriverPayload = (travel?: ProcessedTravel | null): DriverPayload | null => {
    if (!travel?.driver_id) {
      return null;
    }

    return {
      id: travel.driver_id.id,
      name: travel.driver_id.name,
      avatar: travel.driver_id.profile_picture ?? null,
      phone: travel.driver_id.phone_number ?? null,
      rating: travel.driver_rating ?? null,
      vehicle: mapVehicle(travel.vehicle ?? null),
    };
  };

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
      setLoadingScheduledTravels(true);
      const response = await travelApiService.getPassengerTravels();
      if (response.success && response.data) {
        const confirmedTravels = (response.data.confirmed ?? [])
          .filter((item: PassengerConfirmedTravel) => Boolean(item.travel))
          .sort((a, b) => {
            const dateA = new Date(a.travel?.start_time ?? 0).getTime();
            const dateB = new Date(b.travel?.start_time ?? 0).getTime();
            return dateA - dateB;
          });
        setScheduledTravels(confirmedTravels);
      } else {
        setScheduledTravels([]);
      }
    } catch (error) {
      setScheduledTravels([]);
    } finally {
      setLoadingScheduledTravels(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      triggerStatusRefresh();
      fetchPassengerTravels();
    }, [fetchPassengerTravels, triggerStatusRefresh])
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
    try {
      setRefreshing(true);
      await Promise.all([triggerStatusRefresh(), fetchPassengerTravels()]);
    } finally {
      setRefreshing(false);
    }
  };

  const formatRouteLabel = (travel?: ProcessedTravel | null) => {
    if (!travel) return "Ruta pendiente";
    const origin = travel.start_location_name ?? travel.start_location ?? "Origen por definir";
    const destination =
      travel.end_location_name ?? travel.end_location ?? "Destino por definir";
    return `${origin} → ${destination}`;
  };

  const formatTravelDate = (travel?: ProcessedTravel | null) => {
    if (!travel?.start_time) return "Fecha pendiente";
    const date = new Date(travel.start_time);
    if (Number.isNaN(date.getTime())) return "Fecha pendiente";
    return date.toLocaleDateString("es-CL", { weekday: "short", day: "2-digit" });
  };

  const formatTravelTime = (travel?: ProcessedTravel | null) => {
    if (!travel?.start_time) return "--:--";
    const date = new Date(travel.start_time);
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  };

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
      vehicle: travel.vehicle ?? null,
      driver_rating: travel.driver_rating ?? null,
    };
  };

  const mapConfirmedPassengers = (travel?: ProcessedTravel | null): PassengerParam[] => {
    const confirmedPassengers: TravelPassenger[] = travel?.passengers?.confirmed ?? [];

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
    const driver = buildDriverPayload(item.travel);

    router.push({
      pathname: "/Passenger/PassengerTravel",
      params: {
        travel: JSON.stringify(payload),
        passengers: JSON.stringify(passengersPayload),
        ...(driver ? { driver: JSON.stringify(driver) } : {}),
      },
    });
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
            refreshing={refreshing}
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
            <Text style={styles.sectionTitle}>Estatus de viajes</Text>
            <Text style={styles.sectionHint}>
              {scheduledTravels.length > 0
                ? `${scheduledTravels.length} programados`
                : "Sin viajes programados"}
            </Text>
          </View>
          {loadingScheduledTravels ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F97316" />
              <Text style={styles.loadingText}>Cargando próximos viajes...</Text>
            </View>
          ) : scheduledTravels.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.travelCarousel}
            >
              {scheduledTravels.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.travelCard}
                  onPress={() => handleScheduledTravelPress(item)}
                >
                  <Text style={styles.travelCardRoute} numberOfLines={2}>
                    {formatRouteLabel(item.travel)}
                  </Text>
                  <View style={styles.travelCardMetaRow}>
                    <View style={styles.travelCardMeta}>
                      <Feather name="calendar" size={14} color="#94A3B8" />
                      <Text style={styles.travelCardMetaText}>
                        {formatTravelDate(item.travel)}
                      </Text>
                    </View>
                    <View style={styles.travelCardMeta}>
                      <Feather name="clock" size={14} color="#94A3B8" />
                      <Text style={styles.travelCardMetaText}>
                        {formatTravelTime(item.travel)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.travelCardDriver}>
                    <Feather name="user" size={14} color="#F97316" />
                    <Text style={styles.travelCardDriverText}>
                      {item.travel?.driver_id?.name ?? "Conductor por confirmar"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.travelEmpty}>
              <Feather name="compass" size={36} color="#CBD5F5" />
              <Text style={styles.travelEmptyTitle}>No tienes viajes programados</Text>
              <Text style={styles.travelEmptyMessage}>
                Encuentra un viaje y aparecerá aquí para que puedas acceder rápidamente.
              </Text>
              <TouchableOpacity
                style={styles.travelEmptyButton}
                onPress={() => router.push("/Passenger/PassengerSearchRider")}
              >
                <Text style={styles.travelEmptyButtonText}>Buscar viajes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        
        <View style={styles.section}>
          <View style={styles.adsCard}>
            <View style={styles.adsPlaceholder}>
              <Feather name="image" size={32} color="#CBD5F5" />
              <Text style={styles.adsPlaceholderText}>Espacio reservado para anuncios</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Eventos</Text>
            <Text style={styles.sectionHint}>Desliza para ver más</Text>
          </View>
          <View style={styles.eventsCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsCarousel}
            >
              {featuredEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventItem}
                  onPress={() => router.push("/Passenger/PassengerSearchRider")}
                >
                  <View style={styles.eventTag}>
                    <Text style={styles.eventTagText}>{event.tag}</Text>
                  </View>
                  <Text style={styles.eventItemTitle}>{event.title}</Text>
                  <Text style={styles.eventItemSchedule}>
                    {event.date} · {event.time} hrs
                  </Text>
                  <Text style={styles.eventItemDescription}>{event.description}</Text>
                  <View style={styles.eventItemAction}>
                    <Text style={styles.eventItemActionText}>Ir al evento</Text>
                    <Feather name="arrow-right" size={16} color="#F97316" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.searchButtonContainer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push("/Passenger/PassengerSearchRider")}
        >
          <Feather name="search" size={24} color="#FFFFFF" />
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
  sectionHint: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#94A3B8",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadingText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#64748B",
  },
  travelCarousel: {
    paddingVertical: 4,
    gap: 12,
  },
  travelCard: {
    width: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginRight: 12,
    gap: 12,
  },
  travelCardRoute: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 15,
    color: "#0F172A",
  },
  travelCardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  travelCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  travelCardMetaText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#64748B",
  },
  travelCardDriver: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  travelCardDriverText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#F97316",
    flexShrink: 1,
  },
  travelEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    gap: 8,
  },
  travelEmptyTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 15,
    color: "#0F172A",
  },
  travelEmptyMessage: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
  },
  travelEmptyButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F97316",
  },
  travelEmptyButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 13,
    color: "#FFFFFF",
  },
  adsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    padding: 16,
    gap: 12,
  },
  adsBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E0E7FF",
  },
  adsBadgeText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    fontWeight: "600",
    color: "#4338CA",
  },
  adsPlaceholder: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    backgroundColor: "#EDF2FF",
    paddingVertical: 34,
    alignItems: "center",
    gap: 8,
  },
  adsPlaceholderText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#475569",
  },
  adsNote: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#475569",
  },
  eventsCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingLeft: 16,
  },
  eventsCarousel: {
    paddingRight: 16,
    gap: 12,
  },
  eventItem: {
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE4D6",
    backgroundColor: "#FFF7F3",
    padding: 16,
    marginRight: 12,
    gap: 6,
  },
  eventTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFECE5",
  },
  eventTagText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 11,
    fontWeight: "600",
    color: "#EA580C",
  },
  eventItemTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#0F172A",
  },
  eventItemSchedule: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#475569",
  },
  eventItemDescription: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#475569",
  },
  eventItemAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  eventItemActionText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 13,
    color: "#F97316",
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
    marginLeft: 15
  },
});
