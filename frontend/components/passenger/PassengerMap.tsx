import React from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { PassengerMapProps } from './PassengerMap.types';

type MapGestureEvent = {
    nativeEvent: {
        coordinate: {
            latitude: number;
            longitude: number;
        };
    };
};

const PassengerMap: React.FC<PassengerMapProps> = ({
    style,
    region,
    defaultRegion,
    markerCoordinate,
    focusRegion,
    onRegionChangeComplete,
    allowManualSelection = false,
    onSelectCoordinate,
    showsUserLocation = false,
}) => {
    const mapRef = React.useRef<MapView | null>(null);

    const selectCoordinate = React.useCallback(
        ({ latitude, longitude }: { latitude: number; longitude: number }) => {
            if (!allowManualSelection || !onSelectCoordinate) {
                return;
            }

            onSelectCoordinate({ latitude, longitude });
        },
        [allowManualSelection, onSelectCoordinate],
    );

    React.useEffect(() => {
        if (focusRegion && mapRef.current) {
            mapRef.current.animateToRegion(focusRegion, 600);
        }
    }, [focusRegion]);

    const handleMapLongPress = React.useCallback(
        (event: MapGestureEvent) => {
            selectCoordinate(event.nativeEvent.coordinate);
        },
        [selectCoordinate],
    );

    const handleMapPress = React.useCallback(
        (event: MapGestureEvent) => {
            selectCoordinate(event.nativeEvent.coordinate);
        },
        [selectCoordinate],
    );

    return (
        <MapView
            ref={mapRef}
            style={style}
            provider={PROVIDER_GOOGLE}
            region={region}
            initialRegion={defaultRegion}
            showsBuildings
            showsCompass
            showsIndoors={false}
            toolbarEnabled={false}
            onRegionChangeComplete={onRegionChangeComplete}
            onPress={handleMapPress}
            onLongPress={handleMapLongPress}
            showsUserLocation={showsUserLocation}
        >
            {markerCoordinate ? <Marker coordinate={markerCoordinate} /> : null}
        </MapView>
    );
};

export default PassengerMap;
