import { userApi } from "@/Services/UserApiService";
import { useAuth } from "@/context/authContext";
import { UserProfile } from "@/types/user";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const initialProfile: UserProfile = {
  id: 0,
  name: "",
  institutional_email: "",
  phone_number: "",
  profile_picture: "",
  description: "",
  created_at: "",
  updated_at: "",
  IsDriver: false,
  active: false,
};

export default function PassengerProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.getProfile();
        if (response.success && response.data) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error("❌ Error al obtener perfil:", error);
        Alert.alert(
          "Error",
          "No se pudo cargar la información del perfil. Intenta nuevamente."
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar sesión. Intenta nuevamente.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", onPress: confirmLogout },
    ]);
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      const response = await userApi.deleteAccount();

      if (response.success) {
        await logout();
        Alert.alert(
          "Cuenta eliminada",
          response.message ??
            "Tu cuenta ha sido eliminada. Esperamos verte de nuevo.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response.message ?? "No se pudo eliminar la cuenta en este momento."
        );
      }
    } catch (error) {
      console.error("❌ Error al eliminar cuenta:", error);
      const message =
        error instanceof Error ? error.message : "Error inesperado";
      Alert.alert("Error", message);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción no se puede deshacer. ¿Seguro que deseas continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: confirmDeleteAccount },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi perfil</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profilePhotoContainer}
            activeOpacity={0.8}
          >
            {profile.profile_picture ? (
              <Image
                source={{ uri: profile.profile_picture }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhoto}>
                <Text style={styles.profileInitials}>
                  {getInitials(profile.name)}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {loadingProfile ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <>
              <Text style={styles.userName}>{profile.name}</Text>
              <Text style={styles.userEmail}>
                {profile.institutional_email}
              </Text>
              {profile.phone_number ? (
                <Text style={styles.userPhone}>{profile.phone_number}</Text>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de mí</Text>
          <Text style={styles.sectionBody}>
            {profile.description || "Aún no has agregado una descripción."}
          </Text>
        </View>

        <View style={styles.accountActionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.logoutButton,
              (loggingOut || deletingAccount) && styles.disabledButton,
            ]}
            onPress={handleLogout}
            disabled={loggingOut || deletingAccount}
          >
            {loggingOut ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              (deletingAccount || loggingOut) && styles.disabledButton,
            ]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount || loggingOut}
          >
            {deletingAccount ? (
              <ActivityIndicator color="#FFFFFF" />
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
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 18,
    color: "#111827",
  },
  scrollContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  profilePhotoContainer: {
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: 36,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#FFFFFF",
  },
  userName: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 24,
    color: "#111827",
  },
  userEmail: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  userPhone: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 18,
    color: "#111827",
  },
  sectionBody: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 22,
  },
  accountActionsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  logoutButtonText: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 16,
    color: "#111827",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  deleteButtonText: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.7,
  },
  bottomSpacer: {
    height: 100,
  },
});

