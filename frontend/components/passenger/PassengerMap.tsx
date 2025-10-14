import React from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { PassengerMapProps } from './PassengerMap.types';

const PassengerMap: React.FC<PassengerMapProps> = ({
    style,
    region,
    defaultRegion,
    markerCoordinate,
    focusRegion,
    onRegionChangeComplete,
}) => {
    const mapRef = React.useRef<MapView | null>(null);

    React.useEffect(() => {
        if (focusRegion && mapRef.current) {
            mapRef.current.animateToRegion(focusRegion, 600);
        }
    }, [focusRegion]);

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
        >
            {markerCoordinate ? <Marker coordinate={markerCoordinate} /> : null}
        </MapView>
    );
};

export default PassengerMap;

