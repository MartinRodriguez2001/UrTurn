import travelApiService from "@/Services/TravelApiService";
import { userApi } from "@/Services/UserApiService";
import VehicleApiService from "@/Services/VehicleApiService";
import { useAuth } from "@/context/authContext";
import { UserProfile } from "@/types/user";
import { Vehicle } from "@/types/vehicle";
import { Feather } from "@expo/vector-icons";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
  const [processingLogout, setProcessingLogout] = useState(false);
  const [processingDelete, setProcessingDelete] = useState(false);
  const [tripsCount, setTripsCount] = useState(0);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

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
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);

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
      const [response, responseVehicles, responseTravels] = await Promise.all([
        userApi.getProfile(),
        VehicleApiService.getUserVehicles(),
        travelApiService.getDriverTravels(),
      ]);
      
      console.log("👤 Perfil del usuario:", response);
      console.log("🚗 Vehículos respuesta:", responseVehicles);
      console.log("🧭 Viajes (driver) respuesta:", responseTravels);
      
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

      // Process driver travels to compute ratings and count finished trips
      try {
        const travels: any[] = (responseTravels as any)?.travels ?? (responseTravels as any)?.data?.travels ?? [];
        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let total = 0;
        let sum = 0;
        let finishedCount = 0;
        const profileId = response?.data?.id;

        if (Array.isArray(travels)) {
          for (const item of travels) {
            const travel = (item as any)?.travel ?? (item as any);

            // look for possible reviews arrays in travel
            const reviews = (travel && (travel.reviews || travel.driver_reviews || travel.reseñas || [])) as any[];
            if (Array.isArray(reviews) && reviews.length > 0) {
              for (const r of reviews) {
                // If review objects include a target, ensure it targets this driver
                const targetId = r?.user_target_id ?? r?.user_target?.id ?? r?.user_target ?? null;
                if (profileId && targetId !== null && Number(targetId) !== Number(profileId)) {
                  continue;
                }
                const star = Number(r.rating ?? r.stars ?? r.starts ?? r.value ?? NaN);
                if (!Number.isNaN(star) && star >= 1 && star <= 5) {
                  counts[Math.round(star)] = (counts[Math.round(star)] || 0) + 1;
                  total++;
                  sum += Number(star);
                }
              }
            }

            // fallback: some travels include driver_rating fields
            const fallbackRating = travel?.driver_rating ?? travel?.rating ?? undefined;
            if ((reviews === undefined || reviews.length === 0) && (fallbackRating !== undefined && fallbackRating !== null)) {
              const star = Math.round(Number(fallbackRating));
              if (!Number.isNaN(star) && star >= 1 && star <= 5) {
                counts[star] = (counts[star] || 0) + 1;
                total++;
                sum += Number(fallbackRating);
              }
            }

            // Count finished trips. Try common status fields like 'finalizado' or 'finished'
            const status = (travel && (travel.status ?? travel.state ?? travel.travel_status)) || undefined;
            if (typeof status === 'string' && (status.toLowerCase() === 'finalizado' || status.toLowerCase() === 'finished')) {
              finishedCount++;
            }
          }
        }

        // If we found no reviews in travels, attempt a gentle fallback: fetch user's received reviews directly from the reviews API
        if (total === 0 && profileId) {
          try {
            const reviewService = (await import('@/Services/ReviewApiService')).default;
            const userReviewsRes = await reviewService.getUserReviews(profileId).catch(() => null);
            const reviewsArr = (userReviewsRes && (userReviewsRes as any).data && (userReviewsRes as any).data.received) || [];
            if (Array.isArray(reviewsArr) && reviewsArr.length > 0) {
              // reset counts and recount from received reviews
              const counts2: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
              let total2 = 0;
              let sum2 = 0;
              for (const r of reviewsArr) {
                const rating = Number(r.starts ?? r.stars ?? r.rating ?? NaN);
                if (!Number.isNaN(rating) && rating >= 1 && rating <= 5) {
                  counts2[Math.round(rating)] = (counts2[Math.round(rating)] || 0) + 1;
                  total2++;
                  sum2 += Number(rating);
                }
              }
              // apply the counts from reviews API
              Object.assign(counts, counts2);
              total = total2;
              sum = sum2;
            }
          } catch (e) {
            // ignore fallback errors
            console.warn('⚠️ Error al intentar fallback de reseñas desde ReviewApiService', e);
          }
        }

        setRatingCounts(counts);
        setTotalReviews(total);
        setAverageRating(total > 0 ? sum / total : null);
        setTripsCount(finishedCount);
      } catch (err) {
        console.log("⚠️ No se pudieron procesar las reseñas de viajes:", err);
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

  const openSettingsPlaceholder = (
    title: string,
    description: string,
    context?: string,
  ) => {
    router.push({
      pathname: "/settings/placeholder",
      params: { title, description, context },
    });
  };

  const handleChangeProfilePhoto = () => {
    openSettingsPlaceholder(
      "Editar foto de perfil",
      "Podrás actualizar tu foto para que pasajeros y conductores te reconozcan fácilmente.",
      "Incluiremos un selector de imágenes con recorte automático y verificación de identidad.",
    );
  };

  const executeLogout = async () => {
    try {
      setProcessingLogout(true);
      await logout();
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

    const performLogout = async () => {
      await executeLogout();
      router.replace("/ChooseModeScreen");
    };

    Alert.alert(
      "Cerrar sesión",
      "¿Quieres cerrar sesión para ingresar con otra cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: performLogout,
        },
      ]
    );
  };

  const deleteAccount = async () => {
    if (!userProfile?.id) {
      Alert.alert("Error", "No se pudo obtener la información de la cuenta.");
      return;
    }

    try {
      setProcessingDelete(true);

      if (userProfile.IsDriver && vehicles.length > 0) {
        for (const vehicle of vehicles) {
          if (!vehicle?.id) continue;
          const deleteVehicleRes = await VehicleApiService.deleteVehicle(
            vehicle.id
          );
          if (!deleteVehicleRes.success) {
            throw new Error(
              deleteVehicleRes.message ||
                "No se pudo eliminar un vehículo asociado."
            );
          }
        }
      }

      const response = await userApi.deleteUser(userProfile.id);
      if (!response.success) {
        throw new Error(
          response.message || "No se pudo eliminar la cuenta. Inténtalo luego."
        );
      }

      await logout();
      Alert.alert("Cuenta eliminada", "Tu cuenta se eliminó correctamente.");
      router.replace("/ChooseModeScreen");
    } catch (error) {
      console.error("❌ Error al eliminar la cuenta:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Ocurrió un error al eliminar la cuenta. Intenta nuevamente."
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
      "Esto eliminará tu cuenta, tus vehículos registrados y toda tu información. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: deleteAccount,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color="#121417" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Feather name="settings" size={22} color="#121417" />
        </TouchableOpacity>
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
              <Feather name="edit-2" size={16} color="#F99F7C" />
            </View>
          </TouchableOpacity>

          {/* Información del usuario */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userEmail}>
              {userProfile.institutional_email}
            </Text>
            <Text style={styles.userStats}>{tripsCount} viajes</Text>
          </View>

          {/* Indicador de conductor */}
          <View style={styles.driverBadge}>
            <Feather name="shield" size={16} color="#2E7D32" />
            <Text style={styles.driverBadgeText}>Conductor Verificado</Text>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.separator} />

        <View style={styles.descriptionContainer}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={20} color="#F99F7C" />
            <Text style={styles.descriptionHeader}>Acerca de</Text>
          </View>
          <Text style={styles.descriptionText}>{userProfile.description}</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <View style={styles.sectionHeader}>
            <Feather name="truck" size={20} color="#F99F7C" />
            <Text style={styles.descriptionHeader}>Vehículos</Text>
          </View>
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
                      <Feather name="check-circle" size={12} color="#2E7D32" />
                      <Text style={styles.validatedText}>Verificado</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingContainer}>
                        <View style={styles.pendingBadge}>
                          <Feather name="clock" size={12} color="#F57C00" />
                          <Text style={styles.pendingText}>Pendiente de verificación</Text>
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
                            <View style={styles.validateButtonContent}>
                              <Feather name="check" size={12} color="#FFFFFF" />
                              <Text style={styles.validateButtonText}>Validar ahora</Text>
                            </View>
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

        {/* Reviews Section */}
        <View style={styles.descriptionContainer}>
          <View style={styles.sectionHeader}>
            <Feather name="message-circle" size={20} color="#F99F7C" />
            <Text style={styles.descriptionHeader}>Reseñas</Text>
          </View>

          <View style={styles.ratingOverview}>
            <View style={styles.ratingSummary}>
              <Text style={styles.ratingNumber}>{averageRating ? averageRating.toFixed(2) : '0.0'}</Text>
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
              <Text style={styles.ratingCount}>{totalReviews} reviews</Text>
            </View>

            <View style={styles.ratingBreakdown}>
              {[5, 4, 3, 2, 1].map((star) => (
                <View key={star} style={styles.ratingBar}>
                  <Text style={styles.ratingLabel}>{star}</Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: totalReviews ? `${Math.round((ratingCounts[star] || 0) / totalReviews * 100)}%` : '0%' }]} />
                  </View>
                  <Text style={styles.ratingPercentage}>{totalReviews ? `${Math.round((ratingCounts[star] || 0) / totalReviews * 100)}%` : '0%'}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de Configuración */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Feather name="x" size={24} color="#121417" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Configuración</Text>
            <View style={styles.modalSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Sección General */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>General</Text>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Editar perfil",
                    "Pronto podrás actualizar tu información personal directamente desde la aplicación.",
                    "Podrás cambiar tu descripción, foto y datos de contacto que ven los pasajeros.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="user" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Editar perfil</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Notificaciones",
                    "Administra qué alertas recibes en tu teléfono o PWA.",
                    "Configura avisos para solicitudes de viaje, chat y publicaciones confirmadas.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="bell" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Notificaciones</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Privacidad",
                    "Decide qué información del conductor es visible para los pasajeros.",
                    "Incluiremos controles para mostrar u ocultar datos personales y reseñas.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="shield" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Privacidad</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>
            </View>

            {/* Sección Conductor */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Conductor</Text>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Gestionar vehículos",
                    "Desde aquí administrarás tus autos registrados en UrTurn.",
                    "Podrás agregar, editar o eliminar vehículos y subir documentación.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="truck" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Gestionar vehículos</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Historial de viajes",
                    "Consulta el detalle de tus viajes como conductor.",
                    "Incluiremos filtros por fecha, ganancias e historial de pasajeros.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="map" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Historial de viajes</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Ganancias",
                    "Supervisa tus ingresos como conductor dentro de la app.",
                    "Podrás ver resúmenes semanales, exportar reportes y registrar pagos recibidos.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="dollar-sign" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Ganancias</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>
            </View>

            {/* Sección Ayuda */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Ayuda y soporte</Text>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Centro de ayuda",
                    "Accede a artículos y preguntas frecuentes para resolver dudas.",
                    "Incluiremos tutoriales, políticas de seguridad y guías para publicar viajes.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="help-circle" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Centro de ayuda</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Contactar soporte",
                    "Habla con el equipo de UrTurn para obtener asistencia personalizada.",
                    "Podrás levantar tickets, adjuntar fotos y hacer seguimiento a incidentes.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="message-circle" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Contactar soporte</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Términos y condiciones",
                    "Revisa el detalle legal del servicio y tus obligaciones como conductor.",
                    "Mostraremos enlaces actualizados con las políticas que aceptas al utilizar UrTurn.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="file-text" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Términos y condiciones</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  openSettingsPlaceholder(
                    "Política de privacidad",
                    "Conoce cómo tratamos tus datos personales y de viaje.",
                    "Incluiremos información sobre retención de datos, seguridad y derechos ARCO.",
                  )
                }
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    <Feather name="lock" size={20} color="#F99F7C" />
                  </View>
                  <Text style={styles.modalOptionText}>Política de privacidad</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#61758A" />
              </TouchableOpacity>
            </View>

            {/* Sección Sesión */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Sesión</Text>
              
              <TouchableOpacity 
                style={[styles.modalOption, (processingLogout || processingDelete) && styles.disabledOption]}
                onPress={handleLogout}
                disabled={processingLogout || processingDelete}
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    {processingLogout ? (
                      <ActivityIndicator size="small" color="#F99F7C" />
                    ) : (
                      <Feather name="log-out" size={20} color="#F99F7C" />
                    )}
                  </View>
                  <Text style={[styles.modalOptionText, { color: '#F99F7C' }]}>
                    Cerrar sesión
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#F99F7C" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalOption, (processingDelete || processingLogout) && styles.disabledOption]}
                onPress={handleDeleteAccount}
                disabled={processingDelete || processingLogout}
              >
                <View style={styles.modalOptionContent}>
                  <View style={styles.settingsItemIcon}>
                    {processingDelete ? (
                      <ActivityIndicator size="small" color="#E53935" />
                    ) : (
                      <Feather name="trash-2" size={20} color="#E53935" />
                    )}
                  </View>
                  <Text style={[styles.modalOptionText, { color: '#E53935' }]}>
                    Eliminar cuenta
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBottomSpacer} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerSpacer: {
    width: 48,
  },
  settingsButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
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
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
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
    gap: 6,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  descriptionHeader: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans-Bold",
    fontStyle: "normal",
    lineHeight: 26,
    color: "#121417",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  validateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  validateButtonDisabled: {
    opacity: 0.6,
  },
  validateButtonText: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  // Rating / Reviews styles
  ratingOverview: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 32,
  },
  ratingSummary: {
    alignItems: 'center',
    width: 98,
    marginTop: 18
  },
  ratingNumber: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '800',
    fontSize: 36,
    lineHeight: 45,
    color: '#121417',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 2,
  },
  star: { 
    fontSize: 18 
  },
  ratingCount: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#121417',
  },
  ratingBreakdown: {
    flex: 1,
    gap: 12,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#121417',
    width: 20,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#DBE0E5',
    borderRadius: 4,
  },
  bar: {
    height: '100%',
    backgroundColor: '#000000ff',
    borderRadius: 4,
  },
  ratingPercentage: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#61758A',
    width: 40,
    textAlign: 'right',
  },
  userStats: { 
    fontFamily: "PlusJakartaSans-Regular", 
    fontSize: 14, 
    color: "#61758A", 
    marginTop: 4 
  },

  // Estilos para la Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor: "#FFFFFF",
  },
  modalCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  modalSpacer: {
    width: 48,
  },
  modalContent: {
    flex: 1,
  },
  modalSection: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  modalSectionTitle: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 16,
    lineHeight: 20,
    color: "#61758A",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  modalOptionText: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 16,
    lineHeight: 20,
    color: "#121417",
  },
  disabledOption: {
    opacity: 0.6,
  },
  modalBottomSpacer: {
    height: 40,
  },

});
