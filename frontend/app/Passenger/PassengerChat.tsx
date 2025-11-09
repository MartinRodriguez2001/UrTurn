import ChatPanel from "@/components/common/ChatPanel";
import type { TravelCoordinate, TravelPlannedStop } from "@/types/travel";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DriverInfo = {
  id: string | number;
  name: string;
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
  planned_stops?: TravelPlannedStop[] | null;
};

const DEFAULT_DRIVER: DriverInfo = {
  id: 0,
  name: "Conductor",
  avatar: null,
  phone: null,
};

const DEFAULT_TRAVEL: TravelParam = {
  id: undefined,
  start_location_name: null,
  end_location_name: null,
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

const getInitials = (value: string) => {
  const segments = value.trim().split(/\s+/);
  if (!segments.length) return "";
  return segments
    .slice(0, 2)
    .map((segment) => segment[0])
    .join("")
    .toUpperCase();
};

export default function PassengerChat() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    travelId?: string;
    travel?: string;
    driver?: string;
  }>();

  const travel = useMemo(
    () => parseJSONParam<TravelParam>(params.travel) ?? DEFAULT_TRAVEL,
    [params.travel]
  );

  const driver = useMemo(
    () => parseJSONParam<DriverInfo>(params.driver) ?? DEFAULT_DRIVER,
    [params.driver]
  );

  const travelId = useMemo(() => {
    if (params.travelId) {
      const parsed = Number(params.travelId);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    const fallback = travel?.id;
    if (fallback === undefined || fallback === null) {
      return undefined;
    }
    const parsed = typeof fallback === "string" ? Number(fallback) : fallback;
    return Number.isFinite(parsed) ? Number(parsed) : undefined;
  }, [params.travelId, travel?.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Chat con el conductor</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conductor</Text>
          <View style={styles.participantRow}>
            {driver.avatar ? (
              <Image source={{ uri: driver.avatar }} style={styles.participantAvatar} />
            ) : (
              <View style={styles.participantFallbackAvatar}>
                <Text style={styles.participantInitials}>{getInitials(driver.name)}</Text>
              </View>
            )}
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{driver.name}</Text>
              <Text style={styles.participantRole}>
                {driver.phone ? `Teléfono: ${driver.phone}` : "Teléfono no disponible"}
              </Text>
            </View>
          </View>
        </View>

        {travelId !== undefined ? (
          <ChatPanel travelId={travelId} title="Conversación de viaje" />
        ) : (
          <View style={styles.emptyChatState}>
            <Text style={styles.emptyChatTitle}>Chat no disponible</Text>
            <Text style={styles.emptyChatBody}>
              No pudimos identificar el viaje seleccionado. Vuelve atrás e inténtalo nuevamente.
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  headerSpacer: {
    width: 48,
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#111827",
  },
  headerSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  content: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#0F172A",
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  participantAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  participantFallbackAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  participantInitials: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#312E81",
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    color: "#111827",
  },
  participantRole: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  emptyChatState: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFF5F5",
    gap: 8,
  },
  emptyChatTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#B91C1C",
  },
  emptyChatBody: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#B91C1C",
  },
});
