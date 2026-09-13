import React from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { Button, Card } from '@/components/ui/SharedComponents';
import { RouteThumbnail } from '@/components/ui/RouteThumbnail';
import type { ExplorationSession } from '@/models/types';

interface SessionDetailModalProps {
  visible: boolean;
  session: ExplorationSession | null;
  onClose: () => void;
}

export function SessionDetailModal({ visible, session, onClose }: SessionDetailModalProps) {
  const c = useColors();

  if (!session) return null;

  const distanceMeters = session.distance || 0;
  const distanceKm = distanceMeters / 1000;
  const durationSeconds = session.duration || 0;
  const durationMin = durationSeconds / 60;
  const cellsRevealed = session.cellsRevealed || 0;
  const xpEarned = session.xpEarned || 0;
  const coinsEarned = session.coinsEarned || 0;
  const chestsCount = session.checkpointsDiscovered?.length || 0;
  const routePoints = session.route || [];

  // Strava Pace Calculation (min/km)
  const paceMinutesPerKm = distanceKm > 0 ? durationMin / distanceKm : 0;
  const paceMins = Math.floor(paceMinutesPerKm);
  const paceSecs = Math.round((paceMinutesPerKm - paceMins) * 60);
  const formattedPace = distanceKm > 0 ? `${paceMins}'${String(paceSecs).padStart(2, '0')}"` : `--'--"`;

  // Average Speed (km/h)
  const avgSpeedKmh = durationMin > 0 ? ((distanceKm / durationMin) * 60).toFixed(1) : '0.0';

  // Estimated Calories
  const estimatedCalories = Math.round(distanceKm * 62 + durationMin * 3.5);

  // Elevation Gain est
  const estElevationGain = Math.max(12, Math.round(distanceKm * 18));

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    }
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const formatDateFull = (dateStr?: string) => {
    if (!dateStr) return 'Hành trình khám phá';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const dist = formatDistance(distanceMeters);
      const dur = formatDuration(durationSeconds);
      const message = `🏃‍♂️ HÀNH TRÌNH WANDERLY STRAVA STATS 🏆\n\n📍 Quãng đường: ${dist}\n⏱️ Thời gian: ${dur}\n⚡ Pace trung bình: ${formattedPace}/km\n🔥 Calo tiêu hao: ~${estimatedCalories} kcal\n✨ Sương mù giải phóng: ${cellsRevealed} ô\n🎁 Kho báu thu thập: ${chestsCount} rương\n\n#Wanderly #RunningLife #StravaStyle`;
      await Share.share({ message });
    } catch {}
  };

  return (
    <Modal
      visible={visible && !!session}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        {/* Backdrop Tap Area */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Modal Bottom Sheet Content */}
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: c.background,
              borderColor: c.border,
            },
          ]}
        >
          {/* Header Bar */}
          <View style={[styles.headerBar, { borderBottomColor: c.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerEyebrow, { color: c.primary }]}>CHI TIẾT HÀNH TRÌNH</Text>
              <Text style={[typography.h4, { color: c.foreground, marginTop: 2 }]} numberOfLines={1}>
                {formatDateFull(session.date)}
              </Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: c.secondary, borderColor: c.border }]}
              onPress={onClose}
              accessibilityLabel="Đóng chi tiết"
            >
              <Feather name="x" size={18} color={c.foreground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Strava Route GPS Card Viewport */}
            <View style={[styles.routeCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.routeHeader}>
                <View style={[styles.activityPill, { backgroundColor: '#FC520015' }]}>
                  <Feather name="activity" size={12} color="#FC5200" />
                  <Text style={[styles.activityText, { color: '#FC5200' }]}>CHẠY BỘ NGOÀI TRỜI</Text>
                </View>
                <Text style={[styles.coordBadge, { color: c.mutedForeground }]}>
                  GPS Track ({routePoints.length} điểm)
                </Text>
              </View>

              {/* Vector SVG Path Canvas on Clean Athletic Surface */}
              <View style={[styles.thumbnailWrapper, { backgroundColor: '#F8FAFC', borderColor: c.border, borderWidth: 1 }]}>
                <RouteThumbnail
                  route={routePoints}
                  width={300}
                  height={150}
                  strokeColor="#FC5200"
                  strokeWidth={3.5}
                />
              </View>
            </View>

            {/* Big Primary Metrics (Strava Style) */}
            <View style={[styles.primaryMetricsGrid, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.primaryMetricCol}>
                <Text style={[styles.primaryLabel, { color: c.mutedForeground }]}>QUÃNG ĐƯỜNG</Text>
                <Text style={[styles.primaryValue, { color: c.foreground }]}>
                  {distanceKm.toFixed(2)}
                  <Text style={[styles.primaryUnit, { color: c.mutedForeground }]}> km</Text>
                </Text>
              </View>

              <View style={[styles.metricDividerVertical, { backgroundColor: c.border }]} />

              <View style={styles.primaryMetricCol}>
                <Text style={[styles.primaryLabel, { color: c.mutedForeground }]}>PACE TRUNG BÌNH</Text>
                <Text style={[styles.primaryValue, { color: c.foreground }]}>
                  {formattedPace}
                  <Text style={[styles.primaryUnit, { color: c.mutedForeground }]}> /km</Text>
                </Text>
              </View>

              <View style={[styles.metricDividerVertical, { backgroundColor: c.border }]} />

              <View style={styles.primaryMetricCol}>
                <Text style={[styles.primaryLabel, { color: c.mutedForeground }]}>THỜI GIAN</Text>
                <Text style={[styles.primaryValue, { color: c.foreground }]}>
                  {formatDuration(durationSeconds)}
                </Text>
              </View>
            </View>

            {/* Secondary Advanced Analytics Grid */}
            <View style={styles.secondaryGrid}>
              <View style={[styles.subStatBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.subStatHeader}>
                  <Feather name="zap" size={14} color={c.warning} />
                  <Text style={[styles.subStatLabel, { color: c.mutedForeground }]}>Tốc độ TB</Text>
                </View>
                <Text style={[styles.subStatVal, { color: c.foreground }]}>
                  {avgSpeedKmh} <Text style={styles.subStatUnit}>km/h</Text>
                </Text>
              </View>

              <View style={[styles.subStatBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.subStatHeader}>
                  <Feather name="activity" size={14} color="#EF4444" />
                  <Text style={[styles.subStatLabel, { color: c.mutedForeground }]}>Calo tiêu hao</Text>
                </View>
                <Text style={[styles.subStatVal, { color: c.foreground }]}>
                  ~{estimatedCalories} <Text style={styles.subStatUnit}>kcal</Text>
                </Text>
              </View>

              <View style={[styles.subStatBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.subStatHeader}>
                  <Feather name="trending-up" size={14} color={c.accent} />
                  <Text style={[styles.subStatLabel, { color: c.mutedForeground }]}>Độ cao ước tính</Text>
                </View>
                <Text style={[styles.subStatVal, { color: c.foreground }]}>
                  +{estElevationGain} <Text style={styles.subStatUnit}>m</Text>
                </Text>
              </View>

              <View style={[styles.subStatBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.subStatHeader}>
                  <Feather name="grid" size={14} color={c.primary} />
                  <Text style={[styles.subStatLabel, { color: c.mutedForeground }]}>Ô sương mù</Text>
                </View>
                <Text style={[styles.subStatVal, { color: c.primary }]}>
                  +{cellsRevealed} <Text style={styles.subStatUnit}>ô</Text>
                </Text>
              </View>
            </View>

            {/* Gamification Loot Card */}
            <Card style={styles.lootCard}>
              <Text style={[styles.lootTitle, { color: c.primary }]}>PHẦN THƯỞNG KHÁM PHÁ BẢN ĐỒ</Text>
              <View style={styles.lootRow}>
                <View style={[styles.lootItem, { backgroundColor: c.primary + '18' }]}>
                  <Feather name="zap" size={16} color={c.primary} />
                  <Text style={[styles.lootAmount, { color: c.primary }]}>+{xpEarned} XP</Text>
                </View>

                <View style={[styles.lootItem, { backgroundColor: c.accent + '18' }]}>
                  <Feather name="award" size={16} color={c.accent} />
                  <Text style={[styles.lootAmount, { color: c.accent }]}>+{coinsEarned} Coins</Text>
                </View>

                <View style={[styles.lootItem, { backgroundColor: c.warning + '18' }]}>
                  <Feather name="gift" size={16} color={c.warning} />
                  <Text style={[styles.lootAmount, { color: c.warning }]}>
                    {chestsCount} Rương
                  </Text>
                </View>
              </View>
            </Card>

            {/* Action Buttons */}
            <View style={{ marginTop: spacing.md, gap: 10 }}>
              <Button title="Chia sẻ thành tích (Strava Card)" onPress={handleShare} icon="share-2" />
              <Button title="Đóng" onPress={onClose} secondary />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '86%',
    maxHeight: '88%',
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerEyebrow: {
    fontSize: 9.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  routeCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  activityText: {
    fontSize: 9,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  coordBadge: {
    fontSize: 10,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
  },
  thumbnailWrapper: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
  },
  primaryMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 8.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  primaryValue: {
    fontSize: 18,
    fontFamily: typography.stat.fontFamily,
    fontWeight: '800',
    marginTop: 4,
  },
  primaryUnit: {
    fontSize: 11,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
  },
  metricDividerVertical: {
    width: 1,
    height: 36,
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  subStatBox: {
    width: '48.5%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.sm + 2,
  },
  subStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  subStatLabel: {
    fontSize: 9.5,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
  },
  subStatVal: {
    fontSize: 15,
    fontFamily: typography.statSmall.fontFamily,
    fontWeight: '800',
    marginTop: 4,
  },
  subStatUnit: {
    fontSize: 10,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
  },
  lootCard: {
    padding: spacing.md,
  },
  lootTitle: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  lootRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lootItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  lootAmount: {
    fontSize: 11.5,
    fontFamily: typography.buttonSmall.fontFamily,
    fontWeight: '800',
  },
});
