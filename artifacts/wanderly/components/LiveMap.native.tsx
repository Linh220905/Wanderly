import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import typography from '@/constants/typography';
import { radii, spacing } from '@/constants/spacing';
import { MAP_HTML_SOURCE } from './MapEngineBundle';
import { CheckpointDiscoveryModal } from './modals/CheckpointDiscoveryModal';
import { MysteryHikeModal } from './modals/MysteryHikeModal';
import {
  type Checkpoint,
  generateNearbyCheckpoints,
  checkProximityDiscoveries,
  getNearestUndiscovered,
  calculateBearing,
} from '@/services/CheckpointService';
import {
  generateDailyMysteryHike,
  checkMysteryHikeArrival,
  metersBetweenCoords,
} from '@/services/TerritoryService';
import type { MysteryHikeQuest } from '@/models/types';
import { calculateComboMultiplier } from '@/services/GamificationService';

export type MapCoordinate = { latitude: number; longitude: number };
type MapState = { distance: number; explored: number; coins: number };

const PERSISTED_ROUTE_KEY = 'wanderly_revealed_route_v1';
const PERSISTED_DISCOVERED_KEY = 'wanderly_discovered_checkpoints_v1';

function metersBetween(a: MapCoordinate, b: MapCoordinate) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

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
  const insets = useSafeAreaInsets();
  const c = useColors();
  const webViewRef = useRef<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);

  // Live Strava-like metrics tracking
  const [sessionDistanceMeters, setSessionDistanceMeters] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const sessionRouteRef = useRef<MapCoordinate[]>([]);
  const lastTrackedPoint = useRef<MapCoordinate | null>(null);
  const userGpsRef = useRef<MapCoordinate | null>(null);

  // Checkpoints & Mystery Radar State
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<string[]>([]);
  const [sessionDiscoveredIds, setSessionDiscoveredIds] = useState<string[]>([]);
  const [inspectedCheckpoint, setInspectedCheckpoint] = useState<Checkpoint | null>(null);
  const [radarInfo, setRadarInfo] = useState<{
    title: string;
    distance: number;
    bearing: string;
    type: string;
    isMystery?: boolean;
    checkpoint?: Checkpoint;
  } | null>(null);

  // Mystery Hike State
  const [mysteryQuest, setMysteryQuest] = useState<MysteryHikeQuest | null>(null);
  const [isMysteryModalOpen, setIsMysteryModalOpen] = useState(false);
  const [completedMysteryIds, setCompletedMysteryIds] = useState<string[]>([]);

  // Discovery Banner Animation
  const [recentFound, setRecentFound] = useState<Checkpoint | null>(null);
  const bannerAnim = useRef(new Animated.Value(-120)).current;

  // Active exploration zone progress percentage
  // Only counts revealed route points INSIDE exploration boundary circle (800m)
  const [zonePercent, setZonePercent] = useState(0);

  // Send commands to WebView Map Engine
  const sendCommand = useCallback((command: object) => {
    const js = `window.handleRNMessage && window.handleRNMessage(${JSON.stringify(command)}); true;`;
    webViewRef.current?.injectJavaScript(js);
  }, []);

  // Load persisted lifetime route & discovered checkpoints on mount
  useEffect(() => {
    if (!isMapReady) return;
    AsyncStorage.getItem(PERSISTED_ROUTE_KEY).then(saved => {
      if (saved) {
        try {
          const pts = JSON.parse(saved);
          if (Array.isArray(pts) && pts.length > 0) {
            sendCommand({ type: 'LOAD_HISTORICAL_ROUTE', points: pts });
          }
        } catch {}
      }
    });

    AsyncStorage.getItem(PERSISTED_DISCOVERED_KEY).then(saved => {
      if (saved) {
        try {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) setDiscoveredIds(ids);
        } catch {}
      }
    });

    AsyncStorage.getItem('wanderly_completed_mystery_v1').then(saved => {
      if (saved) {
        try {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) setCompletedMysteryIds(ids);
        } catch {}
      }
    });
  }, [isMapReady, sendCommand]);

  // Generate & sync checkpoints & mystery quest with WebView map
  const refreshCheckpoints = useCallback(
    (loc: MapCoordinate) => {
      const list = generateNearbyCheckpoints(loc, discoveredIds);
      setCheckpoints(list);
      sendCommand({ type: 'SET_CHECKPOINTS', checkpoints: list });

      // Mystery Hike
      const quest = generateDailyMysteryHike(loc, completedMysteryIds);
      setMysteryQuest(quest);
      sendCommand({ type: 'SET_MYSTERY_QUEST', quest });

      if (quest && !quest.isCompleted) {
        const dist = Math.round(metersBetweenCoords(loc, quest.targetCoordinate));
        const bearing = calculateBearing(loc, quest.targetCoordinate);
        setRadarInfo({
          title: quest.titleVi || quest.title,
          distance: dist,
          bearing,
          type: 'mystery',
          isMystery: true,
        });
      } else {
        const nearest = getNearestUndiscovered(loc, list);
        if (nearest) {
          const bearing = calculateBearing(loc, nearest.checkpoint.coordinate);
          setRadarInfo({
            title: nearest.checkpoint.title,
            distance: nearest.distance,
            bearing,
            type: nearest.checkpoint.type,
            isMystery: false,
            checkpoint: nearest.checkpoint,
          });
        } else {
          setRadarInfo(null);
        }
      }
    },
    [discoveredIds, completedMysteryIds, sendCommand],
  );

  // Trigger Proximity Auto-Collect & Haptic Feedback
  const checkProximity = useCallback(
    (loc: MapCoordinate) => {
      if (checkpoints.length === 0) return;
      const found = checkProximityDiscoveries(loc, checkpoints);

      if (found.length > 0) {
        found.forEach(cp => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          sendCommand({ type: 'REMOVE_CHECKPOINT', id: cp.id });

          setDiscoveredIds(prev => {
            const next = [...prev, cp.id];
            AsyncStorage.setItem(PERSISTED_DISCOVERED_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });
          setSessionDiscoveredIds(prev => [...prev, cp.id]);

          setRecentFound(cp);
          Animated.sequence([
            Animated.timing(bannerAnim, { toValue: insets.top + 8, duration: 320, useNativeDriver: true }),
            Animated.delay(3500),
            Animated.timing(bannerAnim, { toValue: -120, duration: 250, useNativeDriver: true }),
          ]).start(() => setRecentFound(null));

          onCheckpointDiscovered?.(cp);
        });
      }
    },
    [checkpoints, sendCommand, bannerAnim, insets.top, onCheckpointDiscovered],
  );

  const toggleSimulation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!isSimulating) {
      setIsSimulating(true);
      setFollowUser(true);
      sendCommand({ type: 'START_SIMULATION' });
      if (!active) start();
    } else {
      setIsSimulating(false);
      sendCommand({ type: 'STOP_SIMULATION' });
    }
  };

  const handleRecenter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFollowUser(true);
    sendCommand({ type: 'RECENTER' });
  };

  const handleZoom = (type: 'IN' | 'OUT') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    sendCommand({ type: type === 'IN' ? 'ZOOM_IN' : 'ZOOM_OUT' });
  };

  const handleFinishSession = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (sessionRouteRef.current.length > 0) {
      AsyncStorage.getItem(PERSISTED_ROUTE_KEY).then(saved => {
        const prev = saved ? JSON.parse(saved) : [];
        const combined = [...prev, ...sessionRouteRef.current];
        AsyncStorage.setItem(PERSISTED_ROUTE_KEY, JSON.stringify(combined)).catch(() => {});
      });
    }

    const avgSpeed = seconds > 0 ? (sessionDistanceMeters / seconds) * 3.6 : 5.0;

    finish({
      distanceMeters: Math.round(sessionDistanceMeters),
      route: sessionRouteRef.current,
      cellsCount: Math.max(1, Math.floor(sessionDistanceMeters / 30)),
      checkpointsDiscovered: sessionDiscoveredIds,
      averageSpeedKmh: avgSpeed,
    });

    setSessionDistanceMeters(0);
    setCurrentSpeedKmh(0);
    setSessionDiscoveredIds([]);
    sessionRouteRef.current = [];
    lastTrackedPoint.current = null;
  };

  // Initial GPS on mount
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(perm => {
      if (perm.status !== Location.PermissionStatus.GRANTED) return;
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).then(pos => {
        const coord = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        userGpsRef.current = coord;
        if (isMapReady) {
          sendCommand({
            type: 'SET_LOCATION',
            lat: coord.latitude,
            lng: coord.longitude,
          });
          refreshCheckpoints(coord);
        }
      });
    });
  }, [isMapReady, sendCommand, refreshCheckpoints]);

  // Real GPS live tracking
  useEffect(() => {
    if (isSimulating) return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    Location.requestForegroundPermissionsAsync().then(perm => {
      if (cancelled || perm.status !== Location.PermissionStatus.GRANTED) return;

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 2,
          timeInterval: 1000,
        },
        pos => {
          if (cancelled) return;
          const coord = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          const accuracy = pos.coords.accuracy ?? 100;
          const speed = pos.coords.speed ?? 0;

          if (accuracy > 30) return;

          userGpsRef.current = coord;

          sendCommand({
            type: 'SET_LOCATION',
            lat: coord.latitude,
            lng: coord.longitude,
          });

          checkProximity(coord);

          if (checkpoints.length === 0) {
            refreshCheckpoints(coord);
          } else if (mysteryQuest && !mysteryQuest.isCompleted) {
            const dist = Math.round(metersBetweenCoords(coord, mysteryQuest.targetCoordinate));
            const bearing = calculateBearing(coord, mysteryQuest.targetCoordinate);
            setRadarInfo({
              title: mysteryQuest.titleVi || mysteryQuest.title,
              distance: dist,
              bearing,
              type: 'mystery',
              isMystery: true,
            });
          } else {
            const nearest = getNearestUndiscovered(coord, checkpoints);
            if (nearest) {
              const bearing = calculateBearing(coord, nearest.checkpoint.coordinate);
              setRadarInfo({
                title: nearest.checkpoint.title,
                distance: nearest.distance,
                bearing,
                type: nearest.checkpoint.type,
                isMystery: false,
                checkpoint: nearest.checkpoint,
              });
            } else {
              setRadarInfo(null);
            }
          }

          if (active) {
            if (lastTrackedPoint.current) {
              const dist = metersBetween(lastTrackedPoint.current, coord);
              if (dist >= 2 && dist <= 200) {
                setSessionDistanceMeters(prev => prev + dist);
                sessionRouteRef.current.push(coord);
              }
            } else {
              sessionRouteRef.current.push(coord);
            }
            lastTrackedPoint.current = coord;

            const speedKmh = Math.max(0, speed * 3.6);
            setCurrentSpeedKmh(speedKmh);
          }
        },
      ).then(sub => {
        if (cancelled) sub.remove();
        else subscription = sub;
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [active, isSimulating, sendCommand, checkProximity, refreshCheckpoints, checkpoints]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'FOLLOW_CHANGED') {
        setFollowUser(data.follow);
      } else if (data.type === 'MAP_READY') {
        setIsMapReady(true);
        if (userGpsRef.current) {
          sendCommand({
            type: 'SET_LOCATION',
            lat: userGpsRef.current.latitude,
            lng: userGpsRef.current.longitude,
          });
          refreshCheckpoints(userGpsRef.current);
        }
      } else if (data.type === 'GPS_UPDATE') {
        const coord: MapCoordinate = { latitude: data.lat, longitude: data.lng };
        userGpsRef.current = coord;
        checkProximity(coord);

        if (typeof data.zonePercent === 'number') {
          setZonePercent(data.zonePercent);
        }

        // Update Radar & Mystery distance in real time on each GPS/simulation step
        if (mysteryQuest && !mysteryQuest.isCompleted) {
          const dist = Math.round(metersBetweenCoords(coord, mysteryQuest.targetCoordinate));
          const bearing = calculateBearing(coord, mysteryQuest.targetCoordinate);
          setRadarInfo({
            title: mysteryQuest.titleVi || mysteryQuest.title,
            distance: dist,
            bearing,
            type: 'mystery',
            isMystery: true,
          });
        } else if (checkpoints.length > 0) {
          const nearest = getNearestUndiscovered(coord, checkpoints);
          if (nearest) {
            const bearing = calculateBearing(coord, nearest.checkpoint.coordinate);
            setRadarInfo({
              title: nearest.checkpoint.title,
              distance: nearest.distance,
              bearing,
              type: nearest.checkpoint.type,
              isMystery: false,
              checkpoint: nearest.checkpoint,
            });
          } else {
            setRadarInfo(null);
          }
        }

        if (active) {
          if (lastTrackedPoint.current) {
            const dist = metersBetween(lastTrackedPoint.current, coord);
            if (dist >= 0.5 && dist <= 250) {
              setSessionDistanceMeters(prev => prev + dist);
              sessionRouteRef.current.push(coord);
            }
          } else {
            sessionRouteRef.current.push(coord);
          }
          lastTrackedPoint.current = coord;
          const speedVal = data.speed ? data.speed * 3.6 : 12.6;
          setCurrentSpeedKmh(speedVal);
        }
      } else if (data.type === 'SIM_STEP_METRIC') {
        if (active) {
          setSessionDistanceMeters(prev => prev + (data.distanceMeters || 2.0));
          setCurrentSpeedKmh(data.speedKmh || 5.2);
        }
      } else if (data.type === 'CHECKPOINT_CLICK') {
        if (data.checkpoint) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setInspectedCheckpoint(data.checkpoint);
        }
      } else if (data.type === 'MYSTERY_HIKE_CLICK') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setIsMysteryModalOpen(true);
      }
    } catch {}
  };

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [seconds]);

  const currentPaceFormatted = useMemo(() => {
    if (sessionDistanceMeters < 20 || seconds < 5) return "--'--\"";
    const paceSecondsPerKm = (seconds / sessionDistanceMeters) * 1000;
    if (paceSecondsPerKm > 3600 || paceSecondsPerKm < 60) return "--'--\"";
    const pMin = Math.floor(paceSecondsPerKm / 60);
    const pSec = Math.floor(paceSecondsPerKm % 60);
    return `${pMin}'${pSec.toString().padStart(2, '0')}"`;
  }, [seconds, sessionDistanceMeters]);

  const totalDistanceKm = ((state.distance * 1000 + sessionDistanceMeters) / 1000).toFixed(2);
  const currentSessionKm = (sessionDistanceMeters / 1000).toFixed(2);

  const inspectedDistance = useMemo(() => {
    if (!inspectedCheckpoint || !userGpsRef.current) return undefined;
    return metersBetween(userGpsRef.current, inspectedCheckpoint.coordinate);
  }, [inspectedCheckpoint]);

  const mysteryDistance = useMemo(() => {
    if (!mysteryQuest || !userGpsRef.current) return undefined;
    return metersBetweenCoords(userGpsRef.current, mysteryQuest.targetCoordinate);
  }, [mysteryQuest]);

  const isMysteryArrived = useMemo(() => {
    if (!userGpsRef.current || !mysteryQuest) return false;
    return checkMysteryHikeArrival(userGpsRef.current, mysteryQuest);
  }, [mysteryQuest]);

  const handleClaimMystery = useCallback(() => {
    if (!mysteryQuest) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const questId = mysteryQuest.id;
    const nextCompleted = [...completedMysteryIds, questId];
    setCompletedMysteryIds(nextCompleted);
    AsyncStorage.setItem('wanderly_completed_mystery_v1', JSON.stringify(nextCompleted)).catch(() => {});
    setIsMysteryModalOpen(false);
    setMysteryQuest(prev => (prev ? { ...prev, isCompleted: true } : null));
  }, [mysteryQuest, completedMysteryIds]);

  const comboMultiplier = useMemo(() => {
    return calculateComboMultiplier(seconds, currentSpeedKmh);
  }, [seconds, currentSpeedKmh]);

  const getCheckpointIcon = (type: string) => {
    switch (type) {
      case 'landmark':
        return 'map-pin';
      case 'fragment':
        return 'star';
      case 'mystery':
        return 'compass';
      default:
        return 'gift';
    }
  };

  const WebViewComponent = WebView as any;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Map Engine Canvas / MapLibre WebView */}
      <WebViewComponent
        ref={webViewRef}
        style={styles.webView}
        originWhitelist={['*']}
        source={{ html: MAP_HTML_SOURCE }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />

      {/* Discovery Pop-down Banner */}
      {recentFound && (
        <Animated.View
          style={[
            styles.discoveryBanner,
            {
              backgroundColor: c.secondary,
              borderColor: c.primary,
              transform: [{ translateY: bannerAnim }],
            },
          ]}
        >
          <View style={[styles.discoveryIconWrapper, { backgroundColor: c.primary + '20' }]}>
            <Feather name={getCheckpointIcon(recentFound.type)} size={20} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.discoveryTitle, { color: c.primary }]}>ĐÃ MỞ KHÓA RƯƠNG BÍ ẨN</Text>
            <Text style={[styles.discoverySubtitle, { color: c.foreground }]} numberOfLines={1}>
              {recentFound.title}
            </Text>
          </View>
          <View style={[styles.discoveryReward, { backgroundColor: c.primary + '25' }]}>
            <Text style={[styles.discoveryRewardText, { color: c.primary }]}>
              +{recentFound.reward.amount} {recentFound.reward.type.toUpperCase()}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Top Header Floating Bar with Safe Area */}
      <View style={[styles.topBar, { top: Math.max(insets.top + 8, 16) }]}>
        <View style={[styles.topLevelPill, { backgroundColor: c.card + 'E6', borderColor: c.border }]}>
          <Feather name="compass" size={13} color={c.primary} />
          <Text style={[styles.topLevelText, { color: c.foreground }]}>Wanderly</Text>
        </View>

        <View style={[styles.coinPill, { backgroundColor: c.card + 'E6', borderColor: c.border }]}>
          <Feather name="award" size={13} color={c.primary} />
          <Text style={[styles.coinText, { color: c.foreground }]}>{state.coins}</Text>
        </View>
      </View>

      {/* Floating Mystery Radar HUD */}
      {radarInfo && (
        <Pressable
          style={[
            styles.radarPill,
            {
              top: Math.max(insets.top + 54, 66),
              backgroundColor: radarInfo.isMystery ? '#9333EA18' : c.card + 'F2',
              borderColor: radarInfo.isMystery ? '#9333EA60' : c.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            if (radarInfo.isMystery) {
              setIsMysteryModalOpen(true);
            } else if (radarInfo.checkpoint) {
              setInspectedCheckpoint(radarInfo.checkpoint);
            }
          }}
          accessibilityLabel={radarInfo.isMystery ? 'Xem chi tiết nhiệm vụ Mystery Hike' : 'Xem chi tiết kho báu gần nhất'}
        >
          <View style={[styles.radarIconBox, { backgroundColor: radarInfo.isMystery ? '#9333EA25' : c.primary + '18' }]}>
            <Feather
              name={radarInfo.isMystery ? 'compass' : getCheckpointIcon(radarInfo.type)}
              size={13}
              color={radarInfo.isMystery ? '#9333EA' : c.primary}
            />
          </View>
          <Text style={[styles.radarTitle, { color: c.foreground }]} numberOfLines={1}>
            {radarInfo.title}
          </Text>
          <View style={styles.radarRight}>
            <Text style={[styles.radarDist, { color: radarInfo.isMystery ? '#9333EA' : c.primary }]}>
              {radarInfo.distance}m
            </Text>
            <Text style={[styles.radarBearing, { color: c.mutedForeground }]}>{radarInfo.bearing}</Text>
          </View>
        </Pressable>
      )}

      {/* Floating Action Capsule (Simulate in DEV, Mystery Hike, Recenter, Zoom) */}
      <View style={[styles.floatingToolCapsule, { top: Math.max(insets.top + (radarInfo ? 104 : 56), 108), backgroundColor: c.card + 'EE', borderColor: c.border }]}>
        {__DEV__ && (
          <>
            <Pressable
              style={[
                styles.toolBtn,
                isSimulating && { backgroundColor: c.primary + '25' },
              ]}
              onPress={toggleSimulation}
              accessibilityLabel="Mô phỏng chạy"
            >
              <Feather name={isSimulating ? 'navigation-2' : 'play'} size={18} color={isSimulating ? c.primary : c.foreground} />
            </Pressable>
            <View style={[styles.toolDivider, { backgroundColor: c.border }]} />
          </>
        )}

        {/* Mystery Hike Beacon Quick Trigger */}
        <Pressable
          style={[
            styles.toolBtn,
            mysteryQuest?.isActive && { backgroundColor: '#9333EA20' },
          ]}
          onPress={() => setIsMysteryModalOpen(true)}
          accessibilityLabel="Nhiệm vụ Mystery Hike"
        >
          <Feather name="compass" size={18} color={mysteryQuest?.isCompleted ? c.mutedForeground : '#9333EA'} />
        </Pressable>

        <View style={[styles.toolDivider, { backgroundColor: c.border }]} />

        <Pressable
          style={[styles.toolBtn, !followUser && { backgroundColor: c.primary }]}
          onPress={handleRecenter}
          accessibilityLabel="Định vị lại"
        >
          <Feather name="crosshair" size={18} color={!followUser ? c.primaryForeground : c.foreground} />
        </Pressable>

        <View style={[styles.toolDivider, { backgroundColor: c.border }]} />

        <Pressable style={styles.toolBtn} onPress={() => handleZoom('IN')} accessibilityLabel="Phóng to">
          <Feather name="plus" size={18} color={c.foreground} />
        </Pressable>

        <View style={[styles.toolDivider, { backgroundColor: c.border }]} />

        <Pressable style={styles.toolBtn} onPress={() => handleZoom('OUT')} accessibilityLabel="Thu nhỏ">
          <Feather name="minus" size={18} color={c.foreground} />
        </Pressable>
      </View>

      {/* Bottom Floating Athletic Runner Dock */}
      <View
        style={[
          styles.bottomDock,
          {
            backgroundColor: c.card + 'F8',
            borderColor: c.border,
            bottom: Math.max(insets.bottom + 56, 72),
          },
        ]}
      >
        {/* Combo Pace Multiplier Pill */}
        {active && comboMultiplier > 1.0 && (
          <View style={[styles.comboPill, { backgroundColor: c.warning + '20', borderColor: c.warning }]}>
            <Feather name="zap" size={11} color={c.warning} />
            <Text style={[styles.comboText, { color: c.warning }]}>COMBO PACE x{comboMultiplier.toFixed(1)} XP BOOST</Text>
          </View>
        )}

        {/* Live Exploration Zone % Progress Bar */}
        <View style={styles.zoneProgressWrapper}>
          <View style={styles.zoneProgressHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="compass" size={11} color={c.primary} />
              <Text style={[styles.zoneProgressLabel, { color: c.mutedForeground }]}>
                {active ? 'TIẾN ĐỘ VÀNH ĐAI KHÁM PHÁ' : 'TIẾN ĐỘ VÙNG HIỆN TẠI'}
              </Text>
            </View>
            <Text style={[styles.zoneProgressPercent, { color: c.primary }]}>
              {zonePercent}%
            </Text>
          </View>
          <View style={[styles.zoneProgressTrack, { backgroundColor: c.secondary }]}>
            <View
              style={[
                styles.zoneProgressFill,
                {
                  backgroundColor: c.primary,
                  width: `${zonePercent}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Compact Athletic Row */}
        <View style={styles.dockContentRow}>
          {/* Quick Metrics */}
          <View style={styles.dockMetrics}>
            <View style={styles.dockMetricCol}>
              <Text style={[styles.dockMetricLabel, { color: c.mutedForeground }]}>
                {active ? 'KM' : 'TỔNG'}
              </Text>
              <Text style={[styles.dockMetricVal, { color: c.foreground }]}>
                {active ? currentSessionKm : totalDistanceKm}
                <Text style={[styles.dockMetricUnit, { color: c.mutedForeground }]}> km</Text>
              </Text>
            </View>

            <View style={[styles.dockMetricDivider, { backgroundColor: c.border }]} />

            <View style={styles.dockMetricCol}>
              <Text style={[styles.dockMetricLabel, { color: c.mutedForeground }]}>
                {active ? 'PACE' : 'Ô SƯƠNG'}
              </Text>
              <Text style={[styles.dockMetricVal, { color: c.foreground }]}>
                {active ? currentPaceFormatted : state.explored}
                <Text style={[styles.dockMetricUnit, { color: c.mutedForeground }]}>{active ? '' : ' ô'}</Text>
              </Text>
            </View>

            {active && (
              <>
                <View style={[styles.dockMetricDivider, { backgroundColor: c.border }]} />
                <View style={styles.dockMetricCol}>
                  <Text style={[styles.dockMetricLabel, { color: c.mutedForeground }]}>GIỜ</Text>
                  <Text style={[styles.dockMetricVal, { color: c.primary }]}>{formattedTime}</Text>
                </View>
              </>
            )}
          </View>

          {/* Action Buttons */}
          {!active ? (
            <View style={styles.dockActionGroup}>
              <Pressable
                style={[
                  styles.dockSimBtn,
                  {
                    backgroundColor: isSimulating ? c.primary + '18' : c.secondary,
                    borderColor: isSimulating ? c.primary : c.border,
                  },
                ]}
                onPress={toggleSimulation}
                accessibilityLabel="Mô phỏng chạy"
              >
                <Feather
                  name={isSimulating ? 'stop-circle' : 'play-circle'}
                  size={15}
                  color={isSimulating ? c.primary : c.foreground}
                />
                <Text
                  style={[
                    styles.dockSimText,
                    { color: isSimulating ? c.primary : c.foreground },
                  ]}
                >
                  {isSimulating ? 'Dừng' : 'Mô phỏng'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.dockStartBtn, { backgroundColor: c.primary }]}
                onPress={start}
                accessibilityLabel="Bắt đầu chạy"
              >
                <Feather name="play" size={15} color={c.primaryForeground} />
                <Text style={[styles.dockStartText, { color: c.primaryForeground }]}>BẮT ĐẦU</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.dockActiveActions}>
              <Pressable
                style={[styles.dockIconBtn, { backgroundColor: c.secondary }]}
                onPress={pause}
                accessibilityLabel="Tạm dừng"
              >
                <Feather name="pause" size={16} color={c.foreground} />
              </Pressable>
              <Pressable
                style={[styles.dockIconBtn, { backgroundColor: c.destructive }]}
                onPress={handleFinishSession}
                accessibilityLabel="Kết thúc hành trình"
              >
                <Feather name="square" size={16} color={c.destructiveForeground} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Checkpoint Detail Inspector Modal */}
      <CheckpointDiscoveryModal
        visible={!!inspectedCheckpoint}
        checkpoint={inspectedCheckpoint}
        mode="inspect"
        distanceMeters={inspectedDistance}
        onClose={() => setInspectedCheckpoint(null)}
      />

      {/* Mystery Hike Cryptic Clue Modal */}
      <MysteryHikeModal
        visible={isMysteryModalOpen}
        quest={mysteryQuest}
        distanceMeters={mysteryDistance}
        isArrived={isMysteryArrived}
        onClose={() => setIsMysteryModalOpen(false)}
        onClaim={handleClaimMystery}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1 },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topLevelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  topLevelText: {
    fontSize: 12,
    fontFamily: typography.h4.fontFamily,
    fontWeight: '700',
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    elevation: 3,
  },
  coinText: {
    fontSize: 13,
    fontFamily: typography.buttonSmall.fontFamily,
    fontWeight: '700',
  },
  discoveryBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    zIndex: 99,
    elevation: 8,
  },
  discoveryIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryTitle: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  discoverySubtitle: {
    fontSize: 13,
    fontFamily: typography.body.fontFamily,
    fontWeight: '700',
    marginTop: 2,
  },
  discoveryReward: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  discoveryRewardText: {
    fontSize: 11,
    fontFamily: typography.buttonSmall.fontFamily,
    fontWeight: '800',
  },
  radarPill: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    elevation: 4,
    zIndex: 9,
  },
  radarIconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenter: { flex: 1 },
  radarTag: {
    fontSize: 8.5,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 0.6,
    fontWeight: '800',
  },
  radarTitle: {
    fontSize: 12,
    fontFamily: typography.body.fontFamily,
    fontWeight: '700',
    marginTop: 1,
  },
  radarRight: { alignItems: 'flex-end' },
  radarDist: {
    fontSize: 13,
    fontFamily: typography.statSmall.fontFamily,
    fontWeight: '800',
  },
  radarBearing: {
    fontSize: 9.5,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
  },
  floatingToolCapsule: {
    position: 'absolute',
    right: 16,
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 5,
    zIndex: 9,
  },
  toolBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolDivider: {
    height: 1,
    width: '100%',
  },
  bottomDock: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    zIndex: 10,
  },
  comboPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    marginBottom: 6,
    alignSelf: 'center',
  },
  comboText: {
    fontSize: 9.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  zoneProgressWrapper: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  zoneProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  zoneProgressLabel: {
    fontSize: 9,
    fontFamily: typography.label.fontFamily,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  zoneProgressPercent: {
    fontSize: 10,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '800',
  },
  zoneProgressTrack: {
    height: 4,
    borderRadius: radii.full,
    overflow: 'hidden',
    width: '100%',
  },
  zoneProgressFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  dockContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dockMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dockMetricCol: {
    justifyContent: 'center',
  },
  dockMetricLabel: {
    fontSize: 8.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  dockMetricVal: {
    fontSize: 16,
    fontFamily: typography.statSmall.fontFamily,
    fontWeight: '800',
    marginTop: 1,
  },
  dockMetricUnit: {
    fontSize: 10,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
  },
  dockMetricDivider: {
    width: 1,
    height: 22,
  },
  dockActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dockSimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  dockSimText: {
    fontSize: 11,
    fontFamily: typography.buttonSmall.fontFamily,
    fontWeight: '700',
  },
  dockStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
    elevation: 2,
  },
  dockStartText: {
    fontSize: 12,
    fontFamily: typography.button.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dockActiveActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dockIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
