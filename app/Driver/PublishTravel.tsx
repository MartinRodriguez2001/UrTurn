import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";

export default function PublishTravel() {
  const router = useRouter();
  return (
    <>
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
        
      </SafeAreaView>
    </>
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
    paddingHorizontal: 16,
    paddingTop: 11,
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
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 22,
    lineHeight: 28,
    color: "#121417",
    marginBottom: 16,
  },
  tripCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tripInfo: {
    flex: 1,
    paddingRight: 16,
  },
  tripLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#876363",
    marginBottom: 4,
  },
  tripDestination: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 20,
    color: "#121417",
    marginBottom: 4,
  },
  tripTime: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#876363",
  },
  tripImageContainer: {
    width: 130,
    height: 90,
  },
  tripImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  carIcon: {
    fontSize: 24,
  },
  requestInfo: {
    flex: 1,
  },
  requestCount: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 24,
    color: "#121417",
    marginBottom: 2,
  },
  requestRoute: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#876363",
  },
  bottomSpacer: {
    height: 200, // Space for bottom elements
  },
  publishButtonContainer: {
    position: "absolute",
    bottom: 151,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F99F7C",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  publishIcon: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginRight: 8,
  },
  publishText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  bottomNavigation: {
    flexDirection: "row",
    height: 75,
    backgroundColor: "#FFFFFF",
    paddingTop: 9,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    lineHeight: 18,
    color: "#121417",
    textAlign: "center",
  },
});
