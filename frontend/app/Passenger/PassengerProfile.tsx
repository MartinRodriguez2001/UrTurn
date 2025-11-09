import travelApiService from "@/Services/TravelApiService";
import { userApi } from "@/Services/UserApiService";
import { UserProfile } from "@/types/user";
import { useAuth } from "@/context/authContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PassengerProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripsCount, setTripsCount] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [processingLogout, setProcessingLogout] = useState(false);
  const [processingDelete, setProcessingDelete] = useState(false);

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

        // if we found no reviews, attempt a gentle fallback: use driver_rating fields if present (not ideal)
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

        setRatingCounts(counts);
      } catch (error) {
        console.error("Error loading passenger profile:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalRatings = useMemo(() => Object.values(ratingCounts).reduce((a, b) => a + b, 0), [ratingCounts]);

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
        <View style={styles.headerSpacer} />
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
            <Text style={styles.userRole}>Pasajero</Text>
            <Text style={styles.userStats}>{tripsCount} viajes</Text>
          </View>
        </View>

        <View style={styles.separator} />
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionHeader}>Acerca de</Text>
          <Text style={styles.descriptionText}>{userProfile?.description ?? ""}</Text>
        </View>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionHeader}>Reseñas</Text>

          <View style={styles.ratingOverview}>
            <View style={styles.ratingSummary}>
              <Text style={styles.ratingNumber}>{totalRatings ? (Object.entries(ratingCounts).reduce((sum, [k, v]) => sum + Number(k) * v, 0) / totalRatings).toFixed(2) : "0.0"}</Text>
              <View style={styles.ratingStars}>
                <Text style={styles.star}>⭐</Text>
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

        <View style={styles.accountActions}>
          <TouchableOpacity
            style={[
              styles.accountButton,
              styles.logoutButton,
              (processingLogout || processingDelete) && styles.disabledButton,
            ]}
            onPress={handleLogout}
            disabled={processingLogout || processingDelete}
          >
            {processingLogout ? (
              <ActivityIndicator size="small" color="#F99F7C" />
            ) : (
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.accountButton,
              styles.deleteButton,
              (processingDelete || processingLogout) && styles.disabledButton,
            ]}
            onPress={handleDeleteAccount}
            disabled={processingDelete || processingLogout}
          >
            {processingDelete ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteButtonText}>Eliminar cuenta</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerTitle: { fontFamily: "PlusJakartaSans-Bold", fontSize: 18, lineHeight: 23, color: "#121417", textAlign: "center" },
  headerSpacer: { width: 48 },
  scrollContainer: { flex: 1 },
  profileSection: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 16, backgroundColor: "#FFFFFF" },
  profilePhotoContainer: { marginBottom: 16 },
  profilePhoto: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#F99F7C", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#FFFFFF" },
  profileInitials: { fontSize: 36, fontFamily: "PlusJakartaSans-Bold", color: "#FFFFFF" },
  userInfo: { alignItems: "center", marginBottom: 16 },
  userName: { fontFamily: "PlusJakartaSans-Bold", fontSize: 24, lineHeight: 30, color: "#121417", marginBottom: 4, textAlign: "center" },
  userRole: { fontFamily: "PlusJakartaSans-Regular", fontSize: 16, color: "#61758A" },
  userStats: { fontFamily: "PlusJakartaSans-Regular", fontSize: 14, color: "#61758A", marginTop: 4 },
  separator: { height: 8, backgroundColor: "#F8F9FA" },
  descriptionContainer: { margin: 16, gap: 8 },
  descriptionHeader: { fontSize: 22, fontFamily: "PlusJakartaSans-Bold", lineHeight: 26 },
  descriptionText: { fontFamily: "PlusJakartaSans-Regular", fontSize: 16, lineHeight: 24, color: "#121417" },
  bottomSpacer: { height: 120 },
  ratingOverview: { flexDirection: "row", marginBottom: 32, gap: 32 },
  ratingSummary: { alignItems: "center", width: 98 },
  ratingNumber: { fontFamily: "PlusJakartaSans-Bold", fontWeight: "800", fontSize: 36, lineHeight: 45, color: "#121417", marginBottom: 8 },
  ratingStars: { flexDirection: "row", marginBottom: 8 },
  star: { fontSize: 18 },
  ratingCount: { fontFamily: "PlusJakartaSans-Regular", fontSize: 16, lineHeight: 24, color: "#121417" },
  ratingBreakdown: { flex: 1, gap: 12 },
  ratingBar: { flexDirection: "row", alignItems: "center", gap: 8 },
  ratingLabel: { fontFamily: "PlusJakartaSans-Regular", fontSize: 14, lineHeight: 21, color: "#121417", width: 20 },
  barContainer: { flex: 1, height: 8, backgroundColor: "#DBE0E5", borderRadius: 4 },
  bar: { height: "100%", backgroundColor: "#F99F7C", borderRadius: 4 },
  ratingPercentage: { fontFamily: "PlusJakartaSans-Regular", fontSize: 14, lineHeight: 21, color: "#61758A", width: 40, textAlign: "right" },
  accountActions: { paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  accountButton: { borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  logoutButton: { backgroundColor: "#FFF7F2", borderColor: "#F99F7C" },
  logoutButtonText: { fontFamily: "PlusJakartaSans-SemiBold", fontSize: 16, color: "#F99F7C" },
  deleteButton: { backgroundColor: "#E53935", borderColor: "#E53935" },
  deleteButtonText: { fontFamily: "PlusJakartaSans-SemiBold", fontSize: 16, color: "#FFFFFF" },
  disabledButton: { opacity: 0.6 },
});
