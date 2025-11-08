import { Feather } from '@expo/vector-icons';
import { Slot, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PassengerLayout() {
    const router = useRouter()
  return (
    <View style={styles.container}>
      {/* Contenido de las pantallas */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/Passenger/PassengerHomePage")}>
          <Feather name="home" size={24} color="black" />
          <Text style={styles.navLabel}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/Passenger/PassengerTravels")}>
          <Feather name="map" size={24} color="black" />
          <Text style={styles.navLabel}>Viajes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/Passenger/PassengerSearchRider")}>
          <Feather name="search" size={24} color="black" />
          <Text style={styles.navLabel}>Buscar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({ pathname: "/Passenger/Passenger_Historial" })}>
          <Feather name="clock" size={24} color="black" />
          <Text style={styles.navLabel}>Historial</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({ pathname: "/Passenger/PassengerProfile" })}>
          <Feather name="user" size={24} color="black" />
          <Text style={styles.navLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    height: 90,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
    color: '#61758A',
  },
  navLabel: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 12,
    lineHeight: 18,
    color: '#61758A',
    textAlign: 'center',
  },
});
