import { getSocket } from '@/Services/SocketService';
import travelApiService from '@/Services/TravelApiService';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const formatTime = (value?: string | Date | null) => {
  if (!value) return "--:--";
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
};

const imgDepth3Frame0 =
  "http://localhost:3845/assets/3ab3b593cae411b8b40712ecfd81d32371f70de9.png";
const imgCapturaDePantalla20250928ALaS95019PM1 =
  "http://localhost:3845/assets/69638cdc46134bbf50435d968c296dcb4b5054fe.png";
const imgCapturaDePantalla20250928ALaS95151PM1 =
  "http://localhost:3845/assets/7ad11b481bbb1fcf2d8ffe7c4acd74cfff1934f8.png";
const imgDepth4Frame0 =
  "http://localhost:3845/assets/45cbddf4ea78015be6a898e3eff4d182ef6ed62d.svg";
const imgVector1 =
  "http://localhost:3845/assets/b6574480d4398ca143796040abbf81574adb02d5.svg";
const imgVector2 =
  "http://localhost:3845/assets/3370ea0928ad54a8bdeb6d9fdee45593bd3b265e.svg";
const imgDepth4Frame1 =
  "http://localhost:3845/assets/629cc3192dacb040da73496cb8c1c028c2e2e4ea.svg";

export default function PassengerOnTravel() {
  const router = useRouter();
  const params = useLocalSearchParams<{ travelId?: string }>();
  const travelId = useMemo(() => {
    if (!params.travelId) return undefined;
    const parsed = Number(params.travelId);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [params.travelId]);

  const [travel, setTravel] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [driverPosition, setDriverPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [driverHeading, setDriverHeading] = useState<number>(0);
  const [isBottomSheetCollapsed, setIsBottomSheetCollapsed] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
  const [isFollowingUser, setIsFollowingUser] = useState(true);

  const mapRef = useRef<MapView | null>(null);
  const sheetHeightRef = useRef(0);

  useEffect(() => {
    let interval: any = null;
    let mounted = true;

    const fetchTravel = async () => {
      if (!travelId) return;
      setLoading(true);
      try {
        const res = await travelApiService.getTravelById(travelId);
        const t = res?.travel ?? null;
        if (!mounted) return;
        setTravel(t);

        // tolerant extraction of driver coordinates
        const tt: any = t;
        const lat = (tt && (tt.current_latitude ?? tt.driver_latitude ?? tt.latitude ?? tt.location?.latitude ?? tt.driver_location?.latitude ?? tt.driver?.latitude)) || null;
        const lng = (tt && (tt.current_longitude ?? tt.driver_longitude ?? tt.longitude ?? tt.location?.longitude ?? tt.driver_location?.longitude ?? tt.driver?.longitude)) || null;
        if (lat !== null && lng !== null) {
          const nlat = Number(lat);
          const nlng = Number(lng);
          if (!Number.isNaN(nlat) && !Number.isNaN(nlng)) {
            setDriverPosition({ latitude: nlat, longitude: nlng });
          }
        }
      } catch (e) {
        console.warn('Error fetching travel for passenger view', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTravel();
    interval = setInterval(fetchTravel, 5000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [travelId]);

  useEffect(() => {
    let socket: any | null = null;
    let joined = false;
    let mounted = true;

    const startSocket = async () => {
      if (!travelId) return;
      try {
        socket = await getSocket();
        socket.emit('chat:join', Number(travelId), (resp: any) => {
          joined = true;
        });

        socket.on('travel:vehicle:position', (payload: any) => {
          if (!mounted) return;
          try {
            const p = payload || {};
            const lat = Number(p.latitude ?? p.lat ?? p.latitud ?? (p.position && p.position.latitude));
            const lng = Number(p.longitude ?? p.lng ?? p.long ?? p.longitud ?? (p.position && p.position.longitude));
            const heading = Number(p.heading ?? p.bearing ?? p.direction ?? p.course ?? NaN);
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              setDriverPosition({ latitude: lat, longitude: lng });
            }
            if (!Number.isNaN(heading)) {
              setDriverHeading(heading);
            }
          } catch (e) {
            // ignore
          }
        });
      } catch (e) {
        // ignore, rely on polling
      }
    };

    startSocket();

    return () => {
      mounted = false;
      if (socket && joined) {
        try {
          socket.emit('chat:leave', Number(travelId), () => {});
        } catch (e) {}
      }
    };
  }, [travelId]);

  const stops = useMemo(() => {
    const s: any[] = [];
    const startLat = travel?.start_latitude ?? travel?.startLatitude ?? travel?.start?.latitude;
    const startLng = travel?.start_longitude ?? travel?.startLongitude ?? travel?.start?.longitude;
    if (startLat && startLng) {
      s.push({ key: 'start', coordinate: { latitude: Number(startLat), longitude: Number(startLng) }, label: 'Inicio del viaje', type: 'start' });
    }
    if (Array.isArray(travel?.planned_stops)) {
      travel.planned_stops.forEach((ps: any, i: number) => {
        const lat = Number(ps.latitude ?? ps.lat ?? ps.start_latitude);
        const lng = Number(ps.longitude ?? ps.long ?? ps.start_longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          s.push({ key: 'planned-' + i, coordinate: { latitude: lat, longitude: lng }, label: ps.locationName ?? 'Parada', type: ps.type ?? 'pickup' });
        }
      });
    }
    const endLat = travel?.end_latitude ?? travel?.endLatitude ?? travel?.end?.latitude;
    const endLng = travel?.end_longitude ?? travel?.endLongitude ?? travel?.end?.longitude;
    if (endLat && endLng) {
      s.push({ key: 'end', coordinate: { latitude: Number(endLat), longitude: Number(endLng) }, label: 'Destino', type: 'end' });
    }
    return s;
  }, [travel]);

  // Helpers to compute distances so we can mark stops as visited based on driver position
  const deg2rad = (value: number) => (value * Math.PI) / 180;
  const getDistanceMeters = (origin: { latitude: number; longitude: number } | null | undefined, destination: { latitude: number; longitude: number }) => {
    if (!origin) return Number.POSITIVE_INFINITY;
    const R = 6371000;
    const dLat = deg2rad(destination.latitude - origin.latitude);
    const dLon = deg2rad(destination.longitude - origin.longitude);
    const lat1 = deg2rad(origin.latitude);
    const lat2 = deg2rad(destination.latitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const STOP_VISIT_DISTANCE_METERS = 60;

  // derive visited stops from current driverPosition
  const visitedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!driverPosition) return map;
    for (const stop of stops) {
      const dist = getDistanceMeters(driverPosition, stop.coordinate);
      map[stop.key] = dist <= STOP_VISIT_DISTANCE_METERS;
    }
    return map;
  }, [stops, driverPosition]);

  const nextStop = useMemo(() => {
    // exclude start type as next stop if it's the first
    return stops.find((s) => s.type !== 'start' && !visitedMap[s.key]) ?? (stops.length ? stops[0] : null);
  }, [stops, visitedMap]);
  const arrivalEstimateText = formatTime(travel?.end_time ?? travel?.start_time ?? null);

  const handleBack = () => router.back();

  const toggleBottomSheet = () => setIsBottomSheetCollapsed((p) => !p);

  const handleEnableFollow = () => {
    setIsFollowingUser(true);
    if (driverPosition && mapRef.current) {
      mapRef.current.animateCamera({ center: driverPosition, zoom: 18 }, { duration: 700 });
    }
  };

  const centerOnDriver = () => {
    if (!driverPosition || !mapRef.current) return;
    try {
      mapRef.current.animateToRegion({
        latitude: driverPosition.latitude,
        longitude: driverPosition.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: driverPosition?.latitude ?? (travel?.start_latitude ?? -33.4273),
            longitude: driverPosition?.longitude ?? (travel?.start_longitude ?? -70.55),
            latitudeDelta: 0.09,
            longitudeDelta: 0.09,
          }}
        >
          {Array.isArray(travel?.route_waypoints) && travel.route_waypoints.length >= 2 ? (
            <Polyline coordinates={travel.route_waypoints.map((p: any) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }))} strokeColor="#2563EB" strokeWidth={4} />
          ) : null}

          {stops.map((stop) => {
            const isNext = nextStop?.key === stop.key;
            const markerStyle = [styles.stopMarker, isNext && styles.stopMarkerNext];
            let icon: React.ComponentProps<typeof Feather>["name"] = 'map-pin';
            if (stop.type === 'start') icon = 'play';
            else if (stop.type === 'end') icon = 'flag';
            else if (stop.type === 'pickup') icon = 'user-plus';
            else if (stop.type === 'dropoff') icon = 'user-check';

            return (
              <Marker key={stop.key} coordinate={stop.coordinate}>
                <View style={markerStyle}>
                  <Feather name={icon} size={isNext ? 16 : 14} color={isNext ? '#FFFFFF' : '#111827'} />
                </View>
              </Marker>
            );
          })}

          {driverPosition ? (
            <Marker coordinate={driverPosition} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.driverMarker}>
                <View style={[styles.driverHeadingPointer, { transform: [{ rotate: `${(driverHeading || 0) * 0.7}deg` }] }]}>
                  <Feather name="navigation" size={16} color="#ffffffff" />
                </View>
                <View style={styles.driverMarkerCore} />
              </View>
            </Marker>
          ) : null}
        </MapView>
      </View>

      <View style={styles.topControls}>
        <TouchableOpacity onPress={handleBack} style={styles.circleButton} accessibilityRole="button">
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>

        <View style={styles.topInfo}>
          <Text style={styles.topTitle}>Viaje en curso</Text>
          <Text style={styles.topSubtitle}>{nextStop ? nextStop.label : 'En camino'}</Text>
        </View>

        <View style={{ width: 48, height: 48 }} />
      </View>

      {!isFollowingUser ? (
        <TouchableOpacity onPress={handleEnableFollow} accessibilityRole="button" accessibilityLabel="Centrar mapa en el conductor" style={[styles.followFloatingButton, { bottom: bottomSheetHeight + 12 }]}>
          <Feather name="navigation" size={18} color="#2563EB" />
          <Text style={styles.centerFrameButton}>Centrar</Text>
        </TouchableOpacity>
      ) : null}

      <View onLayout={(e) => { const h = e.nativeEvent.layout.height; setBottomSheetHeight(h); sheetHeightRef.current = h; }} style={[styles.bottomSheet, isBottomSheetCollapsed && styles.bottomSheetCollapsed]}>
        <TouchableOpacity style={styles.bottomHandlePressable} accessibilityRole="button" onPress={toggleBottomSheet}>
          {isBottomSheetCollapsed ? (
            <View style={styles.puntaContainer}><Feather name="chevron-up" size={20} color="#94A3B8" /></View>
          ) : (
            <View style={styles.puntaContainer}><Feather name="chevron-down" size={20} color="#94A3B8" /></View>
          )}
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} style={[styles.nextStopCard, isBottomSheetCollapsed && styles.nextStopCardCollapsed]}>
          {isBottomSheetCollapsed ? (
            <View style={styles.nextStopCollapsedRow}>
              <Feather name="map-pin" size={16} color="#1E3A8A" />
              <Text style={styles.nextStopTitle}>{nextStop ? nextStop.label : 'Ruta completada'}</Text>
            </View>
          ) : (
            <>
              <View>
                <Text style={styles.nextStopLabel}>Siguiente parada</Text>
                {nextStop ? <Text style={styles.nextStopTitle}>{nextStop.label}</Text> : <Text style={styles.nextStopTitle}>Ruta completada</Text>}
                {nextStop && <Text style={styles.nextStopSubtitle}>{nextStop.label}</Text>}
              </View>
              <View style={styles.nextStopMeta}>
                <Feather name="clock" size={18} color="#2563EB" />
                <Text style={styles.nextStopMetaText}>{'Llegada estimada: ' + (arrivalEstimateText ?? '--:--')}</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        {!isBottomSheetCollapsed ? (
          <>
            <ScrollView style={styles.stopList} contentContainerStyle={styles.stopListContent} showsVerticalScrollIndicator={false}>
              {stops.map((stop, index) => (
                <View key={stop.key} style={styles.stopRow}>
                  <View style={styles.stopIndex}><Text style={styles.stopIndexText}>{index + 1}</Text></View>
                  <View style={styles.stopBadge}><Feather name="map-pin" size={14} color="#111827" /></View>
                  <View style={styles.stopTextContainer}><Text style={styles.stopLabel}>{stop.label}</Text></View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => {}}>
                <Feather name="alert-circle" size={18} color="#1E3A8A" />
                <Text style={styles.secondaryButtonText}>Reportar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={() => {
                if (travelId !== undefined) router.push(`/Passenger/Passenger_Travel_ended?travelId=${travelId}` as any);
                else router.push('/Passenger/Passenger_Travel_ended' as any);
              }}>
                <Text style={styles.primaryButtonText}>Calificar viaje</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  topControls: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  topInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  topTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 17,
    color: "#FFFFFF",
  },
  topSubtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    color: "#E2E8F0",
    marginTop: 4,
  },
  followFloatingButton: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 6,
    zIndex: 3,
  },
  centerFrameButton: {
    color: '#2563EB',
    marginLeft: 8,
    fontWeight: '700'
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    zIndex: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomSheetCollapsed: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
  },
  bottomHandlePressable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    paddingVertical: 6,
  },
  puntaContainer: {
    width: 60,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  nextStopCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
  },
  nextStopCardCollapsed: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nextStopCollapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextStopLabel: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 12,
    color: '#121417'
  },
  nextStopTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    fontSize: 16,
    color: '#1E293B'
  },
  nextStopSubtitle: { color: '#61758A' },
  nextStopMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  nextStopMetaText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 13,
    color: '#2563EB',
    marginTop: 6,
  },
  stopList: {
    maxHeight: 220,
    marginBottom: 12,
  },
  stopListContent: {
    paddingBottom: 8,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  stopIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stopIndexText: { fontWeight: '700' },
  stopBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stopTextContainer: { flex: 1 },
  stopLabel: { fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: '#121417' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  secondaryButton: { flex: 1, paddingVertical: 12, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  secondaryButtonText: { fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: '#1E3A8A', fontWeight: '700' },
  primaryButton: { flex: 1, paddingVertical: 12, backgroundColor: '#F99F7C', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  driverMarker: { alignItems: 'center', justifyContent: 'center' },
  driverHeadingPointer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '0deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  driverMarkerCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF', marginTop: -14, borderWidth: 2, borderColor: '#2563EB' },
  stopMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1D4ED8',
  },
  stopMarkerNext: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  stopMarkerVisited: {
    backgroundColor: '#D1FAE5',
    borderColor: '#047857',
  },
});
