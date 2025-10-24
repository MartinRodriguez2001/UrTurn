import ReportApiService from "@/Services/ReportApiService";
import ReviewApiService from "@/Services/ReviewApiService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function TravelComplete() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { travelId, passengerName, passengerId } = params;

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [showReportSection, setShowReportSection] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStarPress = (star: number) => {
    setRating(star);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Calificación requerida", "Por favor califica el viaje");
      return;
    }

    if (!review.trim()) {
      Alert.alert("Comentario requerido", "Por favor escribe un comentario sobre el viaje");
      return;
    }

    setLoading(true);

    try {
      console.log("📝 Enviando calificación:", {
        travelId,
        passengerId,
        rating,
        review,
      });

      await ReviewApiService.createReview({
        user_target_id: parseInt(passengerId as string),
        travel_id: parseInt(travelId as string),
        starts: rating,
        review: review.trim(),
      });

      Alert.alert(
        "¡Gracias por tu calificación!",
        "Tu opinión nos ayuda a mejorar el servicio",
        [
          {
            text: "Continuar",
            onPress: () => router.replace("/Driver/DriverHomePage"),
          },
        ]
      );
    } catch (error) {
      console.error("Error al enviar calificación:", error);
      Alert.alert(
        "Error", 
        error instanceof Error ? error.message : "No se pudo enviar la calificación. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportDescription.trim()) {
      Alert.alert("Descripción requerida", "Por favor describe el problema");
      return;
    }

    setLoading(true);

    try {
      console.log("🚨 Enviando reporte:", {
        travelId,
        description: reportDescription,
      });

      await ReportApiService.createReport({
        travelId: parseInt(travelId as string),
        description: reportDescription.trim(),
      });

      Alert.alert(
        "Reporte enviado",
        "Nuestro equipo revisará tu reporte pronto",
        [
          {
            text: "OK",
            onPress: () => {
              setReportDescription("");
              setShowReportSection(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error al enviar reporte:", error);
      Alert.alert(
        "Error", 
        error instanceof Error ? error.message : "No se pudo enviar el reporte. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
          >
            <Text style={styles.starIcon}>
              {star <= rating ? "⭐" : "☆"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.headerTitle}>¡Viaje completado!</Text>
          <Text style={styles.headerSubtitle}>
            Has llegado a tu destino
          </Text>
        </View>

        {/* Passenger Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Pasajero</Text>
          <Text style={styles.infoValue}>{passengerName || "Nombre del pasajero"}</Text>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Cómo fue tu experiencia?</Text>
          <Text style={styles.sectionSubtitle}>Califica a tu pasajero</Text>
          
          {renderStars()}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Deja un comentario</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Comparte tu experiencia con este pasajero..."
              placeholderTextColor="#9CA3AF"
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Report Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.reportToggleButton}
            onPress={() => setShowReportSection(!showReportSection)}
          >
            <Text style={styles.reportToggleIcon}>🚨</Text>
            <Text style={styles.reportToggleText}>
              {showReportSection ? "Cancelar reporte" : "¿Tuviste algún problema?"}
            </Text>
          </TouchableOpacity>

          {showReportSection && (
            <View style={styles.reportSection}>
              <Text style={styles.reportLabel}>Describe el problema</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe lo que sucedió durante el viaje..."
                placeholderTextColor="#9CA3AF"
                value={reportDescription}
                onChangeText={setReportDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.reportButton, loading && styles.buttonDisabled]}
                onPress={handleReport}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.reportButtonText}>Enviar reporte</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar calificación</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace("/Driver/DriverHomePage")}
          >
            <Text style={styles.skipButtonText}>Saltar por ahora</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 48,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#121417",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#61758A",
  },
  infoCard: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: "#61758A",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121417",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#121417",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#61758A",
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  starButton: {
    padding: 8,
  },
  starIcon: {
    fontSize: 48,
  },
  inputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121417",
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: "#FFFFFF",
  },
  reportToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  reportToggleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  reportToggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
  },
  reportSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  reportLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 8,
  },
  reportButton: {
    backgroundColor: "#DC2626",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  reportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: "#F99F7C",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    padding: 16,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#61758A",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
