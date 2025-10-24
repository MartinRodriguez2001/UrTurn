import * as Location from "expo-location";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PassengerMap from "../passenger/PassengerMap";
import type { MapCoordinate, MapRegion } from "../passenger/PassengerMap.types";

type PlacesAutocompletePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
};

type LocationPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coordinate: MapCoordinate) => void;
  initialCoordinate?: MapCoordinate | null;
  defaultRegion?: MapRegion;
  userRegion?: MapCoordinate | null;
  title?: string;
  confirmLabel?: string;
  googleMapsApiKey?: string;
  initialQuery?: string;
  searchPlaceholder?: string;
};

const DEFAULT_REGION: MapRegion = {
  latitude: 18.4655,
  longitude: -66.1057,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const createRegionFromCoordinate = (coordinate: MapCoordinate): MapRegion => ({
  latitude: coordinate.latitude,
  longitude: coordinate.longitude,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
});

const createPlacesSessionToken = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialCoordinate = null,
  defaultRegion = DEFAULT_REGION,
  userRegion = null,
  title = "Selecciona una ubicacion",
  confirmLabel = "Confirmar ubicacion",
  googleMapsApiKey,
  initialQuery = "",
  searchPlaceholder = "Buscar una dirección",
}) => {
  const trimmedApiKey = React.useMemo(
    () => googleMapsApiKey?.trim() ?? "",
    [googleMapsApiKey],
  );
  const searchEnabled = trimmedApiKey.length > 0;

  const [selectedCoordinate, setSelectedCoordinate] = React.useState<MapCoordinate | null>(
    initialCoordinate,
  );
  const [mapRegion, setMapRegion] = React.useState<MapRegion>(
    initialCoordinate
      ? createRegionFromCoordinate(initialCoordinate)
      : userRegion
        ? createRegionFromCoordinate(userRegion)
        : defaultRegion,
  );
  const [focusRegion, setFocusRegion] = React.useState<MapRegion | null>(null);
  const [requestingLocation, setRequestingLocation] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [selectingPrediction, setSelectingPrediction] = React.useState(false);
  const [predictions, setPredictions] = React.useState<PlacesAutocompletePrediction[]>([]);
  const [sessionToken, setSessionToken] = React.useState(createPlacesSessionToken);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const hidePredictionsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    if (initialCoordinate) {
      setSelectedCoordinate(initialCoordinate);
      const region = createRegionFromCoordinate(initialCoordinate);
      setMapRegion(region);
      setFocusRegion(region);
    } else {
      setSelectedCoordinate(null);
      const baseRegion = userRegion ? createRegionFromCoordinate(userRegion) : defaultRegion;
      setMapRegion(baseRegion);
      setFocusRegion(baseRegion);
    }
  }, [visible, initialCoordinate, defaultRegion, userRegion]);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    setSearchQuery(initialQuery);
    setPredictions([]);
    setIsSearchFocused(false);
    setSessionToken(createPlacesSessionToken());
  }, [visible, initialQuery]);

  React.useEffect(
    () => () => {
      if (hidePredictionsTimeoutRef.current) {
        clearTimeout(hidePredictionsTimeoutRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!visible || !searchEnabled) {
      setSearchLoading(false);
      setPredictions([]);
      return;
    }

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) {
      setSearchLoading(false);
      setPredictions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            trimmedQuery,
          )}&key=${trimmedApiKey}&language=es&sessiontoken=${sessionToken}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: { predictions: PlacesAutocompletePrediction[]; status: string } =
          await response.json();

        if (data.status === "OK") {
          setPredictions(data.predictions);
        } else {
          setPredictions([]);
          if (data.status !== "ZERO_RESULTS") {
            console.warn(`Google Places autocomplete returned status ${data.status}`);
          }
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Error fetching location suggestions", error);
        setPredictions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [visible, searchQuery, trimmedApiKey, sessionToken, searchEnabled]);

  const formatPredictionLabel = React.useCallback((prediction: PlacesAutocompletePrediction) => {
    const primary = prediction.structured_formatting?.main_text ?? prediction.description;
    const secondary = prediction.structured_formatting?.secondary_text;
    return secondary ? `${primary}, ${secondary}` : primary;
  }, []);

  const fetchPlaceCoordinate = React.useCallback(
    async (placeId: string): Promise<MapCoordinate | null> => {
      if (!searchEnabled) {
        return null;
      }

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${trimmedApiKey}&language=es`,
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: {
          status: string;
          result?: {
            geometry?: {
              location?: {
                lat: number;
                lng: number;
              };
            };
          };
        } = await response.json();

        if (data.status === "OK" && data.result?.geometry?.location) {
          const { lat, lng } = data.result.geometry.location;
          return { latitude: lat, longitude: lng };
        }

        console.warn(`Google Places details returned status ${data.status}`);
      } catch (error) {
        console.warn("Error fetching place details", error);
      }

      return null;
    },
    [trimmedApiKey, searchEnabled],
  );

  const handlePredictionSelect = React.useCallback(
    async (prediction: PlacesAutocompletePrediction) => {
      if (hidePredictionsTimeoutRef.current) {
        clearTimeout(hidePredictionsTimeoutRef.current);
        hidePredictionsTimeoutRef.current = null;
      }

      try {
        setSelectingPrediction(true);
        const label = formatPredictionLabel(prediction);
        setSearchQuery(label);

        const coordinate = await fetchPlaceCoordinate(prediction.place_id);
        if (coordinate) {
          setSelectedCoordinate(coordinate);
          const region = createRegionFromCoordinate(coordinate);
          setMapRegion(region);
          setFocusRegion(region);
        }
      } catch (error) {
        console.warn("Error selecting prediction", error);
      } finally {
        setSelectingPrediction(false);
        setPredictions([]);
        setIsSearchFocused(false);
        setSessionToken(createPlacesSessionToken());
      }
    },
    [fetchPlaceCoordinate, formatPredictionLabel],
  );

  const handleSearchFocus = React.useCallback(() => {
    if (hidePredictionsTimeoutRef.current) {
      clearTimeout(hidePredictionsTimeoutRef.current);
      hidePredictionsTimeoutRef.current = null;
    }
    setIsSearchFocused(true);
  }, []);

  const handleSearchBlur = React.useCallback(() => {
    hidePredictionsTimeoutRef.current = setTimeout(() => {
      setIsSearchFocused(false);
    }, 150);
  }, []);

  const handleUseMyLocation = React.useCallback(async () => {
    try {
      setRequestingLocation(true);
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinate: MapCoordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setSelectedCoordinate(coordinate);
      setSearchQuery("");
      setPredictions([]);
      setIsSearchFocused(false);
      const region = createRegionFromCoordinate(coordinate);
      setMapRegion(region);
      setFocusRegion(region);
      setSessionToken(createPlacesSessionToken());
    } catch (error) {
      console.warn("Unable to obtain current location", error);
    } finally {
      setRequestingLocation(false);
    }
  }, []);

  const shouldShowPredictions =
    searchEnabled && isSearchFocused && (searchLoading || predictions.length > 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchSection}>
          <View
            style={[styles.searchInputWrapper, !searchEnabled ? styles.searchInputDisabled : null]}
          >
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              editable={searchEnabled}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchLoading || selectingPrediction ? (
              <ActivityIndicator size="small" color="#61758A" style={styles.searchSpinner} />
            ) : null}
          </View>
          {!searchEnabled ? (
            <Text style={styles.searchHelper}>
              Configura tu clave de Google Maps para habilitar la búsqueda de direcciones.
            </Text>
          ) : null}
          {shouldShowPredictions ? (
            <View style={styles.predictionsWrapper}>
              {searchLoading ? (
                <View style={styles.predictionsLoading}>
                  <ActivityIndicator size="small" color="#61758A" />
                </View>
              ) : (
                predictions.map((prediction) => (
                  <TouchableOpacity
                    key={prediction.place_id}
                    onPress={() => handlePredictionSelect(prediction)}
                    style={styles.predictionItem}
                  >
                    <Text style={styles.predictionPrimaryText}>
                      {prediction.structured_formatting?.main_text ?? prediction.description}
                    </Text>
                    {prediction.structured_formatting?.secondary_text ? (
                      <Text style={styles.predictionSecondaryText}>
                        {prediction.structured_formatting.secondary_text}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : null}
        </View>

        <PassengerMap
          style={styles.map}
          region={mapRegion}
          defaultRegion={defaultRegion}
          markerCoordinate={selectedCoordinate}
          focusRegion={focusRegion}
          onRegionChangeComplete={setMapRegion}
          allowManualSelection
          onSelectCoordinate={(coordinate) => {
            setSelectedCoordinate(coordinate);
            setSearchQuery("");
            setPredictions([]);
            setSessionToken(createPlacesSessionToken());
          }}
          showsUserLocation
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.secondaryButton, requestingLocation ? styles.buttonDisabled : null]}
            onPress={handleUseMyLocation}
            disabled={requestingLocation}
          >
            {requestingLocation ? (
              <ActivityIndicator size="small" color="#61758A" />
            ) : (
              <Text style={styles.secondaryButtonText}>Usar mi ubicacion</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              !selectedCoordinate ? styles.buttonDisabled : null,
            ]}
            onPress={() => {
              if (selectedCoordinate) {
                onConfirm(selectedCoordinate);
              }
              onClose();
            }}
            disabled={!selectedCoordinate}
          >
            <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    color: "#61758A",
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "600",
    color: "#121417",
  },
  headerSpacer: {
    width: 64,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: "#FFFFFF",
    zIndex: 2,
  },
  searchInputWrapper: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputDisabled: {
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#121417",
  },
  searchSpinner: {
    marginLeft: 8,
  },
  searchHelper: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#61758A",
  },
  predictionsWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    maxHeight: 220,
    overflow: "hidden",
  },
  predictionsLoading: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  predictionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F2F5",
  },
  predictionPrimaryText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#121417",
  },
  predictionSecondaryText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#61758A",
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 15,
    color: "#121417",
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default LocationPickerModal;
