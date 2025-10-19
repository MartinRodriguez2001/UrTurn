import travelApiService from "@/Services/TravelApiService";
import VehicleApiService from "@/Services/VehicleApiService";
import { TravelCreateData } from "@/types/travel";
import { Vehicle } from "@/types/vehicle";
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

  // Estados del formulario
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    startDate: new Date(),
    startTime: (() => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Próxima hora en punto
      return nextHour;
    })(),
    endTime: (() => {
      const now = new Date();
      const twoHoursLater = new Date(now);
      twoHoursLater.setHours(now.getHours() + 2, 0, 0, 0); // 2 horas después
      return twoHoursLater;
    })(),
    seats: "",
    price: "",
  });

  // Estados para validación
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);

  // Estados para vehículos
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Estados para date/time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Cargar vehículos del usuario al iniciar
  useEffect(() => {
    loadUserVehicles();
  }, []);

  const loadUserVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await VehicleApiService.getUserVehicles();
      
      if (response.success && response.data) {
        console.log("🚗 Respuesta completa:", response.data);
        
        // Manejar tanto si viene un array directo como un objeto con vehicles
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

    // Validar destino
    if (!formData.destination.trim()) {
      newErrors.destination = "El destino es requerido";
    } else if (formData.destination.trim().length < 3) {
      newErrors.destination = "El destino debe tener al menos 3 caracteres";
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

    const endDateTime = new Date(formData.startDate);
    endDateTime.setHours(formData.endTime.getHours(), formData.endTime.getMinutes(), 0, 0);

    // El viaje debe empezar en el futuro (al menos 30 minutos)
    const minStartTime = new Date(now.getTime() + 30 * 60 * 1000);
    if (startDateTime < minStartTime) {
      newErrors.startTime = "El viaje debe programarse al menos 30 minutos en el futuro";
    }

    // La hora de fin debe ser después de la hora de inicio
    if (endDateTime <= startDateTime) {
      newErrors.endTime = "La hora de llegada debe ser posterior a la hora de partida";
    }

    // El viaje no puede durar más de 12 horas
    const maxDuration = 12 * 60 * 60 * 1000;
    if (endDateTime.getTime() - startDateTime.getTime() > maxDuration) {
      newErrors.endTime = "El viaje no puede durar más de 12 horas";
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

      const endDateTime = new Date(formData.startDate);
      endDateTime.setHours(formData.endTime.getHours(), formData.endTime.getMinutes(), 0, 0);

      const travelData: TravelCreateData = {
        start_location: formData.origin.trim(),
        end_location: formData.destination.trim(),
        capacity: parseInt(formData.seats),
        price: parseFloat(formData.price),
        start_time: startDateTime,
        end_time: endDateTime,
        spaces_available: parseInt(formData.seats),
        carId: selectedVehicle!.id,
      };

      console.log("🚗 Creando viaje:", travelData);

      const response = await travelApiService.createTravel(travelData);

      if (response.success) {
        Alert.alert(
          "¡Viaje publicado! 🎉",
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
      console.error("❌ Error al crear viaje:", error);
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
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newStartTime = new Date(selectedTime);
      
      setFormData(prev => {
        // Crear nueva hora de fin que sea al menos 30 minutos después
        const newEndTime = new Date(newStartTime);
        newEndTime.setMinutes(newStartTime.getMinutes() + 30);
        
        // Si la hora de fin actual es antes que la nueva hora de inicio + 30 min, actualizarla
        const currentEndHours = prev.endTime.getHours();
        const currentEndMinutes = prev.endTime.getMinutes();
        const currentEndTotalMinutes = currentEndHours * 60 + currentEndMinutes;
        
        const newStartTotalMinutes = newStartTime.getHours() * 60 + newStartTime.getMinutes();
        const newEndTotalMinutes = newEndTime.getHours() * 60 + newEndTime.getMinutes();
        
        return {
          ...prev,
          startTime: newStartTime,
          endTime: currentEndTotalMinutes <= newStartTotalMinutes ? newEndTime : prev.endTime
        };
      });
      
      // Limpiar errores relacionados
      if (errors.startTime) {
        setErrors(prev => ({ ...prev, startTime: "" }));
      }
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const newEndTime = new Date(selectedTime);
      setFormData(prev => ({ 
        ...prev, 
        endTime: newEndTime 
      }));
      
      // Limpiar error si existe
      if (errors.endTime) {
        setErrors(prev => ({ ...prev, endTime: "" }));
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

  // Agregar función helper para mostrar duración estimada
  const getEstimatedDuration = () => {
    const startTotalMinutes = formData.startTime.getHours() * 60 + formData.startTime.getMinutes();
    const endTotalMinutes = formData.endTime.getHours() * 60 + formData.endTime.getMinutes();
    
    if (endTotalMinutes > startTotalMinutes) {
      const durationMinutes = endTotalMinutes - startTotalMinutes;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}min`;
      } else {
        return `${minutes} minutos`;
      }
    }
    return "";
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
      >
        {/* Form Section */}
        <View style={styles.formSection}>
          
          {/* Route Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📍 Ruta del viaje</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Origen *</Text>
              <TextInput
                style={[styles.input, errors.origin && styles.inputError]}
                placeholder="Ej: Universidad de Chile, Facultad de Ingeniería"
                placeholderTextColor="#876363"
                value={formData.origin}
                onChangeText={(value) => updateField("origin", value)}
              />
              {errors.origin && <Text style={styles.errorText}>{errors.origin}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Destino *</Text>
              <TextInput
                style={[styles.input, errors.destination && styles.inputError]}
                placeholder="Ej: Mall Plaza Vespucio, Metro San Joaquín"
                placeholderTextColor="#876363"
                value={formData.destination}
                onChangeText={(value) => updateField("destination", value)}
              />
              {errors.destination && <Text style={styles.errorText}>{errors.destination}</Text>}
            </View>
          </View>

          {/* Date and Time Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🕒 Fecha y hora</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fecha del viaje *</Text>
              <TouchableOpacity
                style={[styles.input, styles.dateInput]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formatDate(formData.startDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Hora de partida *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput, errors.startTime && styles.inputError]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {formatTime(formData.startTime)}
                  </Text>
                </TouchableOpacity>
                {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Hora de llegada *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput, errors.endTime && styles.inputError]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {formatTime(formData.endTime)}
                  </Text>
                </TouchableOpacity>
                {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
              </View>
            </View>

            {/* Agregar información de duración */}
            {getEstimatedDuration() && (
              <View style={styles.durationContainer}>
                <Text style={styles.durationText}>
                  ⏱️ Duración estimada: {getEstimatedDuration()}
                </Text>
              </View>
            )}
          </View>

          {/* Trip Details Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🚗 Detalles del viaje</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehículo *</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectInput, errors.vehicle && styles.inputError]}
                onPress={() => setShowVehicleModal(true)}
              >
                <Text style={[
                  styles.selectText,
                  !selectedVehicle && styles.placeholderText
                ]}>
                  {selectedVehicle 
                    ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.licence_plate})`
                    : "Selecciona un vehículo"
                  }
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
                  placeholder="4"
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
                  placeholder="2500"
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
          onChange={onDateChange}
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 días
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={formData.startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={formData.endTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndTimeChange}
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
    backgroundColor: "#F5F0F0",
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Plus Jakarta Sans",
    color: "#121417",
    borderWidth: 1,
    borderColor: "transparent",
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
  dateInput: {
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    fontFamily: "Plus Jakarta Sans",
    color: "#121417",
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
  
  // Estilos para la duración
  durationContainer: {
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  durationText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#2E86AB",
    textAlign: "center",
    fontWeight: "500",
  },
});