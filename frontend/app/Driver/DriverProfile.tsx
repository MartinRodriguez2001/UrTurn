import reviewApiService from "@/Services/ReviewApiService";
import statsApiService from "@/Services/StatsApiService";
import travelApiService from "@/Services/TravelApiService";
import { userApi } from "@/Services/UserApiService";
import VehicleApiService from "@/Services/VehicleApiService";
import { UserProfile } from "@/types/user";
import { Vehicle } from "@/types/vehicle";
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [validatingVehicle, setValidatingVehicle] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);

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

  // Estados para rating y estadísticas
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });
  const [driverStats, setDriverStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    totalEarnings: 0,
    totalPassengersTransported: 0
  });
  const [recentTravels, setRecentTravels] = useState<any[]>([]);

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
      setLoading(true);

      // Hacer todas las llamadas en paralelo usando la Opción 3
      const [response, responseVehicles, reviewsResponse, statsResponse, travelsResponse] = await Promise.all([
        userApi.getProfile(),
        VehicleApiService.getUserVehicles(),
        reviewApiService.getMyReviews(),
        statsApiService.getMyStats(),
        travelApiService.getDriverTravels()
      ]);

      console.log("👤 Perfil del usuario:", response);
      console.log("🚗 Vehículos respuesta:", responseVehicles);
      console.log("⭐ Reviews respuesta:", reviewsResponse);
      console.log("📊 Stats respuesta:", statsResponse);
      console.log("🚗 Travels respuesta:", travelsResponse);

      // Procesar datos del perfil básico
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

      // Procesar vehículos
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

      // Procesar reviews y calificación promedio
      if (reviewsResponse?.success && reviewsResponse.data) {
        const reviewData = reviewsResponse.data;
        setAverageRating(reviewData.stats.averageRating);
        setTotalReviews(reviewData.stats.totalReceived);
        setRatingDistribution(reviewData.stats.ratingDistribution);
      }

      // Procesar estadísticas de conductor
      if (statsResponse?.success && statsResponse.data) {
        const statsData = statsResponse.data;
        setDriverStats({
          totalTrips: statsData.asDriver.totalTrips,
          completedTrips: statsData.asDriver.completedTrips,
          totalEarnings: statsData.asDriver.totalEarnings,
          totalPassengersTransported: statsData.asDriver.totalPassengersTransported
        });
      }

      // Procesar historial de viajes (tomar los 5 más recientes)
      if (travelsResponse?.success && travelsResponse.travels) {
        const sortedTravels = travelsResponse.travels
          .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
          .slice(0, 5);
        setRecentTravels(sortedTravels);
      }

    } catch (error) {
      console.error("❌ Error al cargar datos del perfil:", error);
      setVehicles([]);
    } finally {
      setLoading(false);
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

  const renderStars = (rating: number | null) => {
    if (rating === null) return "Sin calificaciones";

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <Text key={`full-${i}`} style={styles.starIcon}>⭐</Text>
        ))}
        {hasHalfStar && <Text style={styles.starIcon}>⭐</Text>}
        {[...Array(emptyStars)].map((_, i) => (
          <Text key={`empty-${i}`} style={styles.starIconEmpty}>☆</Text>
        ))}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleChangeProfilePhoto = () => {
    console.log("Cambiar foto de perfil");
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
            <Text style={styles.driverBadgeText}>Conductor Verificado</Text>
          </View>

          {/* Calificación promedio */}
          {loading ? (
            <ActivityIndicator size="small" color="#F99F7C" style={{ marginTop: 16 }} />
          ) : (
            <View style={styles.ratingSection}>
              {renderStars(averageRating)}
              <Text style={styles.totalReviewsText}>
                ({totalReviews} {totalReviews === 1 ? 'calificación' : 'calificaciones'})
              </Text>
            </View>
          )}
        </View>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Estadísticas de Conductor */}
        {!loading && driverStats.totalTrips > 0 && (
          <>
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionHeader}>Estadísticas</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{driverStats.completedTrips}</Text>
                  <Text style={styles.statLabel}>Viajes Completados</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{driverStats.totalPassengersTransported}</Text>
                  <Text style={styles.statLabel}>Pasajeros Transportados</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{formatCurrency(driverStats.totalEarnings)}</Text>
                  <Text style={styles.statLabel}>Ganancias Totales</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{driverStats.totalTrips}</Text>
                  <Text style={styles.statLabel}>Total Viajes</Text>
                </View>
              </View>
            </View>
            <View style={styles.separator} />
          </>
        )}

        {/* Historial de Viajes Recientes */}
        {!loading && recentTravels.length > 0 && (
          <>
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionHeader}>Viajes Recientes</Text>
              {recentTravels.map((travel, index) => (
                <View key={travel.id || index} style={styles.travelCard}>
                  <View style={styles.travelHeader}>
                    <View style={styles.travelRoute}>
                      <Text style={styles.travelLocation}>{travel.start_location}</Text>
                      <Text style={styles.travelArrow}>→</Text>
                      <Text style={styles.travelLocation}>{travel.end_location}</Text>
                    </View>
                    <View style={[
                      styles.travelStatusBadge,
                      travel.status === 'finalizado' && styles.statusFinished,
                      travel.status === 'confirmado' && styles.statusConfirmed,
                      travel.status === 'cancelado' && styles.statusCanceled
                    ]}>
                      <Text style={styles.travelStatusText}>
                        {travel.status === 'finalizado' ? 'Finalizado' :
                         travel.status === 'confirmado' ? 'Confirmado' :
                         travel.status === 'cancelado' ? 'Cancelado' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.travelDetails}>
                    <Text style={styles.travelDate}>📅 {formatDate(travel.start_time)}</Text>
                    <Text style={styles.travelPrice}>💰 {formatCurrency(travel.price)}</Text>
                    <Text style={styles.travelPassengers}>
                      👥 {travel.stats?.confirmedPassengers || 0}/{travel.capacity}
                    </Text>
                  </View>
                  {travel.stats?.averageRating && (
                    <View style={styles.travelRating}>
                      {renderStars(travel.stats.averageRating)}
                    </View>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.separator} />
          </>
        )}

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

  // Estilos para rating y estrellas
  ratingSection: {
    marginTop: 16,
    alignItems: "center",
    gap: 4,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  starIcon: {
    fontSize: 20,
  },
  starIconEmpty: {
    fontSize: 20,
    color: "#E0E0E0",
  },
  ratingText: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 18,
    color: "#121417",
    marginLeft: 8,
  },
  totalReviewsText: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 14,
    color: "#61758A",
  },

  // Estilos para estadísticas
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  statNumber: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 24,
    color: "#F99F7C",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 12,
    color: "#61758A",
    textAlign: "center",
  },

  // Estilos para historial de viajes
  travelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  travelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  travelRoute: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  travelLocation: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 14,
    color: "#121417",
  },
  travelArrow: {
    fontSize: 14,
    color: "#61758A",
  },
  travelStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  statusFinished: {
    backgroundColor: "#E8F5E8",
  },
  statusConfirmed: {
    backgroundColor: "#E3F2FD",
  },
  statusCanceled: {
    backgroundColor: "#FFEBEE",
  },
  travelStatusText: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 11,
    color: "#61758A",
  },
  travelDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  travelDate: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 12,
    color: "#61758A",
  },
  travelPrice: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 12,
    color: "#F99F7C",
  },
  travelPassengers: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 12,
    color: "#61758A",
  },
  travelRating: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
});
