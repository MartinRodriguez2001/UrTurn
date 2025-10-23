import TravelScheduleSection from "@/components/travel/TravelScheduleSection";
import TravelRouteSection from "@/components/travel/TravelRouteSection";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<{ origin?: string; destination?: string; time?: string }>({});

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

    const now = new Date();
    const pickup = combineDateTime();
    if (pickup.getTime() < now.getTime() + 30 * 60 * 1000) {
      newErrors.time = "Debes solicitar con al menos 30 minutos de anticipación";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSearch = () => {
    if (!validateForm()) {
      Alert.alert("Corrige los campos", "Revisa los datos antes de continuar.");
      return;
    }

    const pickupDate = new Date(travelDate);
    pickupDate.setHours(0, 0, 0, 0);

    const pickupDateTime = combineDateTime();

    router.push({
      pathname: "/Passenger/Passengerrideroffers",
      params: {
        origin: origin.trim(),
        destination: destination.trim(),
        pickupDate: pickupDate.toISOString(),
        pickupTime: pickupDateTime.toISOString(),
      },
    });
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

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <TravelRouteSection
            originValue={origin}
            destinationValue={destination}
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
          />

          <TravelScheduleSection
            dateValue={formattedDate}
            timeValue={formattedTime}
            onPressDate={() => setShowDatePicker(true)}
            onPressTime={() => setShowTimePicker(true)}
            timeError={errors.time}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Buscar viajes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={travelDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={travelTime}
          mode="time"
          display="default"
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
  searchButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
});

