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
  useEffect(() => {
    AsyncStorage.getItem('wanderly-revealed-route').then(value => {
      if (value) setPersistedRoute(JSON.parse(value) as MapCoordinate[]);
    });
  }, []);
  useEffect(() => {
    if (!active || route) return;
    let subscription: Location.LocationSubscription | undefined;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 8, timeInterval: 5000 },
      position => {
        const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
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
    const top = [
      { latitude: north, longitude: west }, { latitude: north, longitude: east },
      { latitude: mapCurrent.latitude + half, longitude: east }, { latitude: mapCurrent.latitude + half, longitude: west },
    ];
    const bottom = [
      { latitude: mapCurrent.latitude - half, longitude: west }, { latitude: mapCurrent.latitude - half, longitude: east },
      { latitude: south, longitude: east }, { latitude: south, longitude: west },
    ];
    const left = [
      { latitude: mapCurrent.latitude - half, longitude: west }, { latitude: mapCurrent.latitude + half, longitude: west },
      { latitude: mapCurrent.latitude + half, longitude: mapCurrent.longitude - longHalf }, { latitude: mapCurrent.latitude - half, longitude: mapCurrent.longitude - longHalf },
    ];
    const right = [
      { latitude: mapCurrent.latitude + half, longitude: mapCurrent.longitude + longHalf }, { latitude: mapCurrent.latitude + half, longitude: east },
      { latitude: mapCurrent.latitude - half, longitude: east }, { latitude: mapCurrent.latitude - half, longitude: mapCurrent.longitude + longHalf },
    ];
    return [top, bottom, left, right];
  }, [mapCurrent, region]);

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
        {fog.map((points, index) => <Polygon key={index} coordinates={points} fillColor="rgba(7,27,28,0.84)" strokeColor="rgba(7,27,28,0.9)" strokeWidth={1} />)}
        {displayedRoute.length > 1 && <Polyline coordinates={displayedRoute} strokeColor={colors.light.primary} strokeWidth={5} lineCap="round" lineJoin="round" />}
        {displayedRoute.map((point, index) => <Circle key={'reveal-' + index} center={point} radius={25} fillColor="rgba(244,163,64,0.13)" strokeColor="rgba(244,163,64,0.18)" strokeWidth={1} />)}
        <Circle center={mapCurrent} radius={28} fillColor="rgba(244,163,64,0.18)" strokeColor="rgba(244,163,64,0.48)" strokeWidth={1} />
        <Marker coordinate={{ latitude: mapCurrent.latitude + 0.006, longitude: mapCurrent.longitude - 0.007 }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.checkpoint}><Feather name="gift" size={13} color={colors.light.primaryForeground} /></View>
        </Marker>
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
          <View><Text style={styles.label}>THIS WEEK</Text><Text style={styles.distance}>{state.distance.toFixed(1)} <Text style={styles.unit}>km</Text></Text></View>
          <View style={styles.explored}><Text style={styles.label}>REVEALED</Text><Text style={styles.revealed}>{state.explored || 0} <Text style={styles.unit}>cells</Text></Text></View>
        </View>
        {active ? <View style={styles.activeRow}><View><Text style={styles.label}>ACTIVE EXPLORATION</Text><Text style={styles.timer}>{time}</Text><Text style={styles.sub}>GPS corridor clearing · 25 m radius</Text></View><View style={styles.actions}><Pressable style={styles.round} onPress={pause}><Feather name="pause" size={18} color={colors.light.primaryForeground} /></Pressable><Pressable style={[styles.round, styles.finish]} onPress={finish}><Feather name="square" size={15} color={colors.light.primaryForeground} /></Pressable></View></View> : <Pressable style={styles.start} onPress={start}><Feather name="play" size={18} color={colors.light.primaryForeground} /><Text style={styles.startText}>Start exploring</Text></Pressable>}
        <Text style={styles.nearby}><Feather name="gift" size={13} color={colors.light.primary} /> Hidden cache · 420 m away</Text>
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