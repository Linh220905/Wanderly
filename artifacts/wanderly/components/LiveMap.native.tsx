import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';

export type MapCoordinate = { latitude: number; longitude: number };
type MapState = { distance: number; explored: number; coins: number };

const ROUTE_STORAGE_KEY = 'wanderly-revealed-route';
const REVEAL_AREA_SQUARE_METERS = 400;
const REVEAL_RADIUS_METERS = Math.sqrt(REVEAL_AREA_SQUARE_METERS / Math.PI);
const MIN_ROUTE_POINT_DISTANCE_METERS = 18;
const MAX_ACCEPTED_SPEED_METERS_PER_SECOND = 12;
const MAX_RENDERED_ROUTE_POINTS = 260;
const MAX_FOG_REVEALS = 24;
const FOG_BANDS = 96;

const defaultRegion: Region = {
  latitude: 16.0544,
  longitude: 108.2022,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#DDE8D9' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#50665A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#EEF4EA' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#83C9D1' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3D8993' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#F4E5C5' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#D1B985' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#EBCB8A' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#A8CDA1' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#477A58' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ saturation: 20 }] },
];

function metersBetween(a: MapCoordinate, b: MapCoordinate) {
  const earthRadius = 6371000;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Reduce the number of fog holes so long walks stay smooth on a real device.
function compactRoute(points: MapCoordinate[]) {
  const compacted: MapCoordinate[] = [];
  points.forEach(point => {
    const previous = compacted[compacted.length - 1];
    if (!previous || metersBetween(previous, point) >= MIN_ROUTE_POINT_DISTANCE_METERS) {
      compacted.push(point);
    }
  });
  return compacted;
}

function samplePoints(points: MapCoordinate[], maxPoints: number) {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
}

type FogPoint = { x: number; y: number };
type RevealData = { radius: number; points: FogPoint[] };
type FogSegment = { left: number; top: number; width: number; height: number };

const FogRevealOverlay = React.memo(function FogRevealOverlay({
  region,
  points,
  current,
  width,
  height,
}: {
  region: Region;
  points: MapCoordinate[];
  current: MapCoordinate;
  width: number;
  height: number;
}) {
  const revealPoints = useMemo<RevealData>(() => {
    if (!width || !height || !region.latitudeDelta || !region.longitudeDelta) {
      return { radius: 0, points: [] };
    }
    const north = region.latitude + region.latitudeDelta / 2;
    const west = region.longitude - region.longitudeDelta / 2;
    // This radius belongs to the map, not the screen: zooming in makes the real
    // revealed area larger on screen; zooming out makes it disappear naturally.
    const radiusPixels = (REVEAL_RADIUS_METERS / (region.latitudeDelta * 111000)) * height;
    const project = (point: MapCoordinate) => {
      const x = ((point.longitude - west) / region.longitudeDelta) * width;
      const y = ((north - point.latitude) / region.latitudeDelta) * height;
      return { x, y };
    };
    const projectedPoints = samplePoints(points, MAX_FOG_REVEALS).map(project);
    const visiblePoints = projectedPoints.filter(point => point.x > -radiusPixels && point.x < width + radiusPixels && point.y > -radiusPixels && point.y < height + radiusPixels);
    return {
      radius: radiusPixels,
      points: visiblePoints,
    };
  }, [current, height, points, region, width]);

  const projectedCurrent = useMemo(() => {
    if (!width || !height || !region.latitudeDelta || !region.longitudeDelta) return { x: 0, y: 0 };
    const north = region.latitude + region.latitudeDelta / 2;
    const west = region.longitude - region.longitudeDelta / 2;
    return {
      x: ((current.longitude - west) / region.longitudeDelta) * width,
      y: ((north - current.latitude) / region.latitudeDelta) * height,
    };
  }, [current, height, region, width]);
  const fogSegments = useMemo<FogSegment[]>(() => {
    if (!width || !height || !revealPoints.radius) return [];
    const holes = [projectedCurrent, ...revealPoints.points];
    const bandHeight = height / FOG_BANDS;
    const segments: FogSegment[] = [];

    for (let row = 0; row < FOG_BANDS; row += 1) {
      const y = row * bandHeight + bandHeight / 2;
      const intervals = holes
        .map(point => {
          const distanceY = y - point.y;
          if (Math.abs(distanceY) >= revealPoints.radius) return null;
          const reach = Math.sqrt(revealPoints.radius ** 2 - distanceY ** 2);
          return [Math.max(0, point.x - reach), Math.min(width, point.x + reach)] as const;
        })
        .filter((interval): interval is readonly [number, number] => Boolean(interval && interval[1] > interval[0]))
        .sort((a, b) => a[0] - b[0]);

      let cursor = 0;
      intervals.forEach(([left, right]) => {
        if (left > cursor) segments.push({ left: cursor, top: row * bandHeight, width: left - cursor, height: bandHeight + 1 });
        cursor = Math.max(cursor, right);
      });
      if (cursor < width) segments.push({ left: cursor, top: row * bandHeight, width: width - cursor, height: bandHeight + 1 });
    }

    return segments;
  }, [height, projectedCurrent, revealPoints, width]);

  if (!width || !height) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {fogSegments.map((segment, index) => (
        <View key={'fog-segment-' + index} style={[styles.fogSegment, segment]} />
      ))}
    </View>
  );
});

const checkpoints = [
  { id: 'dragon-bridge', title: 'Dragon Bridge', kind: 'LANDMARK', reward: '120 XP', offset: { latitude: 0.006, longitude: -0.007 } },
  { id: 'river-cache', title: 'Riverside Cache', kind: 'RARE CHEST', reward: '80 coins', offset: { latitude: -0.004, longitude: 0.009 } },
  { id: 'city-fragment', title: 'City Fragment', kind: 'FRAGMENT', reward: '1 fragment', offset: { latitude: 0.008, longitude: 0.008 } },
];

const MapCanvas = React.memo(function MapCanvas({
  mapRef,
  initialRegion,
  route,
  current,
  hasLocationPermission,
  followUser,
  onPanDrag,
  onRegionChangeComplete,
}: {
  mapRef: React.RefObject<MapView | null>;
  initialRegion: Region;
  route: MapCoordinate[];
  current: MapCoordinate;
  hasLocationPermission: boolean;
  followUser: boolean;
  onPanDrag: () => void;
  onRegionChangeComplete: (region: Region) => void;
}) {
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      onRegionChangeComplete={onRegionChangeComplete}
      onPanDrag={onPanDrag}
      scrollEnabled
      zoomEnabled
      zoomControlEnabled
      minZoomLevel={8}
      maxZoomLevel={20}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsScale
      showsCompass
      toolbarEnabled={false}
      rotateEnabled
      pitchEnabled={false}
      mapType="standard"
      userInterfaceStyle="light"
      customMapStyle={mapStyle}
    >
      {route.length > 1 && (
        <Polyline
          coordinates={route}
          strokeColor={colors.light.primary}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      )}
      {hasLocationPermission && !followUser && (
        <Marker coordinate={current} tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.userMarker}>
            <View style={styles.userDot} />
          </View>
        </Marker>
      )}
      {checkpoints.map(checkpoint => (
        <Marker
          key={checkpoint.id}
          tracksViewChanges={false}
          coordinate={{
            latitude: current.latitude + checkpoint.offset.latitude,
            longitude: current.longitude + checkpoint.offset.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          title={checkpoint.title}
          description={checkpoint.kind + ' · ' + checkpoint.reward}
        >
          <View style={styles.checkpoint}>
            <Feather name={checkpoint.kind === 'LANDMARK' ? 'map-pin' : 'gift'} size={13} color={colors.light.primaryForeground} />
          </View>
        </Marker>
      ))}
    </MapView>
  );
});

export function LiveMap({
  state,
  route,
  current,
  active,
  seconds,
  start,
  pause,
  finish,
}: {
  state: MapState;
  route?: MapCoordinate[];
  current?: MapCoordinate;
  active: boolean;
  seconds: number;
  start: () => void;
  pause: () => void;
  finish: () => void;
}) {
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(current ?? null);
  const [region, setRegion] = useState<Region>(current ? { ...defaultRegion, ...current } : defaultRegion);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const [persistedRoute, setPersistedRoute] = useState<MapCoordinate[]>([]);
  const [liveRoute, setLiveRoute] = useState<MapCoordinate[]>([]);
  const [liveDistance, setLiveDistance] = useState(0);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const initialRegionRef = useRef<Region>(current ? { ...defaultRegion, ...current } : defaultRegion);
  const mapRef = useRef<MapView | null>(null);
  const lastCameraPoint = useRef<MapCoordinate | null>(null);
  const lastPersistedAt = useRef(0);
  const distanceAccumulator = useRef(0);

  const mapCurrent = useMemo(() => userLocation ?? current ?? { latitude: region.latitude, longitude: region.longitude }, [current, region.latitude, region.longitude, userLocation]);
  const displayedRoute = useMemo(() => route ?? [...persistedRoute, ...liveRoute], [liveRoute, persistedRoute, route]);
  const revealedPoints = useMemo(() => compactRoute(displayedRoute), [displayedRoute]);
  const renderedRoute = useMemo(() => samplePoints(revealedPoints, MAX_RENDERED_ROUTE_POINTS), [revealedPoints]);

  useEffect(() => {
    if (!liveRoute.length || route || Date.now() - lastPersistedAt.current < 10000) return;
    lastPersistedAt.current = Date.now();
    AsyncStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify([...persistedRoute, ...liveRoute])).catch(() => undefined);
  }, [liveRoute, persistedRoute, route]);

  const handlePanDrag = useCallback(() => setFollowUser(false), []);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(ROUTE_STORAGE_KEY)
      .then(value => {
        if (cancelled || !value) return;
        try {
          const saved = JSON.parse(value) as MapCoordinate[];
          if (Array.isArray(saved)) setPersistedRoute(saved);
        } catch {
          // Ignore corrupt local route data and allow a new route to start.
        }
      })
      .catch(() => undefined);

    (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      const granted = permission.status === Location.PermissionStatus.GRANTED;
      setHasLocationPermission(granted);
      if (!granted || current) return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (cancelled) return;
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setUserLocation(point);
      setRegion(previous => ({ ...previous, ...point }));
      mapRef.current?.animateCamera({ center: point }, { duration: 350 });
      lastCameraPoint.current = point;
    })().catch(() => undefined);

    return () => { cancelled = true; };
  }, [current]);

  useEffect(() => {
    if (!active || route || !hasLocationPermission) return;

    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    let lastPoint: MapCoordinate | undefined;
    let lastTimestamp = 0;

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 3,
        timeInterval: 2000,
        mayShowUserSettingsDialog: true,
      },
      position => {
        const accuracy = position.coords.accuracy ?? -1;
        const timestamp = position.timestamp;
        if (accuracy < 0 || accuracy > 50 || timestamp <= lastTimestamp) return;

        const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setUserLocation(previous => previous && metersBetween(previous, point) < 5 ? previous : point);
        if (followUser && (!lastCameraPoint.current || metersBetween(lastCameraPoint.current, point) >= 8)) {
          setRegion(previous => ({ ...previous, ...point }));
          mapRef.current?.animateCamera({ center: point }, { duration: 350 });
          lastCameraPoint.current = point;
        }

        if (lastPoint) {
          const segment = metersBetween(lastPoint, point);
          const elapsed = Math.max((timestamp - lastTimestamp) / 1000, 1);
          const speed = segment / elapsed;
          if (segment < 2 || segment > 250 || speed > MAX_ACCEPTED_SPEED_METERS_PER_SECOND) return;
          distanceAccumulator.current += segment;
          if (distanceAccumulator.current >= 10) {
            const accumulated = distanceAccumulator.current;
            distanceAccumulator.current = 0;
            setLiveDistance(value => value + accumulated);
          }
        }

        lastPoint = point;
        lastTimestamp = timestamp;
        setLiveRoute(previous => {
          const previousPoint = previous[previous.length - 1];
          if (previousPoint && metersBetween(previousPoint, point) < MIN_ROUTE_POINT_DISTANCE_METERS) return previous;
          const next = [...previous, point];
          return next;
        });
      },
    )
      .then(value => {
        if (cancelled) value.remove();
        else subscription = value;
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [active, followUser, hasLocationPermission, persistedRoute, route]);

  const handleStart = async () => {
    if (requestingLocation) return;
    setRequestingLocation(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== Location.PermissionStatus.GRANTED) return;

      setHasLocationPermission(true);
      setFollowUser(true);
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setUserLocation(point);
      setRegion(previous => ({ ...previous, ...point }));
      mapRef.current?.animateCamera({ center: point }, { duration: 350 });
      lastCameraPoint.current = point;
      start();
    } catch {
      // Keep the activity idle when the device cannot provide a location.
    } finally {
      setRequestingLocation(false);
    }
  };

  const zoomMap = (factor: number) => {
    setFollowUser(true);
    const nextRegion = {
      ...region,
      latitude: mapCurrent.latitude,
      longitude: mapCurrent.longitude,
      latitudeDelta: Math.max(0.0015, Math.min(0.5, region.latitudeDelta * factor)),
      longitudeDelta: Math.max(0.0015, Math.min(0.5, region.longitudeDelta * factor)),
    };
    setRegion(nextRegion);
    mapRef.current?.animateCamera({ center: mapCurrent, zoom: Math.max(8, Math.min(20, Math.log2(360 / nextRegion.longitudeDelta))) }, { duration: 260 });
  };

  const time = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  const centerDotSize = Math.round(Math.min(30, Math.max(18, 18 * Math.sqrt(region.longitudeDelta / 0.01))));

  return (
    <View
      style={styles.container}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        if (width !== mapSize.width || height !== mapSize.height) setMapSize({ width, height });
      }}
    >
      <MapCanvas
        mapRef={mapRef}
        initialRegion={initialRegionRef.current}
        route={renderedRoute}
        current={mapCurrent}
        hasLocationPermission={hasLocationPermission}
        followUser={followUser}
        onPanDrag={handlePanDrag}
        onRegionChangeComplete={setRegion}
      />

      <FogRevealOverlay
        region={region}
        points={revealedPoints}
        current={mapCurrent}
        width={mapSize.width}
        height={mapSize.height}
      />

      {hasLocationPermission && followUser && (
        <View pointerEvents="none" style={styles.centerUserMarker}>
          <View style={[styles.centerUserDot, { width: centerDotSize, height: centerDotSize, borderRadius: centerDotSize / 2 }]} />
        </View>
      )}

      <View style={styles.mapTop}>
        <View>
          <Text style={styles.eyebrow}>GOOD MORNING, EXPLORER</Text>
          <Text style={styles.heading}>Where will you reveal?</Text>
        </View>
        <View style={styles.coins}>
          <Feather name="circle" size={14} color={colors.light.primary} />
          <Text style={styles.coinText}>{state.coins}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.recenter, !followUser && styles.recenterAway]}
        onPress={() => {
          setFollowUser(true);
          const nextRegion = { ...region, ...mapCurrent };
          setRegion(nextRegion);
          mapRef.current?.animateToRegion(nextRegion, 350);
        }}
      >
        <Feather name="crosshair" size={18} color={colors.light.accent} />
        {!followUser && <Text style={styles.recenterText}>Về tôi</Text>}
      </Pressable>

      <View style={styles.zoomControls}>
        <Pressable style={styles.zoomButton} onPress={() => zoomMap(0.55)} accessibilityLabel="Zoom in">
          <Feather name="plus" size={19} color={colors.light.foreground} />
        </Pressable>
        <View style={styles.zoomDivider} />
        <Pressable style={styles.zoomButton} onPress={() => zoomMap(1.8)} accessibilityLabel="Zoom out">
          <Feather name="minus" size={19} color={colors.light.foreground} />
        </Pressable>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetRow}>
          <View>
            <Text style={styles.label}>THIS WEEK</Text>
            <Text style={styles.distance}>{(state.distance + liveDistance / 1000).toFixed(2)} <Text style={styles.unit}>km</Text></Text>
          </View>
          <View style={styles.explored}>
            <Text style={styles.label}>REVEALED</Text>
            <Text style={styles.revealed}>{state.explored + revealedPoints.length} <Text style={styles.unit}>cells</Text></Text>
          </View>
        </View>

        {active ? (
          <View style={styles.activeRow}>
            <View>
              <Text style={styles.label}>ACTIVE EXPLORATION</Text>
              <Text style={styles.timer}>{time}</Text>
              <Text style={styles.sub}>GPS reveal zone · {REVEAL_AREA_SQUARE_METERS} m²</Text>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.round} onPress={pause}>
                <Feather name="pause" size={18} color={colors.light.primaryForeground} />
              </Pressable>
              <Pressable style={[styles.round, styles.finish]} onPress={finish}>
                <Feather name="square" size={15} color={colors.light.primaryForeground} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.start} onPress={handleStart} disabled={requestingLocation}>
            <Feather name={requestingLocation ? 'loader' : 'play'} size={18} color={colors.light.primaryForeground} />
            <Text style={styles.startText}>{requestingLocation ? 'Locating you…' : 'Start exploring'}</Text>
          </Pressable>
        )}
        <Text style={styles.nearby}>
          <Feather name="gift" size={13} color={colors.light.primary} /> {revealedPoints.length ? 'Your path is opening the fog' : 'Move to reveal the map'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  fogSegment: { position: 'absolute', backgroundColor: '#0C6B70', opacity: 0.9 },
  mapTop: { position: 'absolute', top: 58, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.light.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  heading: { color: colors.light.foreground, fontWeight: '700', fontSize: 25, marginTop: 5 },
  coins: { backgroundColor: colors.light.card, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', gap: 5, alignItems: 'center' },
  coinText: { color: colors.light.accent, fontWeight: '700' },
  checkpoint: { width: 31, height: 31, borderRadius: 16, backgroundColor: colors.light.primary, borderWidth: 2, borderColor: colors.light.accent, alignItems: 'center', justifyContent: 'center' },
  userMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  userDot: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#2F80ED', borderWidth: 2, borderColor: '#1764C0' },
  centerUserMarker: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  centerUserDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#2F80ED', borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  recenter: { position: 'absolute', top: 138, right: 20, backgroundColor: colors.light.card, borderRadius: 13, padding: 11, borderWidth: 1, borderColor: colors.light.border, flexDirection: 'row', alignItems: 'center', gap: 7 },
  recenterAway: { paddingHorizontal: 12 },
  recenterText: { color: colors.light.foreground, fontSize: 12, fontWeight: '700' },
  zoomControls: { position: 'absolute', top: 194, right: 20, overflow: 'hidden', borderRadius: 13, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  zoomButton: { width: 42, height: 38, alignItems: 'center', justifyContent: 'center' },
  zoomDivider: { height: 1, marginHorizontal: 8, backgroundColor: colors.light.border },
  sheet: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(16,43,43,0.96)', borderRadius: 24, padding: 16, paddingTop: 10, borderWidth: 1, borderColor: colors.light.border },
  handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: colors.light.mutedForeground, alignSelf: 'center', marginBottom: 13, opacity: 0.6 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  explored: { paddingRight: 38 },
  label: { color: colors.light.mutedForeground, fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  distance: { color: colors.light.foreground, fontSize: 26, fontWeight: '700', marginTop: 3 },
  revealed: { color: colors.light.foreground, fontSize: 21, fontWeight: '700', marginTop: 6 },
  unit: { color: colors.light.mutedForeground, fontSize: 12, fontWeight: '500' },
  start: { height: 49, backgroundColor: colors.light.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  startText: { color: colors.light.primaryForeground, fontWeight: '700', fontSize: 15 },
  activeRow: { backgroundColor: colors.light.secondary, borderRadius: 16, padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: { color: colors.light.foreground, fontSize: 27, fontWeight: '700', marginTop: 3 },
  sub: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  finish: { backgroundColor: colors.light.destructive },
  nearby: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 12, textAlign: 'center' },
});
