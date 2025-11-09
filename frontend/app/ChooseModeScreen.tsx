import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChooseModeScreen() {
  const router = useRouter();

  const handlePassengerMode = () => {
    router.replace("/Passenger/PassengerHomePage");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Section with Content */}
        <View style={styles.contentSection}>
          {/* Illustration Container */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationPlaceholder}>
              {/* Placeholder for the illustration - can be replaced with actual image */}

              <Image
                source={require("../assets/e7f1b601fa443db232a43e22613f96d9d29cbde9.png")}
                style={styles.illustrationBackground}
              />
            </View>
          </View>

          {/* Welcome Title */}
          <View style={styles.titleContainer}>
            <View style={styles.welcomeIconContainer}>
              <Feather name="check-circle" size={32} color="#10B981" />
            </View>
            <Text style={styles.title}>¡Bienvenido a UrTurn!</Text>
            <Text style={styles.subtitle}>Tu cuenta ha sido creada exitosamente</Text>
          </View>
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Conecta con otros estudiantes para compartir viajes de forma
              segura y económica.
            </Text>
            
            {/* Features */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Feather name="shield" size={20} color="#F99F7C" />
                <Text style={styles.featureText}>Verificación de identidad estudiantil</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="users" size={20} color="#F99F7C" />
                <Text style={styles.featureText}>Comunidad universitaria confiable</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="dollar-sign" size={20} color="#F99F7C" />
                <Text style={styles.featureText}>Viajes económicos y sostenibles</Text>
              </View>
            </View>
          </View>
          {/* Mode Selection Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={handlePassengerMode}
            >
              <Text style={styles.passengerButtonText}>Comenzar mi experiencia</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Bottom Spacer */}
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: 844,
  },
  contentSection: {
    flex: 1,
    width: "100%",
  },
  illustrationContainer: {
    width: "100%",
    height: 320,
  },
  illustrationPlaceholder: {
    width: "100%",
    height: 320,
    position: "relative",
  },
  illustrationBackground: {
    width: "100%",
    height: 320,
    backgroundColor: "#B8E6E1", // Light teal background matching the illustration
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  titleContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  welcomeIconContainer: {
    marginBottom: 16,
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 50,
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 28,
    lineHeight: 35,
    color: "#171212",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 20,
    color: "#10B981",
    textAlign: "center",
    fontWeight: "600",
  },
  descriptionContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  description: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 24,
    color: "#876363",
    textAlign: "center",
    marginBottom: 24,
  },
  featuresContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },
  buttonsContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  driverButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#F99F7C",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  driverButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    textAlign: "center",
  },
  passengerButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#F99F7C",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: "#F99F7C",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  passengerButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    textAlign: "center",
    marginRight: 8,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 20,
    backgroundColor: "#FFFFFF",
  },
});
