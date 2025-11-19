import React from 'react';
import { Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from '@/components/common/MapView';
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

    const isWeb = Platform.OS === 'web';
    const regionProps = isWeb
        ? {
            initialRegion: region ?? defaultRegion,
        }
        : {
            region,
            initialRegion: defaultRegion,
        };

    return (
        <MapView
            ref={mapRef}
            style={style}
            provider={PROVIDER_GOOGLE}
            {...regionProps}
            showsBuildings
            showsCompass
            showsIndoors={false}
            toolbarEnabled={false}
            onRegionChangeComplete={isWeb ? undefined : onRegionChangeComplete}
            onPress={handleMapPress}
            onLongPress={handleMapLongPress}
            showsUserLocation={showsUserLocation}
        >
            {markerCoordinate ? <Marker coordinate={markerCoordinate} /> : null}
        </MapView>
    );
};

export default PassengerMap;
