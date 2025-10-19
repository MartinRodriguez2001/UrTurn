import NextTravelCard from "@/components/driverComps/NextTravelCard";
import RequestsCard from "@/components/driverComps/RequestsCard";
import { useDriverStatus } from "@/hooks/useDriverStatus";
import travelApiService from "@/Services/TravelApiService";
import { ProcessedTravel, TravelStatus } from "@/types/travel";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function DriverHomePage() {
  const router = useRouter();
  const [showModeModal, setShowModeModal] = useState(false);
  const { canAccessDriverMode, loading, refreshStatus } = useDriverStatus();
  const [travels, setTravels] = useState<ProcessedTravel[]>([]);
  const [loadingTravels, setLoadingTravels] = useState(false);

  async function getDriverTravels() {
    try {
      setLoadingTravels(true);
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const token = await AsyncStorage.default.getItem('token');
     
      
      const response = await travelApiService.getDriverTravels();
      
      if (response.success) {
        const travelsData = (response.data && response.data.travels) || (response as any).travels || [];
      
        setTravels(travelsData);
      } else {

        setTravels([]);
      }
    } catch (error) {

      setTravels([]);
    } finally {
      setLoadingTravels(false);
  
    }
  }

  const getNextTravel = (): ProcessedTravel | null => {
        if (travels.length === 0) return null;
        
        const now = new Date();
        const futureTravels = travels.filter(travel => {
            const travelDate = new Date(travel.start_time);
            return travelDate > now && (travel.status === TravelStatus.CONFIRMADO || travel.status === TravelStatus.PENDIENTE);
        });
        futureTravels.sort((a, b) => 
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        
        return futureTravels.length > 0 ? futureTravels[0] : null;
    };

    const getPendingRequestsCount = (): number => {
        return travels.reduce((total, travel) => {
            return total + (travel.capacity - travel.spaces_available);
        }, 0);
    };

  useEffect(() => {
        console.log("🎬 DriverHomePage: useEffect inicial ejecutado");
        refreshStatus();
        setTimeout(() => {
            console.log("⏰ DriverHomePage: Timeout ejecutado, llamando getDriverTravels");
            getDriverTravels();
        }, 1000);
    }, []);

  useEffect(() => {
    if (!loading && !canAccessDriverMode) {
      router.replace("/Passenger/DriverRegister");
    }
  }, [loading, canAccessDriverMode, router]);

  const handleRefresh = async () => {
        await Promise.all([
            refreshStatus(),
            getDriverTravels()
        ]);
    };

  // Mostrar loading mientras se verifica el estado
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={styles.loadingText}>
            Cargando
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canAccessDriverMode) {
    return null;
  }

  const handleModeChange = () => {
    setShowModeModal(false);
    router.replace("/Passenger/PassengerHomePage");
  };

  // Definir variables para usar en el JSX
  const nextTravel = getNextTravel();
  const pendingRequestsCount = getPendingRequestsCount();

  return (
    <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.modeButton}
                    onPress={() => setShowModeModal(true)}
                >
                    <Text style={styles.modeIcon}>🔄</Text>
                    <Text style={styles.modeText}>Pasajero</Text>
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>Pagina Principal</Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.profileButton}
                    onPress={() => router.push("/Driver/DriverProfile")}
                >
                    <View style={styles.profileImage}>
                        <Text style={styles.profileInitial}>U</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scrollContainer} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={loadingTravels}
                        onRefresh={handleRefresh}
                        tintColor="#F99F7C"
                    />
                }
            >
                {/* Published Trips Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Próximo Viaje</Text>
                        {travels.length > 1 && (
                            <TouchableOpacity 
                                onPress={() => console.log("Ver todos los viajes")}
                            >
                                <Text style={styles.seeAllText}>Ver todos ({travels.length})</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {loadingTravels ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#F99F7C" />
                            <Text style={styles.loadingText}>Cargando viajes...</Text>
                        </View>
                    ) : getNextTravel() ? (
                        // ✅ Pasar datos reales del viaje a NextTravelCard
                        <NextTravelCard 
                            Route={`${getNextTravel()!.start_location} → ${getNextTravel()!.end_location}`}
                            Date={new Date(getNextTravel()!.start_time).toLocaleDateString('es-CL')}
                            Time={`${new Date(getNextTravel()!.start_time).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} - ${new Date(getNextTravel()!.end_time).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`}
                        />
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyStateIcon}>🚗</Text>
                            <Text style={styles.emptyStateTitle}>No tienes viajes programados</Text>
                            <Text style={styles.emptyStateMessage}>
                                Publica tu primer viaje y comienza a ganar dinero
                            </Text>
                            <TouchableOpacity 
                                style={styles.emptyStateButton}
                                onPress={() => router.push("/Driver/PublishTravel")}
                            >
                                <Text style={styles.emptyStateButtonText}>Publicar Viaje</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Pending Requests Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Solicitudes Pendientes</Text>
                        {pendingRequestsCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
                            </View>
                        )}
                    </View>

                    {pendingRequestsCount > 0 ? (
                        <TouchableOpacity onPress={() => console.log("Ver solicitudes pendientes")}>
                            <RequestsCard 
                                RequestCount={pendingRequestsCount}
                                Route={nextTravel ? `${nextTravel.start_location} → ${nextTravel.end_location}` : 'Múltiples rutas'}
                            />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyStateIcon}>📭</Text>
                            <Text style={styles.emptyStateTitle}>No hay solicitudes pendientes</Text>
                            <Text style={styles.emptyStateMessage}>
                                Las solicitudes de pasajeros aparecerán aquí
                            </Text>
                        </View>
                    )}
                </View>

                {/* Travel Statistics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{travels.length}</Text>
                            <Text style={styles.statLabel}>Viajes Publicados</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {travels.filter(t => t.status === TravelStatus.CONFIRMADO).length}
                            </Text>
                            <Text style={styles.statLabel}>Confirmados</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {travels.reduce((sum, t) => sum + (t.capacity - t.spaces_available), 0)}
                            </Text>
                            <Text style={styles.statLabel}>Pasajeros Total</Text>
                        </View>
                    </View>
                </View>

                {/* Spacer for bottom navigation */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Publish New Trip Button */}
            <View style={styles.publishButtonContainer}>
                <TouchableOpacity 
                    style={styles.publishButton} 
                    onPress={() => router.push("/Driver/PublishTravel")}
                >
                    <Text style={styles.publishIcon}>+</Text>
                    <Text style={styles.publishText}>Publicar Nuevo Viaje</Text>
                </TouchableOpacity>
            </View>

            {/* Mode Change Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showModeModal}
                onRequestClose={() => setShowModeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cambiar Modo</Text>
                        </View>
                        
                        <Text style={styles.modalMessage}>
                            ¿Estás seguro de que quieres cambiar al modo Pasajero?
                        </Text>
                        
                        <Text style={styles.modalSubMessage}>
                            Podrás buscar viajes y solicitar que te lleven a tu destino.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.modalCancelButton}
                                onPress={() => setShowModeModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.modalConfirmButton}
                                onPress={handleModeChange}
                            >
                                <Text style={styles.modalConfirmText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
    justifyContent: "space-between",
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
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  bottomSpacer: {
    height: 120, // Ajustado para el navbar
  },
  publishButtonContainer: {
    position: "absolute",
    bottom: 91, // Ajustado para quedar encima del navbar
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
  // Mode button styles
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  modeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  modeText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 12,
    color: "#495057",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 20,
    lineHeight: 25,
    color: "#121417",
  },
  modalIcon: {
    fontSize: 24,
  },
  modalMessage: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 24,
    color: "#121417",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubMessage: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#61758A",
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  modalCancelText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#495057",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#F99F7C",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  loadingText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    color: "#61758A",
    textAlign: "center",
  },
  sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '600',
        fontSize: 14,
        color: '#F99F7C',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    emptyStateIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 18,
        color: '#121417',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateMessage: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        color: '#61758A',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    emptyStateButton: {
        backgroundColor: '#F99F7C',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    emptyStateButtonText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '600',
        fontSize: 14,
        color: '#FFFFFF',
    },
    badge: {
        backgroundColor: '#FF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 12,
        color: '#FFFFFF',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 24,
        color: '#F99F7C',
        marginBottom: 4,
    },
    statLabel: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        color: '#61758A',
        textAlign: 'center',
    },
});
