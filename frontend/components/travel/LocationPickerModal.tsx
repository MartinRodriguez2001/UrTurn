import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import PassengerMap from "../passenger/PassengerMap";
import type { MapCoordinate, MapRegion } from "../passenger/PassengerMap.types";

type LocationPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coordinate: MapCoordinate) => void;
  initialCoordinate?: MapCoordinate | null;
  defaultRegion?: MapRegion;
  userRegion?: MapCoordinate | null;
  title?: string;
  confirmLabel?: string;
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

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialCoordinate = null,
  defaultRegion = DEFAULT_REGION,
  userRegion = null,
  title = "Selecciona una ubicacion",
  confirmLabel = "Confirmar ubicacion",
}) => {
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
      const region = createRegionFromCoordinate(coordinate);
      setMapRegion(region);
      setFocusRegion(region);
    } catch (error) {
      console.warn("Unable to obtain current location", error);
    } finally {
      setRequestingLocation(false);
    }
  }, []);

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

        <PassengerMap
          style={styles.map}
          region={mapRegion}
          defaultRegion={defaultRegion}
          markerCoordinate={selectedCoordinate}
          focusRegion={focusRegion}
          onRegionChangeComplete={setMapRegion}
          allowManualSelection
          onSelectCoordinate={(coordinate) => setSelectedCoordinate(coordinate)}
          showsUserLocation
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setSelectedCoordinate(null);
              setMapRegion(defaultRegion);
              setFocusRegion(defaultRegion);
            }}
          >
            <Text style={styles.secondaryButtonText}>Limpiar selección</Text>
          </TouchableOpacity>

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
