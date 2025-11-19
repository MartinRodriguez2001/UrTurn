import React, {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { resolveGoogleMapsApiKey } from '@/utils/googleMaps';
import { loadGoogleMapsApi } from '@/utils/googleMapsLoader';

type LatLng = {
  latitude: number;
  longitude: number;
};

export type Region = LatLng & {
  latitudeDelta: number;
  longitudeDelta: number;
};

type CameraConfig = {
  center?: LatLng;
  zoom?: number;
  heading?: number;
  pitch?: number;
};

type FitToCoordinatesOptions = {
  edgePadding?: { top: number; right: number; bottom: number; left: number };
  animated?: boolean;
};

export type MapViewHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
  animateCamera: (config: CameraConfig, options?: { duration?: number }) => void;
  fitToCoordinates: (coordinates: LatLng[], options?: FitToCoordinatesOptions) => void;
};

export type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  region?: Region;
  onPress?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
  onLongPress?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
  onPanDrag?: () => void;
  onRegionChangeComplete?: (region: Region) => void;
  children?: React.ReactNode;
  toolbarEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
};

export type MarkerProps = {
  coordinate: LatLng;
  title?: string;
  description?: string;
};

export type PolylineProps = {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
};

export type CalloutProps = Record<string, never>;
export type CircleProps = Record<string, never>;

const DEFAULT_REGION: Region = {
  latitude: -33.4489,
  longitude: -70.6693,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

type MapContextValue = {
  map: any | null;
  google: any | null;
};

const MapContext = React.createContext<MapContextValue>({
  map: null,
  google: null,
});

const useMapContext = () => useContext(MapContext);

const toLatLngLiteral = (coordinate: LatLng | null | undefined) => ({
  lat: coordinate?.latitude ?? DEFAULT_REGION.latitude,
  lng: coordinate?.longitude ?? DEFAULT_REGION.longitude,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const regionToZoom = (region: Region | undefined): number => {
  if (!region) {
    return 12;
  }
  const delta = Math.max(region.latitudeDelta, region.longitudeDelta, 0.0002);
  const zoom = Math.log2(360 / delta);
  return clamp(Math.round(zoom), 3, 20);
};

const boundsToRegion = (bounds: any): Region => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    latitude: (ne.lat() + sw.lat()) / 2,
    longitude: (ne.lng() + sw.lng()) / 2,
    latitudeDelta: Math.abs(ne.lat() - sw.lat()),
    longitudeDelta: Math.abs(ne.lng() - sw.lng()),
  };
};

const MapView = React.forwardRef<MapViewHandle, MapViewProps>(
  (
    {
      style,
      initialRegion,
      region,
      onPress,
      onLongPress,
      onPanDrag,
      onRegionChangeComplete,
      children,
      toolbarEnabled = true,
      scrollEnabled = true,
      zoomEnabled = true,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any | null>(null);
    const [googleMaps, setGoogleMaps] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);

    const resolvedRegion = useMemo(
      () => region ?? initialRegion ?? DEFAULT_REGION,
      [initialRegion, region]
    );

    useEffect(() => {
      let isMounted = true;
      const apiKey = resolveGoogleMapsApiKey()?.trim();

      if (!apiKey) {
        setError('Configura EXPO_PUBLIC_GOOGLE_MAPS_ID para usar el mapa en web.');
        return;
      }

      loadGoogleMapsApi(apiKey)
        .then((googleInstance) => {
          if (!isMounted) {
            return;
          }
          setGoogleMaps(googleInstance);
          if (containerRef.current && !mapRef.current) {
            mapRef.current = new googleInstance.maps.Map(containerRef.current, {
              center: toLatLngLiteral(resolvedRegion),
              zoom: regionToZoom(resolvedRegion),
              mapTypeControl: false,
              fullscreenControl: false,
              streetViewControl: false,
              disableDefaultUI: !toolbarEnabled,
              gestureHandling: scrollEnabled ? 'greedy' : 'none',
              zoomControl: zoomEnabled,
            });
            setMapReady(true);
          }
        })
        .catch((err: Error) => {
          if (isMounted) {
            setError(err.message);
          }
        });

      return () => {
        isMounted = false;
      };
    }, [resolvedRegion, toolbarEnabled, scrollEnabled, zoomEnabled]);

    useEffect(() => {
      if (!mapRef.current || !googleMaps || !region) {
        return;
      }
      mapRef.current.panTo(toLatLngLiteral(region));
      mapRef.current.setZoom(regionToZoom(region));
    }, [region, googleMaps]);

    useEffect(() => {
      if (!mapRef.current || !googleMaps) {
        return;
      }

      const listeners: Array<{ remove?: () => void }> = [];

      if (onPress) {
        listeners.push(
          googleMaps.maps.event.addListener(mapRef.current, 'click', (event: any) => {
            if (!event.latLng) return;
            onPress({
              nativeEvent: {
                coordinate: {
                  latitude: event.latLng.lat(),
                  longitude: event.latLng.lng(),
                },
              },
            });
          })
        );
      }

      if (onLongPress) {
        listeners.push(
          googleMaps.maps.event.addListener(mapRef.current, 'rightclick', (event: any) => {
            if (!event.latLng) return;
            onLongPress({
              nativeEvent: {
                coordinate: {
                  latitude: event.latLng.lat(),
                  longitude: event.latLng.lng(),
                },
              },
            });
          })
        );
      }

      if (onPanDrag) {
        listeners.push(
          googleMaps.maps.event.addListener(mapRef.current, 'dragstart', () => {
            onPanDrag();
          })
        );
      }

      if (onRegionChangeComplete) {
        listeners.push(
          googleMaps.maps.event.addListener(mapRef.current, 'idle', () => {
            const bounds = mapRef.current?.getBounds();
            if (!bounds) return;
            onRegionChangeComplete(boundsToRegion(bounds));
          })
        );
      }

      return () => {
        listeners.forEach((listener) => listener.remove && listener.remove());
      };
    }, [googleMaps, onPress, onLongPress, onPanDrag, onRegionChangeComplete]);

    useImperativeHandle(
      ref,
      (): MapViewHandle => ({
        animateToRegion: (nextRegion: Region) => {
          if (!mapRef.current) return;
          mapRef.current.panTo(toLatLngLiteral(nextRegion));
          mapRef.current.setZoom(regionToZoom(nextRegion));
        },
        animateCamera: (config: CameraConfig) => {
          if (!mapRef.current) return;
          if (config.center) {
            mapRef.current.panTo(toLatLngLiteral(config.center));
          }
          if (typeof config.zoom === 'number') {
            mapRef.current.setZoom(clamp(config.zoom, 3, 20));
          }
          if (typeof config.heading === 'number' && mapRef.current.setHeading) {
            mapRef.current.setHeading(config.heading);
          }
          if (typeof config.pitch === 'number' && mapRef.current.setTilt) {
            mapRef.current.setTilt(config.pitch);
          }
        },
        fitToCoordinates: (coordinates: LatLng[], options?: FitToCoordinatesOptions) => {
          if (!mapRef.current || !googleMaps || !coordinates.length) {
            return;
          }
          const bounds = new googleMaps.maps.LatLngBounds();
          coordinates.forEach((coord) => bounds.extend(toLatLngLiteral(coord)));
          mapRef.current.fitBounds(bounds, options?.edgePadding);
        },
      }),
      [googleMaps]
    );

    const flattenedStyle = StyleSheet.flatten(style) ?? {};
    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      borderRadius: typeof flattenedStyle.borderRadius === 'number' ? flattenedStyle.borderRadius : 0,
      overflow: 'hidden',
    };

    return (
      <MapContext.Provider value={{ map: mapRef.current, google: googleMaps }}>
        <View style={style}>
          <div ref={containerRef} style={containerStyle} />
          {error ? (
            <View style={styles.errorOverlay} pointerEvents="none">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {!error && !mapReady ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <Text style={styles.loadingText}>Cargando mapa…</Text>
            </View>
          ) : null}
          {children}
        </View>
      </MapContext.Provider>
    );
  }
);

MapView.displayName = 'WebMapView';

export const Marker: React.FC<MarkerProps> = ({ coordinate, title }) => {
  const { map, google } = useMapContext();
  const markerRef = useRef<any | null>(null);

  useEffect(() => {
    if (!map || !google) return;
    markerRef.current = new google.maps.Marker({
      position: toLatLngLiteral(coordinate),
      map,
      title,
    });

    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
    };
  }, [map, google]);

  useEffect(() => {
    if (!markerRef.current) return;
    markerRef.current.setPosition(toLatLngLiteral(coordinate));
  }, [coordinate]);

  return null;
};

export const Polyline: React.FC<PolylineProps> = ({
  coordinates,
  strokeColor = '#2563EB',
  strokeWidth = 4,
}) => {
  const { map, google } = useMapContext();
  const polylineRef = useRef<any | null>(null);

  useEffect(() => {
    if (!map || !google) return;
    polylineRef.current = new google.maps.Polyline({
      map,
      path: coordinates.map(toLatLngLiteral),
      strokeColor,
      strokeWeight: strokeWidth,
    });

    return () => {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [map, google]);

  useEffect(() => {
    if (!polylineRef.current) return;
    polylineRef.current.setPath(coordinates.map(toLatLngLiteral));
    polylineRef.current.setOptions({ strokeColor, strokeWeight: strokeWidth });
  }, [coordinates, strokeColor, strokeWidth]);

  return null;
};

export const Callout = () => null;
export const Circle = () => null;
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default MapView;
