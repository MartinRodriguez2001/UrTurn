import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Slot, useRouter } from 'expo-router';

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
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/Passenger/PassengerHomePage")}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/Passenger/PassengerSearchRider")}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>Buscar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🎒</Text>
          <Text style={styles.navLabel}>Mis Viajes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
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
    height: 75,
    backgroundColor: '#FFFFFF',
    paddingTop: 9,
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
