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

  const trimmedApiKey = googleMapsApiKey?.trim();
  const isAutocompleteEnabled = Boolean(trimmedApiKey);

  React.useEffect(() => {
    setOriginQuery(originValue);
  }, [originValue]);

  React.useEffect(() => {
    setDestinationQuery(destinationValue);
  }, [destinationValue]);

  React.useEffect(() => {
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

  const handleOriginChange = React.useCallback(
    (text: string) => {
      setOriginQuery(text);
      onChangeOrigin(text);
      if (text.length === 0) {
        setOriginPredictions([]);
        setOriginSessionToken(createPlacesSessionToken());
      }
    },
    [onChangeOrigin],
  );

  const handleDestinationChange = React.useCallback(
    (text: string) => {
      setDestinationQuery(text);
      onChangeDestination(text);
      if (text.length === 0) {
        setDestinationPredictions([]);
        setDestinationSessionToken(createPlacesSessionToken());
      }
    },
    [onChangeDestination],
  );

  const handleSelectOrigin = React.useCallback(
    (prediction: PlacesAutocompletePrediction) => {
      const formattedLabel = formatPredictionLabel(prediction);
      onChangeOrigin(formattedLabel);
      setOriginQuery(formattedLabel);
      setOriginPredictions([]);
      setOriginSessionToken(createPlacesSessionToken());
      setFocusedField(null);
      onSelectOriginPrediction?.(prediction);
      Keyboard.dismiss();
    },
    [formatPredictionLabel, onChangeOrigin, onSelectOriginPrediction],
  );

  const handleSelectDestination = React.useCallback(
    (prediction: PlacesAutocompletePrediction) => {
      const formattedLabel = formatPredictionLabel(prediction);
      onChangeDestination(formattedLabel);
      setDestinationQuery(formattedLabel);
      setDestinationPredictions([]);
      setDestinationSessionToken(createPlacesSessionToken());
      setFocusedField(null);
      onSelectDestinationPrediction?.(prediction);
      Keyboard.dismiss();
    },
    [formatPredictionLabel, onChangeDestination, onSelectDestinationPrediction],
  );

  const scheduleHidePredictions = React.useCallback((field: "origin" | "destination") => {
    setTimeout(() => {
      setFocusedField((current) => (current === field ? null : current));
    }, 150);
  }, []);

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
        <TextInput
          style={[styles.input, originError ? styles.inputError : null]}
          placeholder={originPlaceholder}
          placeholderTextColor="#876363"
          value={originQuery}
          onChangeText={handleOriginChange}
          onFocus={() => setFocusedField("origin")}
          onBlur={() => scheduleHidePredictions("origin")}
        />
        {originError ? <Text style={styles.errorText}>{originError}</Text> : null}
        {!isAutocompleteEnabled ? (
          <Text style={styles.helperInfo}>
            Configura tu clave de Google Maps para habilitar las sugerencias automáticas.
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
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{destinationLabel}</Text>
        <TextInput
          style={[styles.input, destinationError ? styles.inputError : null]}
          placeholder={destinationPlaceholder}
          placeholderTextColor="#876363"
          value={destinationQuery}
          onChangeText={handleDestinationChange}
          onFocus={() => setFocusedField("destination")}
          onBlur={() => scheduleHidePredictions("destination")}
        />
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
      </View>
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
  input: {
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
  predictionsWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 200,
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
