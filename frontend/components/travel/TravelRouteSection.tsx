import * as Location from "expo-location";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { MapCoordinate, MapRegion } from "../passenger/PassengerMap.types";
import LocationPickerModal from "./LocationPickerModal";

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
  onOriginCoordinateChange,
  onDestinationCoordinateChange,
  mapDefaultRegion = DEFAULT_REGION,
  originCoordinateValue = null,
  destinationCoordinateValue = null,
}: TravelRouteSectionProps) {
  const [originLoading, setOriginLoading] = React.useState(false);
  const [destinationLoading, setDestinationLoading] = React.useState(false);
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
  const hasPlacesSearch = Boolean(trimmedApiKey);

  React.useEffect(() => {
    setOriginCoordinate(originCoordinateValue ?? null);
  }, [originCoordinateValue]);

  React.useEffect(() => {
    setDestinationCoordinate(destinationCoordinateValue ?? null);
  }, [destinationCoordinateValue]);

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
        const data: { status: string; results: { formatted_address: string }[] } =
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

  const handleOriginCoordinateConfirm = React.useCallback(
    async (coordinate: MapCoordinate) => {
      setOriginCoordinate(coordinate);
      onOriginCoordinateChange?.(coordinate);
      setOriginLoading(true);
      try {
        const label = await reverseGeocodeCoordinate(coordinate);
        onChangeOrigin(label);
      } finally {
        setOriginLoading(false);
      }
    },
    [onChangeOrigin, onOriginCoordinateChange, reverseGeocodeCoordinate],
  );

  const handleDestinationCoordinateConfirm = React.useCallback(
    async (coordinate: MapCoordinate) => {
      setDestinationCoordinate(coordinate);
      onDestinationCoordinateChange?.(coordinate);
      setDestinationLoading(true);
      try {
        const label = await reverseGeocodeCoordinate(coordinate);
        onChangeDestination(label);
      } finally {
        setDestinationLoading(false);
      }
    },
    [onChangeDestination, onDestinationCoordinateChange, reverseGeocodeCoordinate],
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{originLabel}</Text>
        <TouchableOpacity
          style={[
            styles.selectionButton,
            originError ? styles.selectionButtonError : null,
            originLoading ? styles.buttonDisabled : null,
          ]}
          onPress={() => setOriginPickerVisible(true)}
          disabled={originLoading}
        >
          <View style={styles.selectionContent}>
            {originLoading ? (
              <ActivityIndicator size="small" color="#61758A" />
            ) : (
              <Text
                style={originValue ? styles.selectionText : styles.selectionPlaceholder}
                numberOfLines={2}
              >
                {originValue || originPlaceholder}
              </Text>
            )}
            <Text style={styles.selectionIcon}></Text>
          </View>
        </TouchableOpacity>
        {originError ? <Text style={styles.errorText}>{originError}</Text> : null}
        {!hasPlacesSearch ? (
          <Text style={styles.helperInfo}>
            Configura tu clave de Google Maps para habilitar la búsqueda de direcciones.
          </Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{destinationLabel}</Text>
        <TouchableOpacity
          style={[
            styles.selectionButton,
            destinationError ? styles.selectionButtonError : null,
            destinationLoading ? styles.buttonDisabled : null,
          ]}
          onPress={() => setDestinationPickerVisible(true)}
          disabled={destinationLoading}
        >
          <View style={styles.selectionContent}>
            {destinationLoading ? (
              <ActivityIndicator size="small" color="#61758A" />
            ) : (
              <Text
                style={destinationValue ? styles.selectionText : styles.selectionPlaceholder}
                numberOfLines={2}
              >
                {destinationValue || destinationPlaceholder}
              </Text>
            )}
            <Text style={styles.selectionIcon}></Text>
          </View>
        </TouchableOpacity>
        {destinationError ? <Text style={styles.errorText}>{destinationError}</Text> : null}
      </View>

      <LocationPickerModal
        visible={originPickerVisible}
        onClose={() => setOriginPickerVisible(false)}
        onConfirm={handleOriginCoordinateConfirm}
        initialCoordinate={originCoordinate}
        defaultRegion={mapDefaultRegion}
        userRegion={userRegion}
        title="Selecciona el punto de partida"
        confirmLabel="Confirmar origen"
        googleMapsApiKey={trimmedApiKey}
        initialQuery={originValue}
        searchPlaceholder="Buscar dirección de origen"
      />

      <LocationPickerModal
        visible={destinationPickerVisible}
        onClose={() => setDestinationPickerVisible(false)}
        onConfirm={handleDestinationCoordinateConfirm}
        initialCoordinate={destinationCoordinate}
        defaultRegion={mapDefaultRegion}
        userRegion={userRegion}
        title="Selecciona el destino"
        confirmLabel="Confirmar destino"
        googleMapsApiKey={trimmedApiKey}
        initialQuery={destinationValue}
        searchPlaceholder="Buscar dirección de destino"
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
  selectionButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FDF8F5",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  selectionButtonError: {
    borderColor: "#EF4444",
  },
  selectionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectionText: {
    flex: 1,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#121417",
  },
  selectionPlaceholder: {
    flex: 1,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#9CA3AF",
  },
  selectionIcon: {
    fontSize: 20,
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
  buttonDisabled: {
    opacity: 0.6,
  },
});

