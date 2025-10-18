import NextTravelCard from '@/components/driverComps/NextTravelCard';
import RequestsCard from '@/components/driverComps/RequestsCard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DriverHomePage() {
    const router = useRouter();
    const [showModeModal, setShowModeModal] = useState(false);

    const handleModeChange = () => {
        setShowModeModal(false);
        router.replace("/Passenger/PassengerHomePage");
    };

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
                
                <TouchableOpacity style={styles.profileButton}>
                    <View style={styles.profileImage}>
                        <Text style={styles.profileInitial}>U</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Published Trips Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Viajes Publicados</Text>
                    <NextTravelCard Route="Universidad de los Andes" Date="Hoy" Time="15:00 - 15:30"/>
                </View>

                {/* Pending Requests Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Solicitudes Pendientes</Text>
                    <RequestsCard RequestCount={1} Route='Santiago'/>
                </View>

                {/* Spacer for bottom navigation */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Publish New Trip Button */}
            <View style={styles.publishButtonContainer}>
                <TouchableOpacity style={styles.publishButton} onPress={() => router.push("/Driver/PublishTravel")}>
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
    profileButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F99F7C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitial: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    scrollContainer: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 22,
        lineHeight: 28,
        color: '#121417',
        marginBottom: 16,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    bottomSpacer: {
        height: 120, // Ajustado para el navbar
    },
    publishButtonContainer: {
        position: 'absolute',
        bottom: 91, // Ajustado para quedar encima del navbar
        left: 20,
        right: 20,
        zIndex: 1,
    },
    publishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F99F7C',
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 20,
    },
    publishIcon: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginRight: 8,
    },
    publishText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 24,
        color: '#FFFFFF',
    },
    // Mode button styles
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    modeIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    modeText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '600',
        fontSize: 12,
        color: '#495057',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 20,
        lineHeight: 25,
        color: '#121417',
    },
    modalIcon: {
        fontSize: 24,
    },
    modalMessage: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubMessage: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#61758A',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    modalCancelText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '600',
        fontSize: 16,
        color: '#495057',
    },
    modalConfirmButton: {
        flex: 1,
        backgroundColor: '#F99F7C',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalConfirmText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
});