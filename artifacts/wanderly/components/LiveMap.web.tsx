import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';
import type { Checkpoint } from '@/models/types';

export type MapCoordinate = { latitude: number; longitude: number };
type MapState = { distance: number; explored: number; coins: number };

export function LiveMap({
  state,
  active,
  seconds,
  start,
  pause,
  finish,
  onCheckpointDiscovered,
}: {
  state: MapState;
  active: boolean;
  seconds: number;
  start: () => void;
  pause: () => void;
  finish: (sessionResult?: {
    distanceMeters: number;
    route: MapCoordinate[];
    cellsCount: number;
    checkpointsDiscovered: string[];
    averageSpeedKmh: number;
  }) => void;
  onCheckpointDiscovered?: (checkpoint: Checkpoint) => void;
}) {
  const time = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');

  const handleFinish = () => {
    finish({
      distanceMeters: 1400,
      route: [
        { latitude: 16.0544, longitude: 108.2022 },
        { latitude: 16.0558, longitude: 108.2045 },
      ],
      cellsCount: 45,
      checkpointsDiscovered: ['chest-demo-1'],
      averageSpeedKmh: 5.5,
    });
  };

  return (
    <View style={s.container}>
      <View style={s.map}>
        <View style={s.streetA} />
        <View style={s.streetB} />
        <View style={s.park}>
          <Text style={s.parkText}>RIVERSIDE PARK</Text>
        </View>
        <View style={s.fogTop} />
        <View style={s.fogSide} />
        <View style={s.tunnel}>
          <View style={s.marker}>
            <Feather name="navigation" size={13} color={colors.light.primaryForeground} />
          </View>
        </View>
        <View style={s.checkpoint}>
          <Text style={{ fontSize: 13 }}>🎁</Text>
        </View>
      </View>

      <View style={s.top}>
        <View>
          <Text style={s.eyebrow}>GOOD MORNING, EXPLORER</Text>
          <Text style={s.heading}>Where will you reveal?</Text>
        </View>
        <View style={s.coins}>
          <Feather name="circle" size={14} color={colors.light.primary} />
          <Text style={s.coinText}>{state.coins}</Text>
        </View>
      </View>

      {/* Radar card for web */}
      <View style={s.radar}>
        <Text style={{ fontSize: 16 }}>🧭</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.radarLabel}>RADAR DÒ TÌM RƯƠNG BÍ ẨN</Text>
          <Text style={s.radarTitle}>Rương Đồng Cổ · 320m Đông Bắc (NE)</Text>
        </View>
      </View>

      <View style={s.sheet}>
        <View style={s.handle} />

        {/* Live Exploration Zone % Progress Bar */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.light.mutedForeground, letterSpacing: 0.5 }}>
              {active ? 'TIẾN ĐỘ VÀNH ĐAI KHÁM PHÁ' : 'TIẾN ĐỘ VÙNG HIỆN TẠI'}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.light.primary }}>
              {active ? Math.min(100, Math.round((seconds * 2.5) % 100)) : Math.min(100, Math.max(15, Math.round(((state.explored % 60) / 60) * 100)))}%
            </Text>
          </View>
          <View style={{ height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                borderRadius: 999,
                backgroundColor: colors.light.primary,
                width: `${active ? Math.min(100, Math.round((seconds * 2.5) % 100)) : Math.min(100, Math.max(15, Math.round(((state.explored % 60) / 60) * 100)))}%`,
              }}
            />
          </View>
        </View>

        <View style={s.row}>
          <View>
            <Text style={s.label}>THIS WEEK</Text>
            <Text style={s.distance}>
              {state.distance.toFixed(1)} <Text style={s.unit}>km</Text>
            </Text>
          </View>
          <View>
            <Text style={s.label}>REVEALED</Text>
            <Text style={s.distance}>
              {state.explored} <Text style={s.unit}>cells</Text>
            </Text>
          </View>
        </View>
        {active ? (
          <View style={s.active}>
            <View>
              <Text style={s.label}>ACTIVE EXPLORATION</Text>
              <Text style={s.timer}>{time}</Text>
              <Text style={s.sub}>GPS corridor clearing · 32m corridor</Text>
            </View>
            <View style={s.actions}>
              <Pressable style={s.round} onPress={pause}>
                <Feather name="pause" color={colors.light.primaryForeground} />
              </Pressable>
              <Pressable style={[s.round, s.finish]} onPress={handleFinish}>
                <Feather name="square" size={15} color={colors.light.primaryForeground} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={s.start} onPress={start}>
            <Feather name="play" size={18} color={colors.light.primaryForeground} />
            <Text style={s.startText}>Start exploring</Text>
          </Pressable>
        )}
        <Text style={s.nearby}>
          <Feather name="gift" size={13} color={colors.light.primary} /> 🎁 5 rương bí ẩn xung quanh bạn
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07181A' },
  map: { ...StyleSheet.absoluteFill, overflow: 'hidden', backgroundColor: '#ADC3B2' },
  streetA: { position: 'absolute', height: 13, width: '130%', backgroundColor: '#DDE2D8', top: '37%', left: '-15%', transform: [{ rotate: '-12deg' }] },
  streetB: { position: 'absolute', width: 12, height: '120%', backgroundColor: '#DDE2D8', left: '57%', top: '-10%', transform: [{ rotate: '18deg' }] },
  park: { position: 'absolute', right: '-8%', top: '22%', width: '52%', height: '29%', borderRadius: 110, backgroundColor: '#8DAF91', transform: [{ rotate: '12deg' }] },
  parkText: { color: '#51745F', fontSize: 9, letterSpacing: 1, position: 'absolute', top: '45%', left: '18%' },
  fogTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '30%', backgroundColor: 'rgba(7,27,28,.82)' },
  fogSide: { position: 'absolute', top: '30%', bottom: 0, left: 0, width: '31%', backgroundColor: 'rgba(7,27,28,.82)' },
  tunnel: { position: 'absolute', top: '30%', bottom: 0, left: '31%', width: '31%', borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(244,163,64,.38)', backgroundColor: 'rgba(244,163,64,.11)' },
  marker: { position: 'absolute', top: '48%', left: '42%', width: 33, height: 33, borderRadius: 17, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  checkpoint: { position: 'absolute', top: '42%', right: '18%', width: 34, height: 34, borderRadius: 17, backgroundColor: '#173D3A', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  top: { position: 'absolute', top: 58, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.light.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  heading: { color: colors.light.foreground, fontWeight: '700', fontSize: 25, marginTop: 5 },
  coins: { backgroundColor: colors.light.card, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', gap: 5, alignItems: 'center' },
  coinText: { color: colors.light.accent, fontWeight: '700' },
  radar: { position: 'absolute', top: 120, left: 20, right: 20, backgroundColor: 'rgba(7,24,26,0.92)', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#00E5FF' },
  radarLabel: { fontSize: 9, fontWeight: '800', color: '#00E5FF' },
  radarTitle: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginTop: 1 },
  sheet: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(16,43,43,.97)', borderRadius: 24, padding: 16, paddingTop: 10, borderWidth: 1, borderColor: colors.light.border },
  handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: colors.light.mutedForeground, alignSelf: 'center', marginBottom: 13, opacity: 0.6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingRight: 38 },
  label: { color: colors.light.mutedForeground, fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  distance: { color: colors.light.foreground, fontSize: 26, fontWeight: '700', marginTop: 3 },
  unit: { color: colors.light.mutedForeground, fontSize: 12, fontWeight: '500' },
  start: { height: 49, backgroundColor: colors.light.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  startText: { color: colors.light.primaryForeground, fontWeight: '700', fontSize: 15 },
  active: { backgroundColor: colors.light.secondary, borderRadius: 16, padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: { color: colors.light.foreground, fontSize: 27, fontWeight: '700', marginTop: 3 },
  sub: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  finish: { backgroundColor: colors.light.destructive },
  nearby: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 12, textAlign: 'center' },
});