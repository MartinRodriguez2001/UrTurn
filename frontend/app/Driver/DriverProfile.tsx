import { userApi } from "@/Services/UserApiService";
import VehicleApiService from "@/Services/VehicleApiService";
import { UserProfile } from "@/types/user";
import { Vehicle } from "@/types/vehicle";
import { useAuth } from "@/context/authContext";
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

export default function DriverProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [validatingVehicle, setValidatingVehicle] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    institutional_email: "",
    phone_number: "",
    profile_picture: "",
    description: "",
    updated_at: "",
    created_at: "",
    id: 0,
    IsDriver: true,
    active: false,
  });

  async function handleValidateVehicle(vehicleId: number) {
    try {
      const response = await VehicleApiService.forceValidateVehicle(vehicleId);
      if (response.success) {
        Alert.alert("Éxito", "Vehículo validado correctamente", [
          {
            text: "OK",
            onPress: () => {
              getProfileData();
            },
          },
        ]);
      } else {
        Alert.alert(
          "Error",
          "No se pudo validar el vehículo. Intenta nuevamente más tarde."
        );
      }
    } catch (error) {
      console.error("❌ Error al validar vehículo:", error);
    } finally {
      setValidatingVehicle(null);
    }
  }

   const getProfileData = async () => {
    try {
      const [response, responseVehicles] = await Promise.all([
        userApi.getProfile(),
        VehicleApiService.getUserVehicles()
      ]);
      
      console.log("👤 Perfil del usuario:", response);
      console.log("🚗 Vehículos respuesta:", responseVehicles);
      
      if (response.success && response.data) {
        setUserProfile({
          name: response.data.name,
          institutional_email: response.data.institutional_email,
          phone_number: response.data.phone_number,
          profile_picture: response.data.profile_picture,
          updated_at: response.data.updated_at,
          description: response.data.description,
          created_at: response.data.created_at,
          id: response.data.id,
          IsDriver: response.data.IsDriver,
          active: response.data.active,
        });
      }

      if (responseVehicles?.success && responseVehicles.data) {
        if (Array.isArray(responseVehicles.data)) {
          setVehicles(responseVehicles.data);
        } else if ((responseVehicles.data as any).vehicles && Array.isArray((responseVehicles.data as any).vehicles)) {
          setVehicles((responseVehicles.data as any).vehicles);
        } else {
          console.log("⚠️ Estructura de vehículos no reconocida:", responseVehicles.data);
          setVehicles([]);
        }
      } else {
        console.log("⚠️ No se pudieron cargar vehículos");
        setVehicles([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar datos del perfil:", error);
      setVehicles([]);
    }
  };

  useEffect(() => {
    getProfileData();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleChangeProfilePhoto = () => {
    console.log("Cambiar foto de perfil");
  };

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
      Alert.alert(
        "Error",
        "No se pudo cerrar sesión. Intenta nuevamente más tarde."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", onPress: confirmLogout }
      ]
    );
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
            "Tu cuenta se ha eliminado correctamente. Esperamos verte pronto.",
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
      const errorMessage =
        error instanceof Error ? error.message : "Error inesperado";
      Alert.alert("Error", errorMessage);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción no se puede deshacer. ¿Deseas continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: confirmDeleteAccount }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de Foto de Perfil */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profilePhotoContainer}
            onPress={handleChangeProfilePhoto}
            activeOpacity={0.8}
          >
            {userProfile.profile_picture ? (
              // Si tiene foto de perfil, mostrar la imagen
              <View style={styles.profilePhoto}>
                <Image
                  source={{ uri: userProfile.profile_picture }}
                  style={styles.profilePhoto}
                />
              </View>
            ) : (
              // Si no tiene foto, mostrar iniciales
              <View style={styles.profilePhoto}>
                <Text style={styles.profileInitials}>
                  {getInitials(userProfile.name)}
                </Text>
              </View>
            )}

            {/* Indicador de edición */}
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>

          {/* Información del usuario */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userEmail}>
              {userProfile.institutional_email}
            </Text>
          </View>

          {/* Indicador de conductor */}
          <View style={styles.driverBadge}>
            {/* ua */}
            <Text style={styles.driverBadgeText}>Conductor Verificado</Text>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.separator} />

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionHeader}>Acerca de</Text>
          <Text style={styles.descriptionText}>{userProfile.description}</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionHeader}>Vehículos</Text>
          {vehicles && vehicles.length > 0 ? (
            vehicles.map((vehicle, index) => (
              <View key={vehicle.id || index} style={styles.vehicleCard}>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleDetails}>
                    Año: {vehicle.year} • Patente: {vehicle.licence_plate}
                  </Text>
                  {vehicle.validation ? (
                    <View style={styles.validatedBadge}>
                      <Text style={styles.validatedText}>✓ Verificado</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingContainer}>
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingText}>⏳ Pendiente de verificación</Text>
                        </View>
                        
                        {/* ✅ Botón para validar con loading */}
                        <TouchableOpacity
                          style={[
                            styles.validateButton,
                            validatingVehicle === vehicle.id && styles.validateButtonDisabled
                          ]}
                          onPress={() => handleValidateVehicle(vehicle.id)}
                          disabled={validatingVehicle === vehicle.id}
                        >
                          {validatingVehicle === vehicle.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.validateButtonText}>Validar ahora</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noVehiclesText}>
              No hay vehículos registrados
            </Text>
          )}
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionHeader}>Editar perfil</Text>
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
    height: 59,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 11,
    backgroundColor: "#FFFFFF",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 18,
    lineHeight: 23,
    color: "#121417",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },

  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  profilePhotoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileInitials: {
    fontSize: 36,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#FFFFFF",
  },
  photoPlaceholder: {
    fontSize: 40,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F99F7C",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editIcon: {
    fontSize: 16,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 24,
    lineHeight: 30,
    color: "#121417",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 16,
    lineHeight: 24,
    color: "#61758A",
    marginBottom: 2,
  },
  userPhone: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "#61758A",
  },
  driverBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  driverBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  driverBadgeText: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 12,
    color: "#2E7D32",
  },
  separator: {
    height: 8,
    backgroundColor: "#F8F9FA",
  },

  menuSection: {
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuIcon: {
    fontSize: 24,
    width: 40,
    textAlign: "center",
  },
  menuText: {
    flex: 1,
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 16,
    color: "#121417",
    marginLeft: 12,
  },
  menuArrow: {
    fontSize: 24,
    color: "#61758A",
    fontWeight: "300",
  },

  // Estilos existentes
  profileButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#FFFFFF",
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
    height: 120,
  },
  descriptionContainer: {
    margin: 16,
    gap: 8,
  },
  descriptionHeader: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans-Bold",
    fontStyle: "normal",
    lineHeight: 26,
  },
  descriptionText: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 16,
    fontStyle: "normal",
    lineHeight: 24,
  },

  // Estilos para vehículos
  vehicleCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 18,
    color: "#121417",
    marginBottom: 4,
  },
  vehicleDetails: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 14,
    color: "#61758A",
    marginBottom: 8,
  },
  validatedBadge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  validatedText: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 12,
    color: "#2E7D32",
  },
  pendingBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FF9800",
  },
  pendingText: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 12,
    color: "#F57C00",
  },
  noVehiclesText: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 16,
    color: "#61758A",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 16,
  },
  refreshButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIcon: {
    fontSize: 20,
  },
  vehicleActions: {
    marginTop: 8,
  },
  pendingContainer: {
    gap: 8,
  },
  validateButton: {
    backgroundColor: "#F99F7C",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  validateButtonDisabled: {
    opacity: 0.6,
  },
  validateButtonText: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
});
