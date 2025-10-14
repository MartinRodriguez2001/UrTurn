import React from 'react';
import MapView, { MapLongPressEvent, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { PassengerMapProps } from './PassengerMap.types';

const PassengerMap: React.FC<PassengerMapProps> = ({
    style,
    region,
    defaultRegion,
    markerCoordinate,
    focusRegion,
    onRegionChangeComplete,
    allowManualSelection = false,
    onSelectCoordinate,
}) => {
    const mapRef = React.useRef<MapView | null>(null);

    React.useEffect(() => {
        if (focusRegion && mapRef.current) {
            mapRef.current.animateToRegion(focusRegion, 600);
        }
    }, [focusRegion]);

    const handleMapLongPress = React.useCallback(
        (event: MapLongPressEvent) => {
            if (!allowManualSelection || !onSelectCoordinate) {
                return;
            }

            const { latitude, longitude } = event.nativeEvent.coordinate;
            onSelectCoordinate({ latitude, longitude });
        },
        [allowManualSelection, onSelectCoordinate],
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
            onLongPress={handleMapLongPress}
        >
            {markerCoordinate ? <Marker coordinate={markerCoordinate} /> : null}
        </MapView>
    );
};

export default PassengerMap;
