import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function PassengerConfirmRider() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Get trip details from params or use default
    const origin = params.origin as string || 'Universidad de los Andes';
    const destination = params.destination as string || 'Francisco Bilbao 2567';
    const estimatedTime = params.estimatedTime as string || '10 min';
    const price = params.price as string || '1.000 CLP';

    return (
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
                    <Text style={styles.headerTitle}>Confirmar viaje</Text>
                </View>
                
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Map Section */}
                <View style={styles.mapContainer}>
                    <View style={styles.mapBackground}>
                        <Text style={styles.mapPlaceholder}>🗺️</Text>
                        <Text style={styles.mapText}>Mapa del recorrido</Text>
                    </View>
                </View>

                {/* Trip Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalles del viaje</Text>
                    
                    {/* Origin */}
                    <View style={styles.detailCard}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.locationIcon}>📍</Text>
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Origen</Text>
                            <Text style={styles.detailValue}>{origin}</Text>
                        </View>
                    </View>

                    {/* Destination */}
                    <View style={styles.detailCard}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.locationIcon}>📍</Text>
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Destino</Text>
                            <Text style={styles.detailValue}>{destination}</Text>
                        </View>
                    </View>

                    {/* Estimated Time */}
                    <View style={styles.detailCard}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.timeIcon}>🕒</Text>
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Tiempo estimado</Text>
                            <Text style={styles.detailValue}>{estimatedTime}</Text>
                        </View>
                    </View>

                    {/* Price */}
                    <View style={styles.detailCard}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.priceIcon}>💰</Text>
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Precio</Text>
                            <Text style={styles.detailValue}>{price}</Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Confirm Button */}
            <View style={styles.confirmButtonContainer}>
                <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={() => {
                        // Handle confirmation logic here
                        console.log('Trip confirmed!');
                        // Navigate to success screen or back to home
                        router.push("/Passenger/PassengerConfirmation");
                    }}
                >
                    <Text style={styles.confirmButtonText}>Confirmar solicitud</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Navigation */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 67,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#121417',
        fontWeight: 'bold',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 23,
        color: '#121417',
        textAlign: 'center',
    },
    placeholder: {
        width: 48,
        height: 48,
    },
    scrollContainer: {
        flex: 1,
    },
    mapContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    mapBackground: {
        height: 201,
        borderRadius: 8,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapPlaceholder: {
        fontSize: 48,
        marginBottom: 8,
    },
    mapText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#61758A',
    },
    section: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 23,
        color: '#121417',
        marginBottom: 12,
    },
    detailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        minHeight: 72,
        backgroundColor: '#FFFFFF',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    locationIcon: {
        fontSize: 24,
    },
    timeIcon: {
        fontSize: 24,
    },
    priceIcon: {
        fontSize: 24,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
        marginBottom: 2,
    },
    detailValue: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#61758A',
    },
    bottomSpacer: {
        height: 100,
    },
    confirmButtonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    confirmButton: {
        backgroundColor: '#F99F7C',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    confirmButtonText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 24,
        color: '#FFFFFF',
    },
    bottomNavigation: {
        flexDirection: 'row',
        height: 75,
        backgroundColor: '#FFFFFF',
        paddingTop: 9,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        gap: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navIcon: {
        fontSize: 24,
        height: 32,
        textAlignVertical: 'center',
    },
    navIconActive: {
        fontSize: 24,
        height: 32,
        textAlignVertical: 'center',
    },
    navLabel: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 18,
        color: '#61758A',
        textAlign: 'center',
    },
    navLabelActive: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 18,
        color: '#121417',
        textAlign: 'center',
    },
});
