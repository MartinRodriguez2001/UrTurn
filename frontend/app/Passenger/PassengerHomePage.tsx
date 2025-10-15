import { useAuth } from "@/context/authContext";
import { useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface TripCard {
  id: string;
  title: string;
  date: string;
  image: string;
}

export default function PassengerHomePage() {
  const router = useRouter();
  const {user} = useAuth();

  const tripCards: TripCard[] = [
    {
      id: "1",
      title: "Viaje a la Biblioteca Central",
      date: "Hoy, 14:00",
      image: "📚",
    },
    {
      id: "2",
      title: "Viaje al Centro de Estudiantes",
      date: "Mañana, 10:00",
      image: "🏛️",
    },
    {
      id: "3",
      title: "Viaje al Complejo Deportivo",
      date: "Próximo lunes, 16:00",
      image: "🏟️",
    },
  ];

  const handleDriverAction = () => {
    if (user?.IsDriver) {
      // Si es driver, navegar a la página de driver
      router.push("/Driver/DriverHomePage");
    } else {
      // Si no es driver, navegar a la página para convertirse en driver
    //   router.push("/BecomeDriverScreen");
    }
  };

  const renderTripCard = ({ item }: { item: TripCard }) => (
    <TouchableOpacity style={styles.tripCard}>
      <View style={styles.tripImageContainer}>
        <Text style={styles.tripImageEmoji}>{item.image}</Text>
      </View>
      <View style={styles.tripInfo}>
        <Text style={styles.tripTitle}>{item.title}</Text>
        <Text style={styles.tripDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Página Principal</Text>
        </View>

        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>U</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >

        {/* Driver Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.driverCard}
            onPress={handleDriverAction}
          >
            <View style={styles.driverCardContent}>
              <View style={styles.driverIconContainer}>
                <Text style={styles.driverIcon}>🚗</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverTitle}>
                  {user?.IsDriver ? "Cambiar a Driver" : "¿Quieres ser Driver?"}
                </Text>
                <Text style={styles.driverSubtitle}>
                  {user?.IsDriver 
                    ? "Cambia al modo conductor para crear viajes" 
                    : "Comparte viajes y gana dinero mientras estudias"
                  }
                </Text>
              </View>
              <View style={styles.driverArrow}>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        {/* Scheduled Trips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Viajes Programados</Text>

          <FlatList
            data={tripCards}
            renderItem={renderTripCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tripCardsContainer}
          />
        </View>

        {/* Spacer for bottom elements */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Search New Trip Button */}
      <View style={styles.searchButtonContainer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push("/Passenger/PassengerSearchRider")}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>Buscar Nuevo Viaje</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#121417",
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 22,
    lineHeight: 28,
    color: "#121417",
    marginBottom: 16,
  },
  tripCardsContainer: {
    paddingHorizontal: 0,
  },
  tripCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 8,
  },
  tripImageContainer: {
    height: 90,
    borderRadius: 8,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  tripImageEmoji: {
    fontSize: 40,
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 24,
    color: "#121417",
    marginBottom: 4,
  },
  tripDate: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#61758A",
  },
  bottomSpacer: {
    height: 120, // Ajustado para el navbar
  },
  searchButtonContainer: {
    position: "absolute",
    bottom: 91, // Ajustado para quedar encima del navbar
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F99F7C",
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 16,
    gap: 16,
  },
  searchIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  searchText: {
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
    borderTopColor: "#F0F2F5",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navIcon: {
    fontSize: 24,
    height: 32,
    textAlignVertical: "center",
  },
  navLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 18,
    color: "#61758A",
    textAlign: "center",
  },
  navLabelActive: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 18,
    color: "#121417",
    textAlign: "center",
  },
  driverCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  driverCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  driverIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  driverInfo: {
    flex: 1,
  },
  driverTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#121417",
    marginBottom: 2,
  },
  driverSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#61758A",
  },
  driverArrow: {
    marginLeft: 8,
  },
  arrowIcon: {
    fontSize: 18,
    color: "#61758A",
    fontWeight: "bold",
  },
});
