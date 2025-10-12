import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function PassengerSearchRider() {
    const router = useRouter();
    const [destination, setDestination] = useState('');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const defaultRegion = React.useMemo(
        () => ({
            latitude: 18.4655,
            longitude: -66.1057,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
        }),
        [],
    );

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
                    <Text style={styles.headerTitle}>Solicitar un viaje</Text>
                </View>
                
                <View style={styles.placeholder} />
            </View>

            {/* Map Section */}
            <View style={styles.mapContainer}>
                <View style={styles.mapBackground}>
                    <MapView
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={defaultRegion}
                        showsBuildings
                        showsCompass
                        showsIndoors={false}
                        toolbarEnabled={false}
                    >
                        <Marker
                            coordinate={{
                                latitude: defaultRegion.latitude,
                                longitude: defaultRegion.longitude,
                            }}
                        />
                    </MapView>

                    {/* Destination Input */}
                    <View style={styles.destinationInputContainer}>
                        <View style={styles.destinationInput}>
                            <View style={styles.locationIconContainer}>
                                <Text style={styles.locationIcon}>📍</Text>
                            </View>
                            <TextInput
                                style={styles.destinationTextInput}
                                placeholder="Donde Vas?"
                                placeholderTextColor="#61758A"
                                value={destination}
                                onChangeText={setDestination}
                            />
                        </View>
                    </View>

                    {/* Map Controls */}
                    <View style={styles.mapControls}>
                        <View style={styles.controlButton}>
                            <Text style={styles.controlIcon}>🔍</Text>
                        </View>
                        <View style={styles.controlButton}>
                            <Text style={styles.controlIcon}>📍</Text>
                        </View>
                        <View style={styles.controlButton}>
                            <Text style={styles.controlIcon}>⚙️</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom Panel */}
            <View style={styles.bottomPanel}>
                {/* Time Picker */}
                <View style={styles.timePickerContainer}>
                    <TouchableOpacity 
                        style={styles.timePickerButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.timePickerText}>Seleccionar hora de recogida</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Button */}
                <View style={styles.searchButtonContainer}>
                    <TouchableOpacity style={styles.searchButton}>
                        <Text style={styles.searchButtonText}
                        onPress={
                            () => router.push("/Passenger/Passengerrideroffers")
                        }
                        >Buscar viaje</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Navigation */}
                
            </View>

            {/* Time Picker Modal */}
            <Modal
                visible={showTimePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTimePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Hora</Text>
                        
                        {/* Time options */}
                        <TouchableOpacity 
                            style={styles.timeOption}
                            onPress={() => setShowTimePicker(false)}
                        >
                            <Text style={styles.timeOptionText}>Ahora</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.timeOption}
                            onPress={() => setShowTimePicker(false)}
                        >
                            <Text style={styles.timeOptionText}>En 15 minutos</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.timeOption}
                            onPress={() => setShowTimePicker(false)}
                        >
                            <Text style={styles.timeOptionText}>En 30 minutos</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.timeOption}
                            onPress={() => setShowTimePicker(false)}
                        >
                            <Text style={styles.timeOptionText}>En 1 hora</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => setShowTimePicker(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
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
    mapContainer: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    mapBackground: {
        flex: 1,
        backgroundColor: '#E5E7EB',
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    destinationInputContainer: {
        position: 'absolute',
        top: 14,
        left: 16,
        right: 16,
        zIndex: 1,
    },
    destinationInput: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        height: 48,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    locationIconContainer: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
    },
    locationIcon: {
        fontSize: 24,
    },
    destinationTextInput: {
        flex: 1,
        height: 48,
        paddingHorizontal: 8,
        fontSize: 16,
        fontFamily: 'Plus Jakarta Sans',
        color: '#121417',
    },
    mapControls: {
        position: 'absolute',
        top: 242,
        right: 16,
        gap: 12,
    },
    controlButton: {
        width: 40,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    controlIcon: {
        fontSize: 24,
    },
    bottomPanel: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
    },
    timePickerContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    timePickerButton: {
        backgroundColor: '#F5F0F0',
        height: 56,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    timePickerText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
    },
    dropdownIcon: {
        fontSize: 15,
        color: '#121417',
    },
    searchButtonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchButton: {
        backgroundColor: '#F99F7C',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchButtonText: {
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 23,
        color: '#121417',
        textAlign: 'center',
        marginBottom: 20,
    },
    timeOption: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    timeOptionText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
    },
    cancelButton: {
        marginTop: 20,
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 24,
        color: '#61758A',
    },
});
