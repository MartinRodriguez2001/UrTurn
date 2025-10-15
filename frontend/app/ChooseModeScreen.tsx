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
    router.push("/Passenger/PassengerHomePage");
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
            <Text style={styles.title}>Bienvenido a Urturn</Text>
          </View>
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Conecta con otros estudiantes para compartir viajes de forma
              segura y económica.
            </Text>
          </View>
          {/* Mode Selection Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={handlePassengerMode}
            >
              <Text style={styles.passengerButtonText}>Siguiente</Text>
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
    height: 583,
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
  },
  titleContainer: {
    width: "100%",
    height: 67,
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: "center",
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 28,
    lineHeight: 35,
    color: "#171212",
    textAlign: "center",
  },
  descriptionContainer: {
    width: "100%",
    height: 64,
    paddingHorizontal: 16,
    paddingTop: 4,
    justifyContent: "flex-start",
  },
  description: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 24,
    color: "#876363",
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    height: 132,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
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
    height: 48,
    backgroundColor: "#F5F0F0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  passengerButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#171212",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 20,
    backgroundColor: "#FFFFFF",
  },
});
