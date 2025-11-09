import travelApiService from "@/Services/TravelApiService";
import { ProcessedTravel, TravelStatus } from "@/types/travel";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Passenger_Historial() {
  const router = useRouter();
  const [travels, setTravels] = useState<ProcessedTravel[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTravels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await travelApiService.getPassengerTravels();
      if (res.success) {
        const anyRes: any = res;
        const confirmedRaw: any[] = anyRes?.data?.confirmed ?? anyRes?.confirmed ?? [];
        const confirmed = confirmedRaw
          .map((c: any) => (c && c.travel ? (c.travel as ProcessedTravel) : null))
          .filter((t: ProcessedTravel | null): t is ProcessedTravel => !!t);
        setTravels(confirmed);
      } else {
        setTravels([]);
      }
    } catch (err) {
      setTravels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        await fetchTravels();
      };
      if (active) load();
      return () => {
        active = false;
      };
    }, [fetchTravels])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTravels();
    setRefreshing(false);
  };

  const endedTravels = travels
    .filter((t) => String(t.status).toLowerCase() === String(TravelStatus.FINALIZADO))
    .sort((a, b) => {
      const dateA = new Date(a.travel_date ?? a.start_time).getTime();
      const dateB = new Date(b.travel_date ?? b.start_time).getTime();
      return dateB - dateA; // newest first
    });

  const formatDate = (value: string | Date | undefined) => {
    if (!value) return "Fecha pendiente";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Fecha pendiente";
    return d.toLocaleDateString("es-CL");
  };

  const formatTime = (value: string | Date | undefined) => {
    if (!value) return "--:--";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  };

  const handlePress = (travel: ProcessedTravel) => {
    const payload = {
      id: travel.id,
      start_location_name: travel.start_location_name ?? travel.start_location,
      start_latitude: travel.start_latitude,
      start_longitude: travel.start_longitude,
      end_location_name: travel.end_location_name ?? travel.end_location,
      end_latitude: travel.end_latitude,
      end_longitude: travel.end_longitude,
      start_time: travel.start_time,
      end_time: travel.end_time,
      driver_id: (travel as any)?.driver_id ?? (travel as any)?.driver ?? null,
      price: travel.price,
      route_waypoints: travel.route_waypoints ?? travel.routeWaypoints ?? null,
      planned_stops: travel.planned_stops ?? null,
    };

    router.push({
      pathname: "/Passenger/Passenger_Historial_Travel",
      params: {
        travel: JSON.stringify(payload),
        passengers: JSON.stringify(travel.passengers?.confirmed ?? []),
        driver: JSON.stringify((travel as any)?.driver_id ?? (travel as any)?.driver ?? null),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F99F7C" />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Viajes</Text>
        <Text style={styles.subtitle}>Finalizados (del más nuevo al más antiguo)</Text>
      </View>

      <FlatList
        data={endedTravels}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F99F7C" />}
        contentContainerStyle={endedTravels.length === 0 ? styles.emptyContainer : styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <Text style={styles.route} numberOfLines={2}>
              {item.start_location_name ?? item.start_location ?? "Origen"} → {item.end_location_name ?? item.end_location ?? "Destino"}
            </Text>
            <View style={styles.row}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>{formatDate(item.travel_date ?? item.start_time)}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Hora</Text>
                <Text style={styles.infoValue}>{formatTime(item.start_time ?? item.start_time)}</Text>
              </View>
              <View style={styles.infoBlockRight}>
                <Text style={styles.infoLabel}>Pasajeros</Text>
                <Text style={styles.infoValue}>{(item.passengers?.confirmed ?? []).length}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No hay viajes finalizados</Text>
            <Text style={styles.emptyMsg}>Aquí aparecerán tus viajes terminados</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#121417" },
  subtitle: { fontSize: 13, color: "#61758A", marginTop: 4 },
  listContainer: { paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#61758A" },
  card: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  route: { fontWeight: "600", fontSize: 16, color: "#121417", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoBlock: { flex: 1 },
  infoBlockRight: { width: 72, alignItems: "flex-end" },
  infoLabel: { fontSize: 12, color: "#9CA3AF" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#121417" },
  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#121417", marginBottom: 6 },
  emptyMsg: { fontSize: 14, color: "#61758A" },
});
