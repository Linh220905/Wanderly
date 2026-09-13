import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Card, EmptyState, SegmentControl } from '@/components/ui/SharedComponents';
import { RouteThumbnail, ElevationSparkline } from '@/components/ui/RouteThumbnail';
import { SessionDetailModal } from '@/components/modals/SessionDetailModal';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import type { ExplorationSession } from '@/models/types';

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const { profile, state } = useApp();
  const [period, setPeriod] = useState(0);
  const [selectedSession, setSelectedSession] = useState<ExplorationSession | null>(null);

  // Real recorded user sessions
  const displaySessions: ExplorationSession[] = useMemo(() => {
    return state.sessions.filter(s => s.distance > 0);
  }, [state.sessions]);

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (hrs > 0) return `${hrs}h ${m}m`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const formatElevation = (distanceMeters: number) => {
    const est = Math.max(15, Math.round((distanceMeters / 1000) * 16));
    return `${est} m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    if (dateStr === today.toISOString().split('T')[0]) return t.journey.today;
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Hôm qua';

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getSessionTitle = (session: ExplorationSession, index: number) => {
    if (session.distance > 5000) return 'Vòng chạy Thành Phố Mở Rộng';
    if (session.distance > 3000) return 'Lộ trình Công Viên Trung Tâm';
    return `Cung đường Khám phá #${displaySessions.length - index}`;
  };

  const handleOpenDetail = (session: ExplorationSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedSession(session);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.navHeader}>
          <Text style={[styles.eyebrow, { color: '#FC5200' }]}>{t.journey.eyebrow}</Text>
          <Text style={[typography.h1, { color: c.foreground, marginTop: 2 }]}>
            {t.journey.title}
          </Text>
        </View>

        {/* Period Selector */}
        <View style={{ marginTop: spacing.md }}>
          <SegmentControl
            segments={[t.journey.week, t.journey.month, t.journey.year, t.journey.allTime]}
            active={period}
            onChange={setPeriod}
          />
        </View>

        {/* Stats Summary Card */}
        <Card style={styles.totalCard}>
          <View style={styles.totalRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconHeader}>
                <Feather name="navigation" size={13} color="#FC5200" />
                <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{t.journey.distance}</Text>
              </View>
              <Text style={[typography.h3, { color: c.foreground, marginTop: 4 }]}>
                {formatDistance(profile.totalDistance)}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: c.border }]} />

            <View style={styles.statBox}>
              <View style={styles.statIconHeader}>
                <Feather name="check-circle" size={13} color={c.accent} />
                <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{t.journey.sessions}</Text>
              </View>
              <Text style={[typography.h3, { color: c.foreground, marginTop: 4 }]}>
                {profile.totalSessions}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: c.border }]} />

            <View style={styles.statBox}>
              <View style={styles.statIconHeader}>
                <Feather name="zap" size={13} color={c.warning} />
                <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{t.journey.streak}</Text>
              </View>
              <Text style={[typography.h3, { color: c.warning, marginTop: 4 }]}>
                {profile.streak}d
              </Text>
            </View>
          </View>
        </Card>

        {/* Routes List Section */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>LỘ TRÌNH ĐÃ LƯU & LỊCH SỬ</Text>
            <Text style={[styles.sectionSubtitleBadge, { color: c.mutedForeground }]}>
              {displaySessions.length} routes
            </Text>
          </View>

          {displaySessions.length > 0 ? (
            <View style={{ gap: 14, marginTop: 12 }}>
              {displaySessions.map((session, index) => (
                <TouchableOpacity
                  key={session.id}
                  activeOpacity={0.85}
                  onPress={() => handleOpenDetail(session)}
                  style={[
                    styles.stravaCard,
                    {
                      backgroundColor: c.card,
                      borderColor: c.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.activityBadgeGroup}>
                      <View style={[styles.typeIconBox, { backgroundColor: '#FC520014' }]}>
                        <Feather name="navigation" size={12} color="#FC5200" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.h4, { color: c.foreground }]} numberOfLines={1}>
                          {getSessionTitle(session, index)}
                        </Text>
                        <Text style={[styles.dateText, { color: c.mutedForeground }]}>
                          {formatDate(session.date)} · GPS Track
                        </Text>
                      </View>
                    </View>

                    <View style={styles.openPillBtn}>
                      <Text style={styles.openPillBtnText}>Chi tiết</Text>
                      <Feather name="chevron-right" size={13} color="#FC5200" />
                    </View>
                  </View>

                  <View style={[styles.cardDivider, { backgroundColor: c.border }]} />

                  <View style={styles.cardBodyRow}>
                    {/* GPS Route Vector Preview */}
                    <View style={[styles.vectorThumbnailBox, { backgroundColor: '#F8FAFC', borderColor: c.border }]}>
                      <RouteThumbnail
                        route={session.route}
                        width={92}
                        height={76}
                        strokeColor="#FC5200"
                        strokeWidth={2.8}
                      />
                    </View>

                    {/* Strava 3-Column Telemetry */}
                    <View style={styles.metricsContainer}>
                      <View style={styles.metricsTripleRow}>
                        <View style={styles.metricItem}>
                          <Text style={[styles.metricLabel, { color: c.mutedForeground }]}>QUÃNG ĐƯỜNG</Text>
                          <Text style={[styles.metricValueLarge, { color: c.foreground }]}>
                            {formatDistance(session.distance)}
                          </Text>
                        </View>

                        <View style={styles.metricItem}>
                          <Text style={[styles.metricLabel, { color: c.mutedForeground }]}>THỜI GIAN</Text>
                          <Text style={[styles.metricValueLarge, { color: c.foreground }]}>
                            {formatDuration(session.duration)}
                          </Text>
                        </View>

                        <View style={styles.metricItem}>
                          <Text style={[styles.metricLabel, { color: c.mutedForeground }]}>ĐỘ CAO</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Text style={[styles.metricValueLarge, { color: c.foreground }]}>
                              {formatElevation(session.distance)}
                            </Text>
                            <ElevationSparkline width={28} height={14} color="#94A3B8" />
                          </View>
                        </View>
                      </View>

                      {/* Discovery Reward Badges */}
                      <View style={styles.bottomChipsRow}>
                        <View style={[styles.fogPill, { backgroundColor: c.secondary }]}>
                          <Feather name="grid" size={10} color={c.mutedForeground} />
                          <Text style={[styles.fogPillText, { color: c.foreground }]}>
                            +{session.cellsRevealed} ô sương
                          </Text>
                        </View>

                        <View style={[styles.xpPill, { backgroundColor: '#FC520014' }]}>
                          <Feather name="zap" size={10} color="#FC5200" />
                          <Text style={[styles.xpPillText, { color: '#FC5200' }]}>
                            +{session.xpEarned} XP
                          </Text>
                        </View>

                        {session.checkpointsDiscovered && session.checkpointsDiscovered.length > 0 && (
                          <View style={[styles.chestPill, { backgroundColor: '#F59E0B16' }]}>
                            <Feather name="gift" size={10} color="#D97706" />
                            <Text style={[styles.chestPillText, { color: '#D97706' }]}>
                              +{session.checkpointsDiscovered.length} Rương
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Card style={styles.emptyCard}>
              <EmptyState
                icon="map"
                title={t.journey.emptyTitle}
                description={t.journey.emptyBody}
              />
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Strava Detailed Analytics Bottom Sheet Modal */}
      <SessionDetailModal
        visible={!!selectedSession}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16 },
  navHeader: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 1,
  },
  totalCard: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionSubtitleBadge: {
    fontSize: 11,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
  },
  stravaCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  typeIconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: '#FC520012',
  },
  openPillBtnText: {
    color: '#FC5200',
    fontSize: 11,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
  },
  cardDivider: {
    width: '100%',
    height: 1,
    marginVertical: 10,
    opacity: 0.6,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vectorThumbnailBox: {
    width: 94,
    height: 78,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  metricsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  metricsTripleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 8.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  metricValueLarge: {
    fontSize: 13.5,
    fontFamily: typography.statSmall.fontFamily,
    fontWeight: '800',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  fogPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  fogPillText: {
    fontSize: 10,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '700',
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  xpPillText: {
    fontSize: 10,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '800',
  },
  chestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  chestPillText: {
    fontSize: 10,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '800',
  },
  emptyCard: {
    marginTop: 8,
    padding: spacing.lg,
  },
});
