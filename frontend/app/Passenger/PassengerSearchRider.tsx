import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import PassengerMap from '../../components/passenger/PassengerMap';
import type {
    MapCoordinate,
    MapRegion,
} from '../../components/passenger/PassengerMap.types';

const createPlacesSessionToken = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;

type AutocompletePrediction = {
    description: string;
    place_id: string;
    structured_formatting?: {
        main_text: string;
        secondary_text?: string;
    };
};

type PlaceDetailsResponse = {
    result?: {
        geometry?: {
            location?: {
                lat: number;
                lng: number;
            };
        };
    };
    status: string;
};

export default function PassengerSearchRider() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    // Adopt PublishTravel approach: keep Date objects for date & time
    const [selectedPickupDate, setSelectedPickupDate] = useState<Date>(() => new Date());
    const [selectedPickupTime, setSelectedPickupTime] = useState<Date>(() => {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        return nextHour;
    });
    const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
    const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
    const [selectedLocationLabel, setSelectedLocationLabel] = useState('');
    const [sessionToken, setSessionToken] = useState(() => createPlacesSessionToken());
    const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ID ?? process.env.GOOGLE_MAPS_ID ?? '';
    const defaultRegion = React.useMemo<MapRegion>(
        () => ({
            latitude: 18.4655,
            longitude: -66.1057,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
        }),
        [],
    );
    const [mapRegion, setMapRegion] = useState<MapRegion>(defaultRegion);
    const [markerCoordinate, setMarkerCoordinate] = useState<MapCoordinate | null>(null);
    const [focusRegion, setFocusRegion] = useState<MapRegion | null>(null);
    const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
    const [isLocatingUser, setIsLocatingUser] = useState(false);
    const searchInputRef = React.useRef<TextInput | null>(null);

    const formatDateLabel = (date: Date) =>
        date.toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });

    const formatTimeLabel = (time: Date) =>
        time.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });

    const handlePickupDateChange = (_event: any, selectedDate?: Date) => {
        setShowDatePicker(false);

        if (selectedDate) {
            setSelectedPickupDate(new Date(selectedDate));
        }
    };

    const handlePickupTimeChange = (_event: any, selectedTime?: Date) => {
        setShowTimePicker(false);

        if (selectedTime) {
            setSelectedPickupTime(new Date(selectedTime));
        }
    };

    const pickupDateLabel = formatDateLabel(selectedPickupDate);

    const pickupTimeLabel = formatTimeLabel(selectedPickupTime);

    const pickupDateTime = React.useMemo(() => {
        const combined = new Date(selectedPickupDate.getTime());
        combined.setHours(selectedPickupTime.getHours(), selectedPickupTime.getMinutes(), 0, 0);
        return combined;
    }, [selectedPickupDate, selectedPickupTime]);

    React.useEffect(() => {
        if (!focusRegion) {
            return;
        }

        const timeoutId = setTimeout(() => setFocusRegion(null), 700);
        return () => clearTimeout(timeoutId);
    }, [focusRegion]);

    const locateUserAndCenter = React.useCallback(
        async (options?: { withMarker?: boolean; label?: string }) => {
            try {
                setIsLocatingUser(true);

                let permission = await Location.getForegroundPermissionsAsync();
                if (permission.status !== Location.PermissionStatus.GRANTED) {
                    permission = await Location.requestForegroundPermissionsAsync();
                }

                if (permission.status !== Location.PermissionStatus.GRANTED) {
                    return false;
                }

                const position = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const coordinate: MapCoordinate = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };

                setUserLocation(coordinate);

                setMapRegion((current) => ({
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                    latitudeDelta: current.latitudeDelta,
                    longitudeDelta: current.longitudeDelta,
                }));

                const focusDelta = Math.max(defaultRegion.latitudeDelta / 4, 0.01);
                setFocusRegion({
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                    latitudeDelta: focusDelta,
                    longitudeDelta: focusDelta,
                });

                if (options?.withMarker) {
                    setMarkerCoordinate(coordinate);
                    const resolvedLabel = options.label ?? 'Tu ubicación actual';
                    setSelectedLocationLabel(resolvedLabel);
                    setSearchQuery(resolvedLabel);
                    setPredictions([]);
                    setIsLoadingPredictions(false);
                    setSessionToken(createPlacesSessionToken());
                } else {
                    setIsLoadingPredictions(false);
                }

                return true;
            } catch (error) {
                console.warn('No se pudo obtener la ubicación actual', error);
                return false;
            } finally {
                setIsLocatingUser(false);
            }
        },
        [defaultRegion],
    );

    React.useEffect(() => {
        void locateUserAndCenter({ withMarker: true, label: 'Tu ubicación actual' });
    }, [locateUserAndCenter]);

    React.useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setPredictions([]);
            setIsLoadingPredictions(false);
            return;
        }

        if (!googleMapsApiKey) {
            setIsLoadingPredictions(false);
            return;
        }

        let isCancelled = false;
        const controller = new AbortController();
        const inputValue = searchQuery.trim();
        const fetchPredictions = async () => {
            try {
                setIsLoadingPredictions(true);
                const locationBias = userLocation
                    ? `&locationbias=point:${userLocation.latitude.toFixed(6)},${userLocation.longitude.toFixed(6)}`
                    : '';
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                        inputValue,
                    )}&key=${googleMapsApiKey}&language=es&sessiontoken=${sessionToken}&types=geocode${locationBias}`,
                    { signal: controller.signal },
                );

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const data: { predictions: AutocompletePrediction[]; status: string } =
                    await response.json();

                if (!isCancelled) {
                    if (data.status === 'OK') {
                        setPredictions(data.predictions);
                    } else {
                        setPredictions([]);
                    }
                }
            } catch (error) {
                if (!isCancelled) {
                    setPredictions([]);
                    console.warn('Error obteniendo sugerencias de Places', error);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingPredictions(false);
                }
            }
        };

        const timeoutId = setTimeout(fetchPredictions, 300);

        return () => {
            isCancelled = true;
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [searchQuery, googleMapsApiKey, sessionToken, userLocation]);

    const handleSelectPrediction = React.useCallback(
        async (prediction: AutocompletePrediction) => {
            if (!googleMapsApiKey) {
                return;
            }

            try {
                setPredictions([]);
                setIsLoadingPredictions(false);
                const primaryText = prediction.structured_formatting?.main_text ?? prediction.description;
                const secondaryText = prediction.structured_formatting?.secondary_text;
                const formattedLabel = secondaryText ? `${primaryText}, ${secondaryText}` : primaryText;
                setSearchQuery(formattedLabel);
                Keyboard.dismiss();

                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${
                        prediction.place_id
                    }&key=${googleMapsApiKey}&language=es&sessiontoken=${sessionToken}&fields=geometry%2Cname%2Cformatted_address`,
                );

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const data: PlaceDetailsResponse = await response.json();

                const location = data.result?.geometry?.location;
                if (!location) {
                    return;
                }

                const updatedRegion: MapRegion = {
                    latitude: location.lat,
                    longitude: location.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };

                setMapRegion(updatedRegion);
                const coordinate: MapCoordinate = {
                    latitude: location.lat,
                    longitude: location.lng,
                };

                setMarkerCoordinate(coordinate);
                setFocusRegion(updatedRegion);
                setSelectedLocationLabel(formattedLabel);
                setSessionToken(createPlacesSessionToken());
            } catch (error) {
                // Autocomplete errors are non-critical; suppressing UI error for now.
                console.warn('Error obteniendo detalles del lugar', error);
            }
        },
        [googleMapsApiKey, sessionToken],
    );
    const handleManualCoordinateSelection = React.useCallback((coordinate: MapCoordinate) => {
        const manualRegion: MapRegion = {
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };

        setMarkerCoordinate(coordinate);
        setMapRegion(manualRegion);
        setFocusRegion(manualRegion);
        const manualLabel = `Ubicación manual: ${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`;
        setSearchQuery(manualLabel);
        setPredictions([]);
        setIsLoadingPredictions(false);
        setSelectedLocationLabel(manualLabel);
        setSessionToken(createPlacesSessionToken());
    }, []);
    const handleRegionChange = React.useCallback((region: MapRegion) => {
        setMapRegion(region);
    }, []);
    const handleSearchQueryChange = React.useCallback(
        (text: string) => {
            if ((searchQuery.length === 0 && text.length > 0) || text.length === 0) {
                setSessionToken(createPlacesSessionToken());
            }

            setSearchQuery(text);

            if (text.trim().length < 2) {
                setPredictions([]);
                setIsLoadingPredictions(false);
            }

            if (text.length > 0) {
                setSelectedLocationLabel('');
            }
        },
        [searchQuery],
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
                    <PassengerMap
                        style={styles.map}
                        region={mapRegion}
                        defaultRegion={defaultRegion}
                        markerCoordinate={markerCoordinate}
                        focusRegion={focusRegion}
                        onRegionChangeComplete={handleRegionChange}
                        allowManualSelection
                        onSelectCoordinate={handleManualCoordinateSelection}
                        showsUserLocation
                    />

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
                                value={searchQuery}
                                onChangeText={handleSearchQueryChange}
                                autoCorrect={false}
                                autoCapitalize="none"
                                ref={searchInputRef}
                                returnKeyType="search"
                                onSubmitEditing={() => {
                                    if (predictions[0]) {
                                        void handleSelectPrediction(predictions[0]);
                                    }
                                }}
                            />
                        </View>

                        {isLoadingPredictions ? (
                            <View style={styles.predictionsLoading}>
                                <ActivityIndicator size="small" color="#61758A" />
                            </View>
                        ) : null}

                        {predictions.length > 0 ? (
                            <View style={styles.predictionsContainer}>
                                {predictions.map((prediction) => (
                                    <TouchableOpacity
                                        key={prediction.place_id}
                                        onPress={() => handleSelectPrediction(prediction)}
                                        style={styles.predictionItem}
                                    >
                                        <Text style={styles.predictionPrimaryText}>
                                            {prediction.structured_formatting?.main_text ??
                                                prediction.description}
                                        </Text>
                                        {prediction.structured_formatting?.secondary_text ? (
                                            <Text style={styles.predictionSecondaryText}>
                                                {prediction.structured_formatting.secondary_text}
                                            </Text>
                                        ) : null}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null}

                        {selectedLocationLabel ? (
                            <View style={styles.selectedLocationContainer}>
                                <Text style={styles.selectedLocationTitle}>Ubicación seleccionada</Text>
                                <Text style={styles.selectedLocationText}>{selectedLocationLabel}</Text>
                            </View>
                        ) : null}

                        {predictions.length === 0 ? (
                            <Text style={styles.manualSelectionHint}>
                                Mantén presionado el mapa o usa el botón 📍 para seleccionar tu ubicación.
                            </Text>
                        ) : null}
                    </View>

                    {/* Map Controls */}
                    <View style={styles.mapControls}>
                        <TouchableOpacity
                            style={styles.controlButton}
                            onPress={() => searchInputRef.current?.focus()}
                            accessibilityLabel="Abrir buscador de destinos"
                        >
                            <Text style={styles.controlIcon}>🔍</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.controlButton,
                                isLocatingUser ? styles.controlButtonDisabled : null,
                            ]}
                            onPress={() => {
                                void locateUserAndCenter({
                                    withMarker: true,
                                    label: 'Tu ubicación actual',
                                });
                            }}
                            accessibilityLabel="Centrar en mi ubicación actual"
                            disabled={isLocatingUser}
                        >
                            {isLocatingUser ? (
                                <ActivityIndicator size="small" color="#F99F7C" />
                            ) : (
                                <Text style={styles.controlIcon}>📍</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton} disabled>
                            <Text style={styles.controlIcon}>⚙️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Bottom Panel */}
            <View style={styles.bottomPanel}>
                {/* Date and Time Pickers */}
                <View style={styles.timePickerContainer}>
                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity
                            style={[styles.timePickerButton, styles.halfWidthButton]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.timePickerText}>{pickupDateLabel}</Text>
                            <Text style={styles.dropdownIcon}>▼</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.timePickerButton, styles.halfWidthButton]}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Text style={styles.timePickerText}>{pickupTimeLabel}</Text>
                            <Text style={styles.dropdownIcon}>▼</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Button */}
                <View style={styles.searchButtonContainer}>
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={() => {
                            if (!selectedPickupDate || !selectedPickupTime || !pickupDateTime) {
                                Alert.alert(
                                    'Selecciona fecha y hora',
                                    'Debes elegir una fecha y hora de recogida antes de continuar.'
                                );
                                return;
                            }

                            const dateOnly = new Date(selectedPickupDate.getTime());
                            dateOnly.setHours(0, 0, 0, 0);

                            router.push({
                                pathname: "/Passenger/Passengerrideroffers",
                                params: {
                                    pickupDate: dateOnly.toISOString(),
                                    pickupTime: pickupDateTime.toISOString(),
                                    pickupLocation: selectedLocationLabel || searchQuery || '',
                                },
                            });
                        }}
                    >
                        <Text style={styles.searchButtonText}>Buscar viaje</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {showDatePicker && (
                <DateTimePicker
                    value={selectedPickupDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handlePickupDateChange}
                    minimumDate={new Date()}
                    maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                />
            )}
            {showTimePicker && (
                <DateTimePicker
                    value={selectedPickupTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handlePickupTimeChange}
                />
            )}
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
    predictionsLoading: {
        marginTop: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 12,
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
    predictionsContainer: {
        marginTop: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        maxHeight: 220,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    predictionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    predictionPrimaryText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 15,
        lineHeight: 22,
        color: '#121417',
    },
    predictionSecondaryText: {
        marginTop: 2,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 13,
        lineHeight: 18,
        color: '#61758A',
    },
    selectedLocationContainer: {
        marginTop: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedLocationTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 20,
        color: '#121417',
        marginBottom: 4,
    },
    selectedLocationText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 13,
        lineHeight: 18,
        color: '#61758A',
    },
    manualSelectionHint: {
        marginTop: 8,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        lineHeight: 16,
        color: '#4B5563',
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
    controlButtonDisabled: {
        opacity: 0.5,
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
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
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
    halfWidthButton: {
        flex: 1,
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
});
