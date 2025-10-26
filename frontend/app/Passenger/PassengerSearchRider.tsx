import type { MapCoordinate } from "@/components/passenger/PassengerMap.types";
import TravelRouteSection from "@/components/travel/TravelRouteSection";
import TravelScheduleSection from "@/components/travel/TravelScheduleSection";
import travelApiService from "@/Services/TravelApiService";
import { resolveGoogleMapsApiKey } from "@/utils/googleMaps";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const createNextHour = () => {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(now.getHours() + 1);
  return nextHour;
};

export default function PassengerSearchRider() {
  const router = useRouter();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState(new Date());
  const [travelTime, setTravelTime] = useState(() => createNextHour());

  const [originCoordinate, setOriginCoordinate] = useState<MapCoordinate | null>(null);
  const [destinationCoordinate, setDestinationCoordinate] = useState<MapCoordinate | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<{ origin?: string; destination?: string; time?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleMapsApiKey = resolveGoogleMapsApiKey();

  const formattedDate = useMemo(
    () =>
      travelDate.toLocaleDateString("es-CL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [travelDate]
  );

  const formattedTime = useMemo(
    () =>
      travelTime.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [travelTime]
  );

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTravelDate(new Date(selectedDate));
    }
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const nextStart = new Date(selectedTime);
      nextStart.setSeconds(0, 0);
      setTravelTime(nextStart);
      if (errors.time) {
        setErrors((prev) => ({ ...prev, time: undefined }));
      }
    }
  };

  const combineDateTime = () => {
    const pickup = new Date(travelDate);
    pickup.setHours(travelTime.getHours(), travelTime.getMinutes(), 0, 0);
    return pickup;
  };

  const validateForm = () => {
    const newErrors: { origin?: string; destination?: string; time?: string } = {};

    if (!origin.trim()) {
      newErrors.origin = "El origen es requerido";
    } else if (origin.trim().length < 3) {
      newErrors.origin = "El origen debe tener al menos 3 caracteres";
    }

    if (!destination.trim()) {
      newErrors.destination = "El destino es requerido";
    } else if (destination.trim().length < 3) {
      newErrors.destination = "El destino debe tener al menos 3 caracteres";
    }

    if (
      origin.trim() &&
      destination.trim() &&
      origin.trim().toLowerCase() === destination.trim().toLowerCase()
    ) {
      newErrors.destination = "El origen y destino no pueden ser iguales";
    }

    if (!originCoordinate) {
      newErrors.origin = "Selecciona tu punto de partida en el mapa";
    }

    if (!destinationCoordinate) {
      newErrors.destination = "Selecciona tu destino en el mapa";
    }

    const now = new Date();
    const pickup = combineDateTime();
    if (pickup.getTime() < now.getTime() + 30 * 60 * 1000) {
      newErrors.time = "Debes solicitar con al menos 30 minutos de anticipacion";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSearch = async () => {
    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      Alert.alert("Corrige los campos", "Revisa los datos antes de continuar.");
      return;
    }

    const pickupDate = new Date(travelDate);
    pickupDate.setHours(0, 0, 0, 0);

    const pickupDateTime = combineDateTime();

    try {
      setIsSubmitting(true);
      const response = await travelApiService.createTravelRequest({
        startLocationName: origin.trim(),
        startLatitude: originCoordinate!.latitude,
        startLongitude: originCoordinate!.longitude,
        endLocationName: destination.trim(),
        endLatitude: destinationCoordinate!.latitude,
        endLongitude: destinationCoordinate!.longitude,
        pickupDate: pickupDate.toISOString(),
        pickupTime: pickupDateTime.toISOString(),
      });

      if (!response.success) {
        throw new Error(response.message || "No se pudo registrar la solicitud");
      }

      const params: Record<string, string> = {
        origin: origin.trim(),
        destination: destination.trim(),
        pickupLocation: origin.trim(),
        pickupDate: pickupDate.toISOString(),
        pickupTime: pickupDateTime.toISOString(),
      };

      if (originCoordinate) {
        params.originLat = originCoordinate.latitude.toString();
        params.originLng = originCoordinate.longitude.toString();
      }

      if (destinationCoordinate) {
        params.destinationLat = destinationCoordinate.latitude.toString();
        params.destinationLng = destinationCoordinate.longitude.toString();
      }

      if (response.request?.id) {
        params.requestId = response.request.id.toString();
      }

      router.push({
        pathname: "/Passenger/Passengerrideroffers",
        params,
      });
    } catch (error) {
      console.error("Error registering travel request:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo registrar la solicitud"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Buscar un viaje</Text>
          <Text style={styles.headerSubtitle}>Ingresa ruta, fecha y hora para ver opciones disponibles</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <TravelRouteSection
            originValue={origin}
            destinationValue={destination}
            originCoordinateValue={originCoordinate}
            destinationCoordinateValue={destinationCoordinate}
            onOriginCoordinateChange={setOriginCoordinate}
            onDestinationCoordinateChange={setDestinationCoordinate}
            onChangeOrigin={(value) => {
              setOrigin(value);
              if (errors.origin) {
                setErrors((prev) => ({ ...prev, origin: undefined }));
              }
            }}
            onChangeDestination={(value) => {
              setDestination(value);
              if (errors.destination) {
                setErrors((prev) => ({ ...prev, destination: undefined }));
              }
            }}
            originError={errors.origin}
            destinationError={errors.destination}
            originPlaceholder="Ingresa tu punto de partida"
            destinationPlaceholder="Ingresa tu destino"
            googleMapsApiKey={googleMapsApiKey}
          />

          <TravelScheduleSection
            dateValue={formattedDate}
            timeValue={formattedTime}
            onPressDate={() => setShowDatePicker(true)}
            onPressTime={() => setShowTimePicker(true)}
            timeError={errors.time}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.searchButton, isSubmitting ? styles.searchButtonDisabled : null]}
              onPress={handleSearch}
              disabled={isSubmitting}
            >
              <Text style={styles.searchButtonText}>
                {isSubmitting ? "Buscando..." : "Buscar viajes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={travelDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          textColor={Platform.OS === "ios" ? "#121417" : undefined}
          onChange={handleDateChange}
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={travelTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          textColor={Platform.OS === "ios" ? "#121417" : undefined}
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 18,
    color: "#121417",
  },
  headerSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#61758A",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  formSection: {
    gap: 16,
  },
  buttonContainer: {
    paddingHorizontal: 4,
  },
  searchButton: {
    backgroundColor: "#F99F7C",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
});

