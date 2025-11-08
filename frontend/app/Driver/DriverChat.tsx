import ChatPanel from "@/components/common/ChatPanel";
import { API_BASE_URL } from "@/Services/BaseApiService";
import type { TravelCoordinate, TravelPlannedStop } from "@/types/travel";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Passenger = {
  id: string | number;
  name: string;
  role?: string;
  avatar?: string | null;
  phone?: string | null;
  profile_picture?: string | null;
  phone_number?: string | null;
  rating?: number | null;
  averageRating?: number | null;
};

type ProfilePreview = Passenger & {
  mode: "driver" | "passenger";
  roleLabel: string;
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

const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const resolveImageUrl = (value?: string | null) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const path = value.startsWith("/") ? value : `/${value}`;
  return `${MEDIA_BASE_URL}${path}`;
};

const formatRatingValue = (value?: number | null) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(1)} ★`;
  }
  return "Sin rating";
};

export default function DriverChat() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    travelId?: string;
    travel?: string;
    passengers?: string;
  }>();
  const [profilePreview, setProfilePreview] = useState<ProfilePreview | null>(null);
  const [failedPassengerAvatars, setFailedPassengerAvatars] = useState<Record<string | number, boolean>>({});
  const [modalImageFailed, setModalImageFailed] = useState(false);

  const travel = useMemo(
    () => parseJSONParam<TravelParam>(params.travel) ?? DEFAULT_TRAVEL,
    [params.travel]
  );

  const passengers = useMemo(
    () => parseJSONParam<Passenger[]>(params.passengers) ?? [],
    [params.passengers]
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

  const handleShowPassengerProfile = (passenger: Passenger) => {
    const avatarUri = resolveImageUrl(passenger.avatar ?? passenger.profile_picture ?? null);
    setModalImageFailed(false);
    setProfilePreview({
      ...passenger,
      avatar: avatarUri,
      roleLabel: passenger.role ?? "Pasajero",
      mode: "passenger",
      phone: passenger.phone ?? passenger.phone_number ?? null,
      rating: passenger.rating ?? passenger.averageRating ?? null,
    });
  };

  const handleCloseProfile = () => {
    setProfilePreview(null);
    setModalImageFailed(false);
  };

  const modalModeLabel =
    profilePreview?.mode === "driver" ? "Modo Driver" : "Modo Pasajero";

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
          <Text style={styles.headerTitle}>Chat del viaje</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pasajeros confirmados</Text>
          {passengers.length ? (
            passengers.map((passenger, index) => {
              const passengerKey = String(passenger.id ?? passenger.name ?? index);
              const passengerAvatarUri = resolveImageUrl(
                passenger.avatar ?? passenger.profile_picture ?? null
              );
              const hasFailed = Boolean(passengerKey && failedPassengerAvatars[passengerKey]);
              const showPassengerImage = passengerAvatarUri && !hasFailed;
              return (
                <TouchableOpacity
                  key={passengerKey}
                  style={styles.participantRow}
                  activeOpacity={0.85}
                  onPress={() => handleShowPassengerProfile(passenger)}
                >
                  {showPassengerImage ? (
                    <Image
                      source={{ uri: passengerAvatarUri }}
                      style={styles.participantAvatar}
                      onError={() =>
                        setFailedPassengerAvatars((prev) => ({
                          ...prev,
                          [passengerKey]: true,
                        }))
                      }
                    />
                  ) : (
                    <View style={styles.participantFallbackAvatar}>
                      <Text style={styles.participantInitials}>
                        {getInitials(passenger.name ?? "Pasajero")}
                      </Text>
                    </View>
                  )}
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{passenger.name ?? "Pasajero"}</Text>
                    <Text style={styles.participantRole}>
                      {passenger.role ?? "Pasajero"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyState}>
              Todavía no tienes pasajeros confirmados en este viaje.
            </Text>
          )}
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

      <Modal
        animationType="fade"
        transparent
        visible={!!profilePreview}
        onRequestClose={handleCloseProfile}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseProfile}
          />

          {profilePreview ? (
            <View style={styles.modalCard}>
              <View style={styles.modalModeBadge}>
                <Text style={styles.modalModeText}>{modalModeLabel}</Text>
              </View>

              {profilePreview.avatar && !modalImageFailed ? (
                <Image
                  source={{ uri: profilePreview.avatar }}
                  style={styles.modalAvatar}
                  onError={() => setModalImageFailed(true)}
                />
              ) : (
                <View style={styles.modalAvatarFallback}>
                  <Text style={styles.modalAvatarInitials}>
                    {getInitials(profilePreview.name ?? "Pasajero")}
                  </Text>
                </View>
              )}

              <Text style={styles.modalTitle}>{profilePreview.roleLabel}</Text>
              <Text style={styles.modalName}>{profilePreview.name}</Text>

              <View style={styles.modalInfoBox}>
                <Text style={styles.modalInfoLabel}>Teléfono</Text>
                <Text style={styles.modalInfoValue}>
                  {profilePreview.phone ?? "No disponible"}
                </Text>
              </View>

              <View style={styles.modalInfoBox}>
                <Text style={styles.modalInfoLabel}>Rating</Text>
                <Text style={styles.modalInfoValue}>
                  {formatRatingValue(profilePreview.rating)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCloseProfile}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
    paddingHorizontal: 4,
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
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
  },
  participantInitials: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#FFFFFF",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  modalCard: {
    width: "82%",
    borderRadius: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    gap: 12,
  },
  modalModeBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modalModeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
  modalAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  modalAvatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F99F7C",
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarInitials: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  modalName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  modalInfoBox: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 2,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modalInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  modalCloseButton: {
    marginTop: 4,
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#F99F7C",
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyState: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#64748B",
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
