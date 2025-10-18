import { fetchCarMakes, fetchCarModels } from "@/app/utils/carsGet";
import { useDriverStatus } from "@/hooks/useDriverStatus";
import VehicleApiService from "@/Services/VehicleApiService";
import { VehicleFormData } from "@/types/vehicle";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface CarMake {
  Make_ID: number;
  Make_Name: string;
}

interface CarModel {
  Model_ID: number;
  Model_Name: string;
  Make_ID: number;
}

export default function DriverRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { canAccessDriverMode, loading: driverStatusLoading, refreshStatus } = useDriverStatus();
  
  // Estados para marcas y modelos
  const [carMakes, setCarMakes] = useState<CarMake[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedMakeId, setSelectedMakeId] = useState<number | null>(null);
  
  // Estados para los modales
  const [showMakeModal, setShowMakeModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  
  const [formData, setFormData] = useState<VehicleFormData>({
    licence_plate: "",
    brand: "",
    model: "",
    year: "",
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Verificar estado del driver al cargar
  useEffect(() => {
    refreshStatus();
  }, []);

  // Redirigir si ya puede acceder al modo driver
  useEffect(() => {
    if (!driverStatusLoading && canAccessDriverMode) {
      router.replace("/Driver/DriverHomePage");
    }
  }, [driverStatusLoading, canAccessDriverMode, router]);

  // Cargar marcas al iniciar el componente
  useEffect(() => {
    loadCarMakes();
  }, []);

  // Función para cargar marcas de autos desde la API
  const loadCarMakes = async () => {
    setLoadingMakes(true);
    try {
      console.log("🚗 Cargando marcas de autos...");
      const makes = await fetchCarMakes();
      
      // Filtrar marcas más comunes para Chile y ordenar alfabéticamente
      const commonMakeNames = [
        'TOYOTA', 'HYUNDAI', 'CHEVROLET', 'NISSAN', 'KIA', 'HONDA', 
        'MAZDA', 'SUZUKI', 'FORD', 'VOLKSWAGEN', 'PEUGEOT', 'RENAULT',
        'MITSUBISHI', 'SUBARU', 'BMW', 'MERCEDES-BENZ', 'AUDI', 'FIAT',
        'CITROEN', 'SKODA', 'JEEP', 'VOLVO', 'LEXUS', 'INFINITI'
      ];
      
      const filteredMakes = makes
        .filter((make: CarMake) => 
          commonMakeNames.includes(make.Make_Name.toUpperCase())
        )
        .sort((a: CarMake, b: CarMake) => 
          a.Make_Name.localeCompare(b.Make_Name)
        );
      
      console.log(`✅ Cargadas ${filteredMakes.length} marcas`);
      setCarMakes(filteredMakes);
    } catch (error) {
      console.error("❌ Error cargando marcas:", error);
      Alert.alert(
        "Error de Conexión", 
        "No se pudieron cargar las marcas de autos. Verifica tu conexión a internet."
      );
      
      // Fallback a marcas locales si falla la API
      const fallbackMakes: CarMake[] = [
        { Make_ID: 1, Make_Name: "Toyota" },
        { Make_ID: 2, Make_Name: "Hyundai" },
        { Make_ID: 3, Make_Name: "Chevrolet" },
        { Make_ID: 4, Make_Name: "Nissan" },
        { Make_ID: 5, Make_Name: "Kia" },
      ].sort((a, b) => a.Make_Name.localeCompare(b.Make_Name));
      
      setCarMakes(fallbackMakes);
    } finally {
      setLoadingMakes(false);
    }
  };

  // Función para cargar modelos por marca desde la API
  const loadCarModels = async (makeId: number, makeName: string) => {
    setLoadingModels(true);
    try {
      console.log(`🚗 Cargando modelos para ${makeName}...`);
      const models = await fetchCarModels(makeId);
      
      // Filtrar modelos válidos y ordenar alfabéticamente
      const filteredModels = models
        .filter((model: CarModel) => 
          model.Model_Name && 
          model.Model_Name.trim() !== '' &&
          model.Model_Name !== 'N/A'
        )
        .sort((a: CarModel, b: CarModel) => 
          a.Model_Name.localeCompare(b.Model_Name)
        );
      
      console.log(`✅ Cargados ${filteredModels.length} modelos para ${makeName}`);
      setCarModels(filteredModels);
    } catch (error) {
      console.error("❌ Error cargando modelos:", error);
      Alert.alert(
        "Error de Conexión",
        "No se pudieron cargar los modelos. Intenta nuevamente."
      );
      setCarModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.licence_plate.trim()) {
      newErrors.licence_plate = "La patente es requerida";
    } else if (!/^[A-Z]{2}\d{4}$|^[A-Z]{4}\d{2}$/.test(formData.licence_plate.toUpperCase())) {
      newErrors.licence_plate = "Formato de patente inválido (ej: AB1234 o ABCD12)";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "La marca del auto es requerida";
    }

    if (!formData.model.trim()) {
      newErrors.model = "El modelo del auto es requerido";
    }

    if (!formData.year.trim()) {
      newErrors.year = "El año del auto es requerido";
    } else {
      const year = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1990 || year > currentYear + 1) {
        newErrors.year = `El año debe estar entre 1990 y ${currentYear + 1}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: keyof VehicleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si cambia la marca, limpiar el modelo
    if (field === 'brand') {
      setFormData(prev => ({ ...prev, model: "" }));
      setCarModels([]);
      setSelectedMakeId(null);
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const selectMake = (make: CarMake) => {
    updateField('brand', make.Make_Name);
    setSelectedMakeId(make.Make_ID);
    setShowMakeModal(false);
    
    // Cargar modelos para esta marca
    loadCarModels(make.Make_ID, make.Make_Name);
  };

  const selectModel = (model: CarModel) => {
    updateField('model', model.Model_Name);
    setShowModelModal(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor corrige los errores en el formulario");
      return;
    }

    setLoading(true);

    try {
      const vehicleData = {
        licence_plate: formData.licence_plate.trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        validation: false
      };

      console.log("🚗 Registrando vehículo:", vehicleData);

      const response = await VehicleApiService.becomeDriver(vehicleData);
      console.log("📝 Respuesta del servidor:", response);

      if (response.success) {
        // Actualizar el estado del driver inmediatamente
        await refreshStatus();
        
        Alert.alert(
          "¡Felicitaciones! 🎉",
          "Te has registrado exitosamente como conductor. ¡Ya puedes crear viajes!",
          [
            {
              text: "Continuar",
              onPress: () => router.replace("/Driver/DriverHomePage"),
            },
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Error al registrarse como conductor");
      }
    } catch (error) {
      console.error("❌ Error al registrar conductor:", error);
      Alert.alert(
        "Error de Conexión",
        "No se pudo conectar con el servidor. Verifica tu conexión a internet."
      );
    } finally {
      setLoading(false);
    }
  };

  // Componentes para renderizar items de las listas
  const renderMakeItem = ({ item }: { item: CarMake }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => selectMake(item)}
    >
      <Text style={styles.listItemText}>{item.Make_Name}</Text>
    </TouchableOpacity>
  );

  const renderModelItem = ({ item }: { item: CarModel }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => selectModel(item)}
    >
      <Text style={styles.listItemText}>{item.Model_Name}</Text>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Registro de Conductor</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Intro Section */}
        <View style={styles.introSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.driverIcon}>🚗</Text>
          </View>
          <Text style={styles.introTitle}>¡Conviértete en Conductor!</Text>
          <Text style={styles.introSubtitle}>
            Completa tu información para comenzar a ofrecer viajes y ganar dinero extra
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información del Vehículo</Text>

          {/* Patente */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Patente del Auto *</Text>
            <TextInput
              style={[styles.input, errors.licence_plate && styles.inputError]}
              placeholder="Ej: AB1234 o ABCD12"
              value={formData.licence_plate}
              onChangeText={(value) => updateField("licence_plate", value.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
            />
            {errors.licence_plate && (
              <Text style={styles.errorText}>{errors.licence_plate}</Text>
            )}
          </View>

          {/* Marca - Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Marca del Auto *</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectInput, errors.brand && styles.inputError]}
              onPress={() => setShowMakeModal(true)}
            >
              <Text style={[
                styles.selectText, 
                !formData.brand && styles.placeholderText
              ]}>
                {formData.brand || "Selecciona una marca"}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            {errors.brand && (
              <Text style={styles.errorText}>{errors.brand}</Text>
            )}
          </View>

          {/* Modelo - Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Modelo del Auto *</Text>
            <TouchableOpacity
              style={[
                styles.input, 
                styles.selectInput, 
                errors.model && styles.inputError,
                !formData.brand && styles.inputDisabled
              ]}
              onPress={() => formData.brand && setShowModelModal(true)}
              disabled={!formData.brand}
            >
              <Text style={[
                styles.selectText, 
                !formData.model && styles.placeholderText,
                !formData.brand && styles.disabledText
              ]}>
                {formData.model || (formData.brand ? "Selecciona un modelo" : "Primero selecciona una marca")}
              </Text>
              <Text style={[styles.dropdownIcon, !formData.brand && styles.disabledText]}>▼</Text>
            </TouchableOpacity>
            {errors.model && (
              <Text style={styles.errorText}>{errors.model}</Text>
            )}
          </View>

          {/* Año */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Año *</Text>
            <TextInput
              style={[styles.input, errors.year && styles.inputError]}
              placeholder="2020"
              value={formData.year}
              onChangeText={(value) => updateField("year", value)}
              keyboardType="numeric"
              maxLength={4}
            />
            {errors.year && (
              <Text style={styles.errorText}>{errors.year}</Text>
            )}
          </View>

          <Text style={styles.helperText}>
            * Tu vehículo será revisado por nuestro equipo antes de ser aprobado para ofrecer viajes.
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                  Registrando...
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Convertirse en Conductor</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal para seleccionar marca */}
      <Modal
        visible={showMakeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMakeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Marca</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMakeModal(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>
            
            {loadingMakes ? (
              <View style={styles.centeredLoading}>
                <ActivityIndicator color="#F99F7C" size="large" />
                <Text style={styles.loadingText}>Cargando marcas...</Text>
              </View>
            ) : (
              <FlatList
                data={carMakes}
                renderItem={renderMakeItem}
                keyExtractor={(item) => item.Make_ID.toString()}
                style={styles.modalList}
                showsVerticalScrollIndicator={true}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar modelo */}
      <Modal
        visible={showModelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Modelos de {formData.brand}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModelModal(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>
            
            {loadingModels ? (
              <View style={styles.centeredLoading}>
                <ActivityIndicator color="#F99F7C" size="large" />
                <Text style={styles.loadingText}>Cargando modelos...</Text>
              </View>
            ) : carModels.length === 0 ? (
              <View style={styles.centeredLoading}>
                <Text style={styles.emptyText}>No se encontraron modelos para esta marca</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => selectedMakeId && loadCarModels(selectedMakeId, formData.brand)}
                >
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={carModels}
                renderItem={renderModelItem}
                keyExtractor={(item) => item.Model_ID.toString()}
                style={styles.modalList}
                showsVerticalScrollIndicator={true}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Estilos existentes
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 67,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
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
  introSection: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#F8F9FA",
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  driverIcon: {
    fontSize: 32,
    color: "#FFFFFF",
  },
  introTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 24,
    lineHeight: 30,
    color: "#121417",
    textAlign: "center",
    marginBottom: 8,
  },
  introSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 24,
    color: "#61758A",
    textAlign: "center",
    maxWidth: 300,
  },
  formSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 23,
    color: "#121417",
    marginTop: 24,
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
    color: "#171212",
    borderWidth: 1,
    borderColor: "transparent",
  },
  
  // ✅ Nuevos estilos para selectores
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 16,
    fontFamily: "Plus Jakarta Sans",
    color: "#171212",
    flex: 1,
  },
  placeholderText: {
    color: "#999999",
  },
  dropdownIcon: {
    fontSize: 16,
    color: "#61758A",
    marginLeft: 8,
  },
  inputDisabled: {
    backgroundColor: "#F0F0F0",
    opacity: 0.6,
  },
  disabledText: {
    color: "#CCCCCC",
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
  helperText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    lineHeight: 18,
    color: "#61758A",
    marginTop: 4,
    fontStyle: "italic",
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  submitButton: {
    backgroundColor: "#F99F7C",
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "flex-end",
},
 modalContainer: {
  backgroundColor: "#FFFFFF",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  height: "80%", // ✅ Cambio: height fijo en lugar de maxHeight
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
  modalList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listItem: {
    paddingVertical: 16,
  },
  listItemText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    color: "#121417",
  },
  separator: {
    height: 1,
    backgroundColor: "#F8F9FA",
  },
  centeredLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    color: "#61758A",
  },
  emptyText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    color: "#61758A",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#F99F7C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 14,
    color: "#FFFFFF",
  },
});