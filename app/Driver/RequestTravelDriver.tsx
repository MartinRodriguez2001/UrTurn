import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function RequestTravelDriver() {
    const router = useRouter();

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
                    <Text style={styles.headerTitle}>Solicitudes de viaje</Text>
                </View>
                
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Passenger Info Section */}
                <View style={styles.passengerSection}>
                    <View style={styles.passengerImageContainer}>
                        <View style={styles.passengerImagePlaceholder}>
                            <Text style={styles.passengerInitial}>S</Text>
                        </View>
                    </View>
                    <View style={styles.passengerInfo}>
                        <Text style={styles.passengerName}>Sofía</Text>
                        <Text style={styles.passengerRole}>Pasajero</Text>
                    </View>
                </View>

                {/* Origin Section */}
                <View style={styles.infoSection}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.locationIcon}>📍</Text>
                    </View>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Residencia Universitaria</Text>
                        <Text style={styles.infoSubtitle}>Origen</Text>
                    </View>
                </View>

                {/* Destination Section */}
                <View style={styles.infoSection}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.locationIcon}>📍</Text>
                    </View>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Facultad de Ingeniería</Text>
                        <Text style={styles.infoSubtitle}>Destino</Text>
                    </View>
                </View>

                {/* Time Section */}
                <View style={styles.infoSection}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.timeIcon}>🕒</Text>
                    </View>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>10:00 AM</Text>
                        <Text style={styles.infoSubtitle}>Hora de salida</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={styles.rejectButton}>
                        <Text style={styles.rejectButtonText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Aceptar</Text>
                    </TouchableOpacity>
                </View>

                {/* Contact Button */}
                <View style={styles.contactButtonContainer}>
                    <TouchableOpacity style={styles.contactButton}>
                        <Text style={styles.contactButtonText}>Contactar</Text>
                    </TouchableOpacity>
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
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 59,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 11,
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
    passengerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 72,
    },
    passengerImageContainer: {
        marginRight: 16,
    },
    passengerImagePlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    passengerInitial: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#121417',
    },
    passengerInfo: {
        flex: 1,
    },
    passengerName: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
        marginBottom: 2,
    },
    passengerRole: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#61758A',
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        height: 72,
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
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
        marginBottom: 2,
    },
    infoSubtitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#61758A',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    rejectButtonText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 14,
        lineHeight: 21,
        color: '#121417',
    },
    acceptButton: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F99F7C',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    acceptButtonText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 14,
        lineHeight: 21,
        color: '#FFFFFF',
    },
    contactButtonContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    contactButton: {
        width: 102,
        height: 41,
        borderRadius: 8,
        backgroundColor: '#F99F7C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactButtonText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 14,
        lineHeight: 21,
        color: '#FFFFFF',
    },
    bottomSpacer: {
        height: 20,
    },
});