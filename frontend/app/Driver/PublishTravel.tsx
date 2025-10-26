import type { MapCoordinate } from "@/components/passenger/PassengerMap.types";
import TravelRouteSection from "@/components/travel/TravelRouteSection";
import TravelScheduleSection from "@/components/travel/TravelScheduleSection";
import travelApiService from "@/Services/TravelApiService";
import VehicleApiService from "@/Services/VehicleApiService";
import { TravelCreateData } from "@/types/travel";
import { Vehicle } from "@/types/vehicle";
import { resolveGoogleMapsApiKey } from "@/utils/googleMaps";
import { decodePolyline } from "@/utils/polyline";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PublishTravel() {
  const router = useRouter();

  const [originCoordinate, setOriginCoordinate] = useState<MapCoordinate | null>(null);
  const [destinationCoordinate, setDestinationCoordinate] = useState<MapCoordinate | null>(null);
  const [routeWaypoints, setRouteWaypoints] = useState<MapCoordinate[] | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    startDate: new Date(),
    startTime: (() => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Pr�xima hora en punto
      return nextHour;
    })(),
    seats: "",
    price: "",
  });

  // Estados para validación
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const googleMapsApiKey = resolveGoogleMapsApiKey();
  const [loading, setLoading] = useState(false);

  // Estados para vehículos
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Estados para date/time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);

  useEffect(() => {
    loadUserVehicles();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const computeRoute = async () => {
      if (!originCoordinate || !destinationCoordinate) {
        if (!cancelled) {
          setRouteWaypoints(null);
          setRouteError(null);
        }
        return;
      }

      const fallbackRoute: MapCoordinate[] = [
        { latitude: originCoordinate.latitude, longitude: originCoordinate.longitude },
        { latitude: destinationCoordinate.latitude, longitude: destinationCoordinate.longitude },
      ];

      const trimmedKey = googleMapsApiKey?.trim();
      if (!trimmedKey) {
        if (!cancelled) {
          setRouteWaypoints(fallbackRoute);
          setRouteError(null);
        }
        return;
      }

      try {
        if (!cancelled) {
          setIsFetchingRoute(true);
          setRouteError(null);
        }

        const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
        url.searchParams.set(
          "origin",
          `${originCoordinate.latitude},${originCoordinate.longitude}`
        );
        url.searchParams.set(
          "destination",
          `${destinationCoordinate.latitude},${destinationCoordinate.longitude}`
        );
        url.searchParams.set("mode", "driving");
        url.searchParams.set("language", "es");
        url.searchParams.set("key", trimmedKey);

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Directions API error: ${response.status}`);
        }

        const data: {
          status: string;
          routes?: Array<{ overview_polyline?: { points?: string } }>;
        } = await response.json();

        if (data.status !== "OK" || !Array.isArray(data.routes) || data.routes.length === 0) {
          throw new Error(`Directions API status: ${data.status ?? "UNKNOWN"}`);
        }

        const overviewPolyline = data.routes[0]?.overview_polyline?.points;
        const decoded = decodePolyline(overviewPolyline).map<MapCoordinate>((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
        }));

        const candidateRoute =
          decoded.length >= 2
            ? decoded
            : fallbackRoute;

        if (!cancelled) {
          setRouteWaypoints(candidateRoute);
        }
      } catch (error) {
        console.error("Error fetching driving route:", error);
        if (!cancelled) {
          setRouteWaypoints(fallbackRoute);
          setRouteError(
            "No se pudo calcular la ruta automática. Se usará la trayectoria directa entre origen y destino."
          );
        }
      } finally {
        if (!cancelled) {
          setIsFetchingRoute(false);
        }
      }
    };

    void computeRoute();

    return () => {
      cancelled = true;
    };
  }, [originCoordinate, destinationCoordinate, googleMapsApiKey]);

  const loadUserVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await VehicleApiService.getUserVehicles();
      
      if (response.success && response.data) {
      
        let vehiclesList: Vehicle[];
        if (Array.isArray(response.data)) {
          vehiclesList = response.data;
        } else if (response.data && typeof response.data === 'object' && 'vehicles' in response.data) {
          vehiclesList = (response.data as any).vehicles;
        } else {
          vehiclesList = [];
        }
        
        const validatedVehicles = vehiclesList.filter(
          (vehicle: Vehicle) => vehicle.id && vehicle.licence_plate
        );
        setVehicles(validatedVehicles);
        
        // Seleccionar el primer vehículo por defecto si existe
        if (validatedVehicles.length > 0) {
          setSelectedVehicle(validatedVehicles[0]);
        }
      } else {
        Alert.alert(
          "Sin vehículos",
          "No tienes vehículos registrados. Primero debes registrar un vehículo.",
          [
            {
              text: "Registrar vehículo",
              onPress: () => router.push("/Passenger/DriverRegister"),
            },
            {
              text: "Volver",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error loading vehicles:", error);
      Alert.alert("Error", "No se pudieron cargar tus vehículos");
    } finally {
      setLoadingVehicles(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error si existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
  const newErrors: {[key: string]: string} = {};

    // Validar origen
    if (!formData.origin.trim()) {
      newErrors.origin = "El origen es requerido";
    } else if (formData.origin.trim().length < 3) {
      newErrors.origin = "El origen debe tener al menos 3 caracteres";
    }
    if (!originCoordinate) {
      newErrors.origin = "Debes seleccionar un punto de partida en el mapa";
    }

    // Validar destino
    if (!formData.destination.trim()) {
      newErrors.destination = "El destino es requerido";
    } else if (formData.destination.trim().length < 3) {
      newErrors.destination = "El destino debe tener al menos 3 caracteres";
    }
    if (!destinationCoordinate) {
      newErrors.destination = "Debes seleccionar un destino en el mapa";
    }

    // Validar que origen y destino sean diferentes
    if (formData.origin.trim() && formData.destination.trim() && 
        formData.origin.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
      newErrors.destination = "El origen y destino no pueden ser iguales";
    }

    // Validar asientos
    const seatsNum = parseInt(formData.seats);
    if (!formData.seats.trim()) {
      newErrors.seats = "Los asientos disponibles son requeridos";
    } else if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 8) {
      newErrors.seats = "Los asientos deben ser entre 1 y 8";
    }

    // Validar precio
    const priceNum = parseFloat(formData.price);
    if (!formData.price.trim()) {
      newErrors.price = "El precio es requerido";
    } else if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = "El precio debe ser un número positivo";
    } else if (priceNum > 50000) {
      newErrors.price = "El precio no puede exceder $50,000";
    }

    // Validar vehículo
    if (!selectedVehicle) {
      newErrors.vehicle = "Debes seleccionar un vehículo";
    }

    // Validar fechas
    const now = new Date();
    const startDateTime = new Date(formData.startDate);
    startDateTime.setHours(formData.startTime.getHours(), formData.startTime.getMinutes(), 0, 0);

    if (!formData.startDate) {
      newErrors.startDate = "La fecha del viaje es requerida";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Debes seleccionar una hora de partida";
    }

    // El viaje debe empezar en el futuro (al menos 30 minutos)
    const minStartTime = new Date(now.getTime() + 30 * 60 * 1000);
    if (startDateTime < minStartTime) {
      newErrors.startTime = "El viaje debe programarse al menos 30 minutos en el futuro";
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublishTravel = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor corrige los errores en el formulario");
      return;
    }

    setLoading(true);

    try {
      // Crear objetos Date completos
      const startDateTime = new Date(formData.startDate);
      startDateTime.setHours(formData.startTime.getHours(), formData.startTime.getMinutes(), 0, 0);

      const travelDate = new Date(startDateTime);
      travelDate.setHours(0, 0, 0, 0);

      const fallbackRoute: MapCoordinate[] = [
        { latitude: originCoordinate!.latitude, longitude: originCoordinate!.longitude },
        { latitude: destinationCoordinate!.latitude, longitude: destinationCoordinate!.longitude },
      ];

      const effectiveRoute =
        routeWaypoints && routeWaypoints.length >= 2 ? routeWaypoints : fallbackRoute;

      const travelData: TravelCreateData = {
        start_location_name: formData.origin.trim(),
        start_latitude: originCoordinate!.latitude,
        start_longitude: originCoordinate!.longitude,
        end_location_name: formData.destination.trim(),
        end_latitude: destinationCoordinate!.latitude,
        end_longitude: destinationCoordinate!.longitude,
        routeWaypoints: effectiveRoute.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
        })),
        travel_date: travelDate,
        capacity: parseInt(formData.seats),
        price: parseFloat(formData.price),
        start_time: startDateTime,
        spaces_available: parseInt(formData.seats),
        carId: selectedVehicle!.id,
      };

      console.log("Creando viaje:", travelData);

      const response = await travelApiService.createTravel(travelData);

      if (response.success) {
        Alert.alert(
          "Viaje publicado!",
          "Tu viaje ha sido publicado exitosamente y ya está disponible para que otros usuarios se unan.",
          [
            {
              text: "Ver mis viajes",
              onPress: () => router.replace("/Driver/DriverHomePage"),
            },
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Error al publicar el viaje");
      }

    } catch (error) {
      console.error("Error al crear viaje:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor. Verifica tu conexión a internet."
      );
    } finally {
      setLoading(false);
    }
  };

  // Funciones para date/time pickers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, startDate: selectedDate }));

      if (errors.startDate) {
        setErrors(prev => ({ ...prev, startDate: "" }));
      }

      if (errors.startTime) {
        setErrors(prev => ({ ...prev, startTime: "" }));
      }
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newStartTime = new Date(selectedTime);
      setFormData(prev => ({
        ...prev,
        startTime: newStartTime,
      }));

      if (errors.startTime) {
        setErrors(prev => ({ ...prev, startTime: "" }));
      }
    }
  };

  // Formatear fecha y hora para mostrar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleItem}
      onPress={() => {
        setSelectedVehicle(item);
        setShowVehicleModal(false);
      }}
    >
      <Text style={styles.vehicleText}>
        {item.brand} {item.model} ({item.year})
      </Text>
      <Text style={styles.licensePlateText}>
        Patente: {item.licence_plate}
      </Text>
    </TouchableOpacity>
  );

  if (loadingVehicles) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F99F7C" />
          <Text style={styles.loadingText}>Cargando vehículos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Publicar viaje</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Route Section */}
          <View style={styles.sectionContainer}>
            <TravelRouteSection
              originValue={formData.origin}
              destinationValue={formData.destination}
              originCoordinateValue={originCoordinate}
              destinationCoordinateValue={destinationCoordinate}
              onOriginCoordinateChange={setOriginCoordinate}
              onDestinationCoordinateChange={setDestinationCoordinate}
              onChangeOrigin={(value) => updateField("origin", value)}
              onChangeDestination={(value) => updateField("destination", value)}
              originError={errors.origin}
              destinationError={errors.destination}
              originPlaceholder="Ingresa tu punto de partida"
              destinationPlaceholder="Ingresa tu destino"
              googleMapsApiKey={googleMapsApiKey}
            />
            {isFetchingRoute ? (
              <Text style={styles.routeInfoText}>
                Calculando ruta sugerida...
              </Text>
            ) : null}
            {routeError ? <Text style={styles.routeWarningText}>{routeError}</Text> : null}
          </View>

          {/* Date and Time Section */}
          <View style={styles.sectionContainer}>
            <TravelScheduleSection
              title="🕒 Fecha y hora"
              dateLabel="Fecha del viaje *"
              timeLabel="Hora de partida *"
              dateValue={formatDate(formData.startDate)}
              timeValue={formatTime(formData.startTime)}
              onPressDate={() => setShowDatePicker(true)}
              onPressTime={() => setShowStartTimePicker(true)}
              dateError={errors.startDate}
              timeError={errors.startTime}
            />
          </View>

          {/* Trip Details Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🚗 Detalles del viaje</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehículo *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.selectInput, errors.vehicle && styles.inputError]}
                  onPress={() => setShowVehicleModal(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      !selectedVehicle && styles.placeholderText,
                    ]}
                  >
                    {selectedVehicle
                      ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.licence_plate})`
                      : "Selecciona un vehículo"}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
                {errors.vehicle && <Text style={styles.errorText}>{errors.vehicle}</Text>}
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Asientos disponibles *</Text>
                  <TextInput
                    style={[styles.input, errors.seats && styles.inputError]}
                    placeholder="Ingresa Asientos"
                    placeholderTextColor="#876363"
                    value={formData.seats}
                    onChangeText={(value) => updateField("seats", value)}
                    keyboardType="numeric"
                    maxLength={1}
                  />
                  {errors.seats && <Text style={styles.errorText}>{errors.seats}</Text>}
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Precio por persona *</Text>
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    placeholder="Ingresa Precio"
                    placeholderTextColor="#876363"
                    value={formData.price}
                    onChangeText={(value) => updateField("price", value)}
                    keyboardType="numeric"
                  />
                  {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Publish Button */}
      <View style={styles.publishButtonContainer}>
        <TouchableOpacity 
          style={[styles.publishButton, loading && styles.publishButtonDisabled]}
          onPress={handlePublishTravel}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingButtonContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={[styles.publishButtonText, { marginLeft: 8 }]}>
                Publicando...
              </Text>
            </View>
          ) : (
            <Text style={styles.publishButtonText}>Publicar Viaje</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          textColor={Platform.OS === 'ios' ? '#121417' : undefined}
          onChange={onDateChange}
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 d?as
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={formData.startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          textColor={Platform.OS === 'ios' ? '#121417' : undefined}
          onChange={onStartTimeChange}
        />
      )}
      {/* Vehicle Selection Modal */}
      <Modal
        visible={showVehicleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Vehículo</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVehicleModal(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={vehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.vehicleList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    color: "#61758A",
  },
  header: {
    height: 59,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 11,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#121417",
    fontWeight: "bold",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 23,
    color: "#121417",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  formSection: {
    flex: 1,
    paddingTop: 20,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 24,
    color: "#121417",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 21,
    color: "#121417",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FDF8F5",
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Plus Jakarta Sans",
    color: "#121417",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputError: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  errorText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#FF6B6B",
    marginTop: 4,
  },
  routeInfoText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#61758A",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  routeWarningText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#B45309",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 16,
    fontFamily: "Plus Jakarta Sans",
    color: "#121417",
    flex: 1,
  },
  placeholderText: {
    color: "#876363",
  },
  dropdownIcon: {
    fontSize: 16,
    color: "#61758A",
    marginLeft: 8,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  publishButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  publishButton: {
    backgroundColor: "#F99F7C",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  loadingButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Estilos para modal de vehículos
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "60%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    color: "#121417",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 24,
    color: "#61758A",
    fontWeight: "300",
  },
  vehicleList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  vehicleItem: {
    paddingVertical: 16,
  },
  vehicleText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "600",
    color: "#121417",
    marginBottom: 4,
  },
  licensePlateText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
  },
  separator: {
    height: 1,
    backgroundColor: "#F8F9FA",
  },
});

