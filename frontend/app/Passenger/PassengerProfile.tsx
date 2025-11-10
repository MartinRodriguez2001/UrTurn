import { useAuth } from "@/context/authContext";
import travelApiService from "@/Services/TravelApiService";
import { userApi } from "@/Services/UserApiService";
import { UserProfile } from "@/types/user";
import { Feather } from "@expo/vector-icons";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PassengerProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripsCount, setTripsCount] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [processingLogout, setProcessingLogout] = useState(false);
  const [processingDelete, setProcessingDelete] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [profileRes, passengerTravelsRes] = await Promise.all([
          userApi.getProfile(),
          travelApiService.getPassengerTravels(),
        ]);

        if (profileRes?.success && profileRes.data) {
          setUserProfile(profileRes.data);
        }

        // trips: use confirmed travels as "taken" trips
        const confirmed = (passengerTravelsRes as any)?.data?.confirmed ?? [];
        setTripsCount(Array.isArray(confirmed) ? confirmed.length : 0);

        // attempt to compute rating counts from any reviews present in the confirmed travels
        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalReviews = 0;

        if (Array.isArray(confirmed)) {
          for (const item of confirmed) {
            const travel = (item as any)?.travel ?? (item as any);
            // look for possible reviews arrays in travel
            const reviews = (travel && (travel.reviews || travel.passenger_reviews || travel.reseñas || [])) as any[];
            if (Array.isArray(reviews) && reviews.length > 0) {
              for (const r of reviews) {
                const star = Number(r.rating ?? r.stars ?? r.starts ?? r.value ?? NaN);
                if (!Number.isNaN(star) && star >= 1 && star <= 5) {
                  counts[star] = (counts[star] || 0) + 1;
                  totalReviews++;
                }
              }
            }
            // fallback: some APIs may include stats with totals per rating
            if (travel && travel.stats && travel.stats.totalReviews && travel.stats.averageRating) {
              // we can't decompose per-star from this, so skip
            }
          }
        }

        // if we found no reviews in travels, attempt a gentle fallback: use driver_rating fields if present (not ideal)
        if (totalReviews === 0 && Array.isArray(confirmed)) {
          for (const item of confirmed) {
            const travel = (item as any)?.travel ?? (item as any);
            const r = travel?.driver_rating ?? travel?.rating ?? undefined;
            const star = r ? Math.round(Number(r)) : undefined;
            if (star && star >= 1 && star <= 5) {
              counts[star] = (counts[star] || 0) + 1;
              totalReviews++;
            }
          }
        }

        // If still no reviews, try fetching user's received reviews directly from the reviews API
        if (totalReviews === 0) {
          try {
            const profileId = profileRes?.data?.id;
            if (profileId) {
              const reviewService = (await import('@/Services/ReviewApiService')).default;
              const userReviewsRes = await reviewService.getUserReviews(profileId).catch(() => null);
              const reviewsArr = (userReviewsRes && (userReviewsRes as any).data && (userReviewsRes as any).data.received) || [];
              if (Array.isArray(reviewsArr) && reviewsArr.length > 0) {
                // reset counts and recount from received reviews
                const counts2: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                let total2 = 0;
                for (const r of reviewsArr) {
                  const rating = Number(r.starts ?? r.stars ?? r.rating ?? NaN);
                  if (!Number.isNaN(rating) && rating >= 1 && rating <= 5) {
                    counts2[Math.round(rating)] = (counts2[Math.round(rating)] || 0) + 1;
                    total2++;
                  }
                }
                // apply the counts from reviews API
                Object.assign(counts, counts2);
                totalReviews = total2;
              }
            }
          } catch (e) {
            // ignore fallback errors
          }
        }

        setRatingCounts(counts);
      } catch (error) {
        console.error("Error loading passenger profile:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalRatings = useMemo(() => Object.values(ratingCounts).reduce((a, b) => a + b, 0), [ratingCounts]);

  const averageRating = useMemo(() => {
    if (!totalRatings) return null;
    const sum = Object.entries(ratingCounts).reduce((s, [k, v]) => s + Number(k) * v, 0);
    return totalRatings > 0 ? sum / totalRatings : null;
  }, [ratingCounts, totalRatings]);

  const formatPercentage = (count: number) => {
    if (!totalRatings) return "0%";
    return `${Math.round((count / totalRatings) * 100)}%`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#121417" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#F99F7C" />
        </View>
      </SafeAreaView>
    );
  }

  const executeLogout = async () => {
    try {
      setProcessingLogout(true);
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar sesión. Intenta nuevamente.");
    } finally {
      setProcessingLogout(false);
    }
  };

  const handleLogout = () => {
    if (processingLogout || processingDelete) {
      return;
    }

    Alert.alert(
      "Cerrar sesión",
      "¿Deseas cerrar sesión para ingresar con otra cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: executeLogout },
      ]
    );
  };

  const deleteAccount = async () => {
    if (!userProfile?.id) {
      Alert.alert("Error", "No se pudo obtener la información de tu cuenta.");
      return;
    }

    try {
      setProcessingDelete(true);
      const response = await userApi.deleteUser(userProfile.id);
      if (!response.success) {
        throw new Error(response.message || "No se pudo eliminar la cuenta.");
      }
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("❌ Error al eliminar la cuenta:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo eliminar la cuenta. Intenta nuevamente."
      );
    } finally {
      setProcessingDelete(false);
    }
  };

  const handleDeleteAccount = () => {
    if (processingDelete || processingLogout) {
      return;
    }

    Alert.alert(
      "Eliminar cuenta",
      "Esta acción eliminará toda tu información y no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: deleteAccount },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#121417" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={styles.settingsButton}>
          <Feather name="settings" size={22} color="#121417" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profilePhotoContainer}>
            {userProfile?.profile_picture ? (
              <Image source={{ uri: userProfile.profile_picture }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhoto}>
                <Text style={styles.profileInitials}>{getInitials(userProfile?.name)}</Text>
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile?.name}</Text>
            <Text style={styles.userEmail}>
              {userProfile?.institutional_email}
            </Text>
            <Text style={styles.userStats}>{tripsCount} viajes</Text>
          </View>
        </View>

        <View style={styles.separator} />
        <View style={styles.descriptionContainer}>
          
          <View style={styles.sectionHeader}>
            <Feather name="user" size={20} color="#F99F7C" />
            <Text style={styles.descriptionHeader}>Acerca de</Text>
          </View>

          <Text style={styles.descriptionText}>{userProfile?.description ?? ""}</Text>
        </View>
        
        <View style={styles.descriptionContainer}>
          <View style={styles.sectionHeader}>
            <Feather name="message-circle" size={20} color="#F99F7C" />
            <Text style={styles.descriptionHeader}>Reseñas</Text>
          </View>

          <View style={styles.ratingOverview}>
            <View style={styles.ratingSummary}>
              <Text style={styles.ratingNumber}>{totalRatings ? (Object.entries(ratingCounts).reduce((sum, [k, v]) => sum + Number(k) * v, 0) / totalRatings).toFixed(2) : "0.0"}</Text>
              <View style={styles.ratingStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Text key={i} style={styles.star}>
                    {i < Math.round(averageRating ?? 0) ? (
                      <FontAwesome name="star" size={24} color="black" />
                    ) : (
                      <FontAwesome name="star-o" size={24} color="black" />
                    )}
                  </Text>
                ))}
              </View>
              <Text style={styles.ratingCount}>{totalRatings} reviews</Text>
            </View>

            <View style={styles.ratingBreakdown}>
              {[5, 4, 3, 2, 1].map((star) => (
                <View key={star} style={styles.ratingBar}>
                  <Text style={styles.ratingLabel}>{star}</Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: totalRatings ? `${Math.round((ratingCounts[star] || 0) / totalRatings * 100)}%` : "0%" }]} />
                  </View>
                  <Text style={styles.ratingPercentage}>{formatPercentage(ratingCounts[star] || 0)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowSettingsModal(false)}
              style={styles.modalCloseButton}
            >
              <Feather name="x" size={24} color="#121417" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Configuración</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Cuenta</Text>
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Feather name="user" size={20} color="#F99F7C" />
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Feather name="bell" size={20} color="#F99F7C" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Notificaciones</Text>
                  <Text style={styles.settingsItemDescription}>Gestiona tus preferencias de notificaciones</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Feather name="shield" size={20} color="#F99F7C" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Privacidad y seguridad</Text>
                  <Text style={styles.settingsItemDescription}>Controla tu privacidad</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Preferencias</Text>
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Feather name="map-pin" size={20} color="#F99F7C" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Ubicaciones guardadas</Text>
                  <Text style={styles.settingsItemDescription}>Casa, trabajo y otros destinos</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Feather name="credit-card" size={20} color="#F99F7C" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Métodos de pago</Text>
                  <Text style={styles.settingsItemDescription}>Gestiona tus formas de pago</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Feather name="star" size={20} color="#F99F7C" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Valoraciones y reseñas</Text>
                  <Text style={styles.settingsItemDescription}>Ve tu historial de calificaciones</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Soporte</Text>
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Feather name="help-circle" size={20} color="#F99F7C" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Centro de ayuda</Text>
                  <Text style={styles.settingsItemDescription}>Encuentra respuestas a tus preguntas</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Feather name="message-circle" size={20} color="#F99F7C" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Contactar soporte</Text>
                  <Text style={styles.settingsItemDescription}>Reporta problemas o envía comentarios</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Feather name="info" size={20} color="#F99F7C" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Acerca de UrTurn</Text>
                  <Text style={styles.settingsItemDescription}>Versión, términos y condiciones</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Sesión</Text>
              
              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={handleLogout}
                disabled={processingLogout || processingDelete}
              >
                <View style={[styles.settingsItemIcon, { backgroundColor: "#FFF7F2" }]}>
                  {processingLogout ? (
                    <ActivityIndicator size="small" color="#F99F7C" />
                  ) : (
                    <Feather name="log-out" size={20} color="#F99F7C" />
                  )}
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Cerrar sesión</Text>
                  <Text style={styles.settingsItemDescription}>Cierra tu sesión actual</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={handleDeleteAccount}
                disabled={processingDelete || processingLogout}
              >
                <View style={[styles.settingsItemIcon, { backgroundColor: "#FEE8E8" }]}>
                  {processingDelete ? (
                    <ActivityIndicator size="small" color="#E53935" />
                  ) : (
                    <Feather name="trash-2" size={20} color="#E53935" />
                  )}
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.settingsItemTitle, { color: "#E53935" }]}>Eliminar cuenta</Text>
                  <Text style={styles.settingsItemDescription}>Elimina permanentemente tu cuenta</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    height: 59,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 11,
    backgroundColor: "#FFFFFF",
  },
  backButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  settingsButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "PlusJakartaSans-Bold", fontSize: 18, lineHeight: 23, color: "#121417", textAlign: "center" },
  headerSpacer: { width: 48 },
  scrollContainer: { flex: 1 },
  profileSection: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 16, backgroundColor: "#FFFFFF" },
  profilePhotoContainer: { marginBottom: 16 },
  profilePhoto: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#F99F7C", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#FFFFFF" },
  profileInitials: { fontSize: 36, fontFamily: "PlusJakartaSans-Bold", color: "#FFFFFF" },
  userInfo: { alignItems: "center", marginBottom: 16 },
  userName: { fontFamily: "PlusJakartaSans-Bold", fontSize: 24, lineHeight: 30, color: "#121417", marginBottom: 4, textAlign: "center" },
  userEmail: {fontFamily: "PlusJakartaSans-Regular", fontSize: 16, lineHeight: 24, color: "#61758A", marginBottom: 2, },
  userRole: { fontFamily: "PlusJakartaSans-Regular", fontSize: 16, color: "#61758A" },
  userStats: { fontFamily: "PlusJakartaSans-Regular", fontSize: 14, color: "#61758A", marginTop: 4 },
  separator: { height: 8, backgroundColor: "#F8F9FA" },
  descriptionContainer: { margin: 16, gap: 8 },
  descriptionHeader: { fontSize: 22, fontFamily: "PlusJakartaSans-Bold", lineHeight: 26 },
  descriptionText: { fontFamily: "PlusJakartaSans-Regular", fontSize: 16, lineHeight: 24, color: "#121417" },
  bottomSpacer: { height: 120 },
  ratingOverview: { flexDirection: "row", marginBottom: 32, gap: 32 },
  ratingSummary: { alignItems: "center", width: 98, marginTop: 18 },
  ratingNumber: { fontFamily: "PlusJakartaSans-Bold", fontWeight: "800", fontSize: 36, lineHeight: 45, color: "#121417", marginBottom: 8 },
  ratingStars: { flexDirection: "row", marginBottom: 8 },
  star: { fontSize: 18 },
  ratingCount: { fontFamily: "PlusJakartaSans-Regular", fontSize: 16, lineHeight: 24, color: "#121417" },
  ratingBreakdown: { flex: 1, gap: 12 },
  ratingBar: { flexDirection: "row", alignItems: "center", gap: 8 },
  ratingLabel: { fontFamily: "PlusJakartaSans-Regular", fontSize: 14, lineHeight: 21, color: "#121417", width: 20 },
  barContainer: { flex: 1, height: 8, backgroundColor: "#DBE0E5", borderRadius: 4 },
  bar: { height: "100%", backgroundColor: "#000000ff", borderRadius: 4 },
  ratingPercentage: { fontFamily: "PlusJakartaSans-Regular", fontSize: 14, lineHeight: 21, color: "#61758A", width: 40, textAlign: "right" },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    height: 59,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 11,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalCloseButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 18,
    lineHeight: 23,
    color: "#121417",
    textAlign: "center",
  },
  modalHeaderSpacer: {
    width: 48,
  },
  modalContent: {
    flex: 1,
  },
  settingsSection: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  settingsSectionTitle: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 16,
    lineHeight: 20,
    color: "#61758A",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF7F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 16,
    lineHeight: 20,
    color: "#121417",
    marginBottom: 4,
  },
  settingsItemDescription: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 14,
    lineHeight: 18,
    color: "#61758A",
  },
    sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
});
