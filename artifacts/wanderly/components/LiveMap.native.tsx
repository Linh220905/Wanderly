import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapView, { Circle, Marker, Polygon, Polyline, Region } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';

export type MapCoordinate = { latitude: number; longitude: number };
type MapState = { distance: number; explored: number; coins: number };

const defaultRegion: Region = {
  latitude: 16.0544,
  longitude: 108.2022,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

function metersBetween(a: MapCoordinate, b: MapCoordinate) {
  const earthRadius = 6371000;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function revealShape(center: MapCoordinate, radiusMeters: number) {
  const points: MapCoordinate[] = [];
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const variation = 0.86 + ((index * 17) % 9) / 50;
    const radius = radiusMeters * variation;
    points.push({
      latitude: center.latitude + (Math.sin(angle) * radius) / 111000,
      longitude: center.longitude + (Math.cos(angle) * radius) / (111000 * Math.cos(center.latitude * Math.PI / 180)),
    });
  }
  return points;
}

const checkpoints = [
  { id: 'dragon-bridge', title: 'Dragon Bridge', kind: 'LANDMARK', reward: '120 XP', offset: { latitude: 0.006, longitude: -0.007 } },
  { id: 'river-cache', title: 'Riverside Cache', kind: 'RARE CHEST', reward: '80 coins', offset: { latitude: -0.004, longitude: 0.009 } },
  { id: 'city-fragment', title: 'City Fragment', kind: 'FRAGMENT', reward: '1 fragment', offset: { latitude: 0.008, longitude: 0.008 } },
];

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
  const mapCurrent = current ?? { latitude: defaultRegion.latitude, longitude: defaultRegion.longitude };
  const [region, setRegion] = useState<Region>(defaultRegion);
  const [persistedRoute, setPersistedRoute] = useState<MapCoordinate[]>([]);
  const [liveRoute, setLiveRoute] = useState<MapCoordinate[]>([]);
  const displayedRoute = route ?? [...persistedRoute, ...liveRoute];
  const [liveDistance, setLiveDistance] = useState(0);
  useEffect(() => {
    AsyncStorage.getItem('wanderly-revealed-route').then(value => {
      if (value) setPersistedRoute(JSON.parse(value) as MapCoordinate[]);
    });
  }, []);
  useEffect(() => {
    if (!active || route) return;
    let subscription: Location.LocationSubscription | undefined;
    let lastPoint: MapCoordinate | undefined;
    let lastTimestamp = 0;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
      position => {
        const accuracy = position.coords.accuracy ?? -1;
        const timestamp = position.timestamp;
        if (accuracy < 0 || accuracy > 45 || timestamp <= lastTimestamp) return;
        const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        if (lastPoint) {
          const segment = metersBetween(lastPoint, point);
          const elapsed = Math.max((timestamp - lastTimestamp) / 1000, 1);
          const speed = segment / elapsed;
          if (segment < 2 || speed > 8) return;
          setLiveDistance(value => value + segment);
        }
        lastPoint = point;
        lastTimestamp = timestamp;
        setLiveRoute(previous => {
          const next = [...previous, point];
          AsyncStorage.setItem('wanderly-revealed-route', JSON.stringify([...persistedRoute, ...next]));
          return next;
        });
        setRegion(previous => ({ ...previous, latitude: point.latitude, longitude: point.longitude }));
      },
    ).then(value => { subscription = value; }).catch(() => undefined);
    return () => subscription?.remove();
  }, [active, route, persistedRoute]);
  const time = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  const fog = useMemo(() => {
    const north = region.latitude + region.latitudeDelta / 2;
    const south = region.latitude - region.latitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    const west = region.longitude - region.longitudeDelta / 2;
    const half = Math.max(region.latitudeDelta * 0.11, 0.0032);
    const longHalf = Math.max(region.longitudeDelta * 0.12, 0.0032);
    const outer = [
      { latitude: north, longitude: west }, { latitude: north, longitude: east },
      { latitude: south, longitude: east }, { latitude: south, longitude: west },
    ];
    const points = displayedRoute.length ? displayedRoute : [mapCurrent];
    const holes = points.filter((_, index) => index % 2 === 0).map(point => revealShape(point, 25));
    holes.push(revealShape(mapCurrent, Math.max(half * 111000, 30)));
    return { outer, holes };
  }, [displayedRoute, mapCurrent, region]);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        rotateEnabled
        pitchEnabled={false}
        mapType="standard"
        userInterfaceStyle="dark"
      >
        <Polygon coordinates={fog.outer} holes={fog.holes} fillColor="rgba(7,27,28,0.84)" strokeColor="rgba(7,27,28,0.9)" strokeWidth={1} />
        {displayedRoute.length > 1 && <Polyline coordinates={displayedRoute} strokeColor={colors.light.primary} strokeWidth={5} lineCap="round" lineJoin="round" />}
        {displayedRoute.map((point, index) => <Circle key={'reveal-' + index} center={point} radius={25} fillColor="rgba(244,163,64,0.13)" strokeColor="rgba(244,163,64,0.18)" strokeWidth={1} />)}
        <Circle center={mapCurrent} radius={28} fillColor="rgba(244,163,64,0.18)" strokeColor="rgba(244,163,64,0.48)" strokeWidth={1} />
        {checkpoints.map(checkpoint => <Marker key={checkpoint.id} coordinate={{ latitude: mapCurrent.latitude + checkpoint.offset.latitude, longitude: mapCurrent.longitude + checkpoint.offset.longitude }} anchor={{ x: 0.5, y: 0.5 }} title={checkpoint.title} description={checkpoint.kind + ' · ' + checkpoint.reward}>
          <View style={styles.checkpoint}><Feather name={checkpoint.kind === 'LANDMARK' ? 'map-pin' : 'gift'} size={13} color={colors.light.primaryForeground} /></View>
        </Marker>)}
      </MapView>
      <View style={styles.mapTop}>
        <View>
          <Text style={styles.eyebrow}>GOOD MORNING, EXPLORER</Text>
          <Text style={styles.heading}>Where will you reveal?</Text>
        </View>
        <View style={styles.coins}><Feather name="circle" size={14} color={colors.light.primary} /><Text style={styles.coinText}>{state.coins}</Text></View>
      </View>
      <Pressable style={styles.recenter} onPress={() => setRegion(v => ({ ...v, latitude: mapCurrent.latitude, longitude: mapCurrent.longitude }))}>
        <Feather name="crosshair" size={18} color={colors.light.accent} />
      </Pressable>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetRow}>
          <View><Text style={styles.label}>THIS WEEK</Text><Text style={styles.distance}>{(state.distance + liveDistance / 1000).toFixed(2)} <Text style={styles.unit}>km</Text></Text></View>
          <View style={styles.explored}><Text style={styles.label}>REVEALED</Text><Text style={styles.revealed}>{state.explored || 0} <Text style={styles.unit}>cells</Text></Text></View>
        </View>
        {active ? <View style={styles.activeRow}><View><Text style={styles.label}>ACTIVE EXPLORATION</Text><Text style={styles.timer}>{time}</Text><Text style={styles.sub}>GPS corridor clearing · 25 m radius</Text></View><View style={styles.actions}><Pressable style={styles.round} onPress={pause}><Feather name="pause" size={18} color={colors.light.primaryForeground} /></Pressable><Pressable style={[styles.round, styles.finish]} onPress={finish}><Feather name="square" size={15} color={colors.light.primaryForeground} /></Pressable></View></View> : <Pressable style={styles.start} onPress={start}><Feather name="play" size={18} color={colors.light.primaryForeground} /><Text style={styles.startText}>Start exploring</Text></Pressable>}
        <Text style={styles.nearby}><Feather name="gift" size={13} color={colors.light.primary} /> 3 checkpoints nearby · XP, coins & fragments</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  mapTop: { position: 'absolute', top: 58, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.light.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  heading: { color: colors.light.foreground, fontWeight: '700', fontSize: 25, marginTop: 5 },
  coins: { backgroundColor: colors.light.card, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', gap: 5, alignItems: 'center' },
  coinText: { color: colors.light.accent, fontWeight: '700' },
  checkpoint: { width: 31, height: 31, borderRadius: 16, backgroundColor: colors.light.primary, borderWidth: 2, borderColor: colors.light.accent, alignItems: 'center', justifyContent: 'center' },
  recenter: { position: 'absolute', top: 138, right: 20, backgroundColor: colors.light.card, borderRadius: 13, padding: 11, borderWidth: 1, borderColor: colors.light.border },
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