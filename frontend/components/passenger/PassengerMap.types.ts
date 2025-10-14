import type { StyleProp, ViewStyle } from 'react-native';

export type MapCoordinate = {
    latitude: number;
    longitude: number;
};

export type MapRegion = MapCoordinate & {
    latitudeDelta: number;
    longitudeDelta: number;
};

export type PassengerMapProps = {
    style?: StyleProp<ViewStyle>;
    region: MapRegion;
    defaultRegion: MapRegion;
    markerCoordinate: MapCoordinate | null;
    focusRegion?: MapRegion | null;
    onRegionChangeComplete?: (region: MapRegion) => void;
    allowManualSelection?: boolean;
    onSelectCoordinate?: (coordinate: MapCoordinate) => void;
};
