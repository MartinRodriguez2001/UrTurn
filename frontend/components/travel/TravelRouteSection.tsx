import * as Location from "expo-location";
import React from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { MapCoordinate, MapRegion } from "../passenger/PassengerMap.types";
import LocationPickerModal from "./LocationPickerModal";

export type PlacesAutocompletePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
};

type TravelRouteSectionProps = {
  title?: string;
  originLabel?: string;
  destinationLabel?: string;
  originPlaceholder?: string;
  destinationPlaceholder?: string;
  originValue: string;
  destinationValue: string;
  onChangeOrigin: (value: string) => void;
  onChangeDestination: (value: string) => void;
  originError?: string;
  destinationError?: string;
  googleMapsApiKey?: string;
  onSelectOriginPrediction?: (prediction: PlacesAutocompletePrediction) => void;
  onSelectDestinationPrediction?: (prediction: PlacesAutocompletePrediction) => void;
  onOriginCoordinateChange?: (coordinate: MapCoordinate | null) => void;
  onDestinationCoordinateChange?: (coordinate: MapCoordinate | null) => void;
  mapDefaultRegion?: MapRegion;
  originCoordinateValue?: MapCoordinate | null;
  destinationCoordinateValue?: MapCoordinate | null;
};

const DEFAULT_REGION: MapRegion = {
  latitude: 18.4655,
  longitude: -66.1057,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const createPlacesSessionToken = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;

export default function TravelRouteSection({
  title = "Ruta del viaje",
  originLabel = "Origen *",
  destinationLabel = "Destino *",
  originPlaceholder = "Ingresa tu punto de partida",
  destinationPlaceholder = "Ingresa tu destino",
  originValue,
  destinationValue,
  onChangeOrigin,
  onChangeDestination,
  originError,
  destinationError,
  googleMapsApiKey,
  onSelectOriginPrediction,
  onSelectDestinationPrediction,
  onOriginCoordinateChange,
  onDestinationCoordinateChange,
  mapDefaultRegion = DEFAULT_REGION,
  originCoordinateValue = null,
  destinationCoordinateValue = null,
}: TravelRouteSectionProps) {
  const [originQuery, setOriginQuery] = React.useState(originValue);
  const [destinationQuery, setDestinationQuery] = React.useState(destinationValue);
  const [originPredictions, setOriginPredictions] = React.useState<PlacesAutocompletePrediction[]>([]);
  const [destinationPredictions, setDestinationPredictions] =
    React.useState<PlacesAutocompletePrediction[]>([]);
  const [originLoading, setOriginLoading] = React.useState(false);
  const [destinationLoading, setDestinationLoading] = React.useState(false);
  const [focusedField, setFocusedField] = React.useState<"origin" | "destination" | null>(null);
  const [originSessionToken, setOriginSessionToken] = React.useState(createPlacesSessionToken);
  const [destinationSessionToken, setDestinationSessionToken] = React.useState(createPlacesSessionToken);
  const [originPickerVisible, setOriginPickerVisible] = React.useState(false);
  const [destinationPickerVisible, setDestinationPickerVisible] = React.useState(false);
  const [originCoordinate, setOriginCoordinate] = React.useState<MapCoordinate | null>(
    originCoordinateValue,
  );
  const [destinationCoordinate, setDestinationCoordinate] = React.useState<MapCoordinate | null>(
    destinationCoordinateValue,
  );
  const [userRegion, setUserRegion] = React.useState<MapCoordinate | null>(null);
  const [requestingUserRegion, setRequestingUserRegion] = React.useState(false);

  const trimmedApiKey = googleMapsApiKey?.trim();
  const isAutocompleteEnabled = Boolean(trimmedApiKey);
  const skipOriginAutocompleteRef = React.useRef(false);
  const skipDestinationAutocompleteRef = React.useRef(false);

  React.useEffect(() => {
    setOriginQuery(originValue);
  }, [originValue]);

  React.useEffect(() => {
    setDestinationQuery(destinationValue);
  }, [destinationValue]);

  React.useEffect(() => {
    setOriginCoordinate(originCoordinateValue ?? null);
  }, [originCoordinateValue]);

  React.useEffect(() => {
    setDestinationCoordinate(destinationCoordinateValue ?? null);
  }, [destinationCoordinateValue]);

  React.useEffect(() => {
    if (skipOriginAutocompleteRef.current) {
      skipOriginAutocompleteRef.current = false;
      return;
    }

    if (!isAutocompleteEnabled) {
      setOriginPredictions([]);
      setOriginLoading(false);
      return;
    }

    if (!originQuery || originQuery.trim().length < 2) {
      setOriginPredictions([]);
      setOriginLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setOriginLoading(true);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            originQuery.trim(),
          )}&key=${trimmedApiKey}&language=es&sessiontoken=${originSessionToken}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: { predictions: PlacesAutocompletePrediction[]; status: string } =
          await response.json();

        if (data.status === "OK") {
          setOriginPredictions(data.predictions);
        } else {
          setOriginPredictions([]);
          if (data.status !== "ZERO_RESULTS") {
            console.warn(`Google Places autocomplete (origin) returned status ${data.status}`);
          }
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Error fetching origin suggestions", error);
        setOriginPredictions([]);
      } finally {
        setOriginLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [originQuery, originSessionToken, trimmedApiKey, isAutocompleteEnabled]);

  React.useEffect(() => {
    if (skipDestinationAutocompleteRef.current) {
      skipDestinationAutocompleteRef.current = false;
      return;
    }

    if (!isAutocompleteEnabled) {
      setDestinationPredictions([]);
      setDestinationLoading(false);
      return;
    }

    if (!destinationQuery || destinationQuery.trim().length < 2) {
      setDestinationPredictions([]);
      setDestinationLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setDestinationLoading(true);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            destinationQuery.trim(),
          )}&key=${trimmedApiKey}&language=es&sessiontoken=${destinationSessionToken}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: { predictions: PlacesAutocompletePrediction[]; status: string } =
          await response.json();

        if (data.status === "OK") {
          setDestinationPredictions(data.predictions);
        } else {
          setDestinationPredictions([]);
          if (data.status !== "ZERO_RESULTS") {
            console.warn(`Google Places autocomplete (destination) returned status ${data.status}`);
          }
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Error fetching destination suggestions", error);
        setDestinationPredictions([]);
      } finally {
        setDestinationLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [destinationQuery, destinationSessionToken, trimmedApiKey, isAutocompleteEnabled]);

  const formatPredictionLabel = React.useCallback((prediction: PlacesAutocompletePrediction) => {
    const primary = prediction.structured_formatting?.main_text ?? prediction.description;
    const secondary = prediction.structured_formatting?.secondary_text;
    return secondary ? `${primary}, ${secondary}` : primary;
  }, []);

  const scheduleHidePredictions = React.useCallback((field: "origin" | "destination") => {
    setTimeout(() => {
      setFocusedField((current) => (current === field ? null : current));
    }, 150);
  }, []);

  const requestUserRegion = React.useCallback(async (): Promise<MapCoordinate | null> => {
    try {
      setRequestingUserRegion(true);
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return null;
      }
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinate: MapCoordinate = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setUserRegion(coordinate);
      return coordinate;
    } catch (error) {
      console.warn("Unable to obtain current location", error);
      return null;
    } finally {
      setRequestingUserRegion(false);
    }
  }, []);

  React.useEffect(() => {
    if ((originPickerVisible || destinationPickerVisible) && !userRegion && !requestingUserRegion) {
      void requestUserRegion();
    }
  }, [originPickerVisible, destinationPickerVisible, userRegion, requestingUserRegion, requestUserRegion]);

  const reverseGeocodeCoordinate = React.useCallback(
    async (coordinate: MapCoordinate) => {
      if (!trimmedApiKey) {
        return `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`;
      }
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${trimmedApiKey}&language=es`,
        );
        if (!response.ok) {
          throw new Error(`Reverse geocode failed with status ${response.status}`);
        }
        const data: { status: string; results: Array<{ formatted_address: string }> } =
          await response.json();
        if (data.status === "OK" && data.results.length > 0) {
          return data.results[0].formatted_address;
        }
      } catch (error) {
        console.warn("Error reverse geocoding coordinate", error);
      }
      return `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`;
    },
    [trimmedApiKey],
  );

  const handleOriginChange = React.useCallback(
    (text: string) => {
      setOriginQuery(text);
      onChangeOrigin(text);
      setOriginPredictions([]);
      setOriginCoordinate(null);
      onOriginCoordinateChange?.(null);
      setOriginSessionToken(createPlacesSessionToken());
    },
    [onChangeOrigin, onOriginCoordinateChange],
  );

  const handleDestinationChange = React.useCallback(
    (text: string) => {
      setDestinationQuery(text);
      onChangeDestination(text);
      setDestinationPredictions([]);
      setDestinationCoordinate(null);
      onDestinationCoordinateChange?.(null);
      setDestinationSessionToken(createPlacesSessionToken());
    },
    [onChangeDestination, onDestinationCoordinateChange],
  );

  const handleSelectOrigin = React.useCallback(
    (prediction: PlacesAutocompletePrediction) => {
      const formattedLabel = formatPredictionLabel(prediction);
      skipOriginAutocompleteRef.current = true;
      onChangeOrigin(formattedLabel);
      setOriginQuery(formattedLabel);
      setOriginPredictions([]);
      setOriginCoordinate(null);
      onOriginCoordinateChange?.(null);
      setOriginSessionToken(createPlacesSessionToken());
      setFocusedField(null);
      onSelectOriginPrediction?.(prediction);
      Keyboard.dismiss();
    },
    [formatPredictionLabel, onChangeOrigin, onSelectOriginPrediction, onOriginCoordinateChange],
  );

  const handleSelectDestination = React.useCallback(
    (prediction: PlacesAutocompletePrediction) => {
      const formattedLabel = formatPredictionLabel(prediction);
      skipDestinationAutocompleteRef.current = true;
      onChangeDestination(formattedLabel);
      setDestinationQuery(formattedLabel);
      setDestinationPredictions([]);
      setDestinationCoordinate(null);
      onDestinationCoordinateChange?.(null);
      setDestinationSessionToken(createPlacesSessionToken());
      setFocusedField(null);
      onSelectDestinationPrediction?.(prediction);
      Keyboard.dismiss();
    },
    [formatPredictionLabel, onChangeDestination, onSelectDestinationPrediction, onDestinationCoordinateChange],
  );

  const handleOriginCoordinateConfirm = React.useCallback(
    async (coordinate: MapCoordinate) => {
      setOriginCoordinate(coordinate);
      onOriginCoordinateChange?.(coordinate);
      skipOriginAutocompleteRef.current = true;
      setOriginLoading(true);
      const label = await reverseGeocodeCoordinate(coordinate);
      setOriginLoading(false);
      setOriginPredictions([]);
      onChangeOrigin(label);
      setOriginQuery(label);
      setOriginSessionToken(createPlacesSessionToken());
      setFocusedField(null);
      Keyboard.dismiss();
    },
    [onChangeOrigin, onOriginCoordinateChange, reverseGeocodeCoordinate],
  );

  const handleDestinationCoordinateConfirm = React.useCallback(
    async (coordinate: MapCoordinate) => {
      setDestinationCoordinate(coordinate);
      onDestinationCoordinateChange?.(coordinate);
      skipDestinationAutocompleteRef.current = true;
      setDestinationLoading(true);
      const label = await reverseGeocodeCoordinate(coordinate);
      setDestinationLoading(false);
      setDestinationPredictions([]);
      onChangeDestination(label);
      setDestinationQuery(label);
      setDestinationSessionToken(createPlacesSessionToken());
      setFocusedField(null);
      Keyboard.dismiss();
    },
    [onChangeDestination, onDestinationCoordinateChange, reverseGeocodeCoordinate],
  );

  const showOriginPredictions =
    focusedField === "origin" && (originLoading || originPredictions.length > 0) && isAutocompleteEnabled;
  const showDestinationPredictions =
    focusedField === "destination" &&
    (destinationLoading || destinationPredictions.length > 0) &&
    isAutocompleteEnabled;

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{originLabel}</Text>
        <View style={styles.fieldRow}>
          <TextInput
            style={[styles.input, originError ? styles.inputError : null]}
            placeholder={originPlaceholder}
            placeholderTextColor="#876363"
            value={originQuery}
            onChangeText={handleOriginChange}
            onFocus={() => setFocusedField("origin")}
            onBlur={() => scheduleHidePredictions("origin")}
          />
          <TouchableOpacity
            style={styles.mapButton}
            accessibilityLabel="Seleccionar origen en el mapa"
            onPress={() => {
              setFocusedField(null);
              setOriginPickerVisible(true);
            }}
          >
            <Text style={styles.mapButtonLabel}>🗺️</Text>
          </TouchableOpacity>
        </View>
        {originError ? <Text style={styles.errorText}>{originError}</Text> : null}
        {!isAutocompleteEnabled ? (
          <Text style={styles.helperInfo}>
            Configura tu clave de Google Maps para habilitar las sugerencias automaticas.
          </Text>
        ) : null}
        {showOriginPredictions ? (
          <View style={styles.predictionsWrapper}>
            {originLoading ? (
              <View style={styles.predictionsLoading}>
                <ActivityIndicator size="small" color="#61758A" />
              </View>
            ) : null}
            {originPredictions.map((prediction) => (
              <TouchableOpacity
                key={prediction.place_id}
                onPress={() => handleSelectOrigin(prediction)}
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
            ))}
          </View>
        ) : null}
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={styles.inlineButton}
            onPress={() => {
              setFocusedField(null);
              setOriginPickerVisible(true);
            }}
          >
            <Text style={styles.inlineButtonText}>Abrir mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inlineButton, requestingUserRegion ? styles.buttonDisabled : null]}
            onPress={async () => {
              const coordinate = await requestUserRegion();
              if (coordinate) {
                await handleOriginCoordinateConfirm(coordinate);
              }
            }}
            disabled={requestingUserRegion}
          >
            {requestingUserRegion ? (
              <ActivityIndicator size="small" color="#61758A" />
            ) : (
              <Text style={styles.inlineButtonText}>Usar mi ubicacion</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{destinationLabel}</Text>
        <View style={styles.fieldRow}>
          <TextInput
            style={[styles.input, destinationError ? styles.inputError : null]}
            placeholder={destinationPlaceholder}
            placeholderTextColor="#876363"
            value={destinationQuery}
            onChangeText={handleDestinationChange}
            onFocus={() => setFocusedField("destination")}
            onBlur={() => scheduleHidePredictions("destination")}
          />
          <TouchableOpacity
            style={styles.mapButton}
            accessibilityLabel="Seleccionar destino en el mapa"
            onPress={() => {
              setFocusedField(null);
              setDestinationPickerVisible(true);
            }}
          >
            <Text style={styles.mapButtonLabel}>🗺️</Text>
          </TouchableOpacity>
        </View>
        {destinationError ? <Text style={styles.errorText}>{destinationError}</Text> : null}
        {showDestinationPredictions ? (
          <View style={styles.predictionsWrapper}>
            {destinationLoading ? (
              <View style={styles.predictionsLoading}>
                <ActivityIndicator size="small" color="#61758A" />
              </View>
            ) : null}
            {destinationPredictions.map((prediction) => (
              <TouchableOpacity
                key={prediction.place_id}
                onPress={() => handleSelectDestination(prediction)}
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
            ))}
          </View>
        ) : null}
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={styles.inlineButton}
            onPress={() => {
              setFocusedField(null);
              setDestinationPickerVisible(true);
            }}
          >
            <Text style={styles.inlineButtonText}>Abrir mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inlineButton, requestingUserRegion ? styles.buttonDisabled : null]}
            onPress={async () => {
              const coordinate = await requestUserRegion();
              if (coordinate) {
                await handleDestinationCoordinateConfirm(coordinate);
              }
            }}
            disabled={requestingUserRegion}
          >
            {requestingUserRegion ? (
              <ActivityIndicator size="small" color="#61758A" />
            ) : (
              <Text style={styles.inlineButtonText}>Usar mi ubicacion</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <LocationPickerModal
        key="originPicker"
        visible={originPickerVisible}
        onClose={() => setOriginPickerVisible(false)}
        onConfirm={handleOriginCoordinateConfirm}
        initialCoordinate={originCoordinate}
        defaultRegion={mapDefaultRegion}
        userRegion={userRegion}
        title="Selecciona el punto de partida"
        confirmLabel="Confirmar origen"
      />

      <LocationPickerModal
        key="destinationPicker"
        visible={destinationPickerVisible}
        onClose={() => setDestinationPickerVisible(false)}
        onConfirm={handleDestinationCoordinateConfirm}
        initialCoordinate={destinationCoordinate}
        defaultRegion={mapDefaultRegion}
        userRegion={userRegion}
        title="Selecciona el destino"
        confirmLabel="Confirmar destino"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 18,
    fontWeight: "700",
    color: "#121417",
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FDF8F5",
    paddingHorizontal: 16,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#121417",
  },
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  mapButtonLabel: {
    fontSize: 20,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#EF4444",
  },
  helperInfo: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#61758A",
  },
  inlineActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  inlineButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    fontWeight: "600",
    color: "#121417",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  predictionsWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    marginTop: 4,
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
});

