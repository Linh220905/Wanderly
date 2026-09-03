import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Card, EmptyState, SegmentControl, StatCard } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const { profile, state } = useApp();
  const [period, setPeriod] = useState(0);

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    if (dateStr === today.toISOString().split('T')[0]) return t.journey.today;
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.label, { color: c.primary }]}>{t.journey.eyebrow}</Text>
        <Text style={[typography.displaySmall, { color: c.foreground, marginTop: 6 }]}>
          {t.journey.title}
        </Text>

        {/* Period Selector */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
          <SegmentControl
            segments={[t.journey.week, t.journey.month, t.journey.year, t.journey.allTime]}
            active={period}
            onChange={setPeriod}
          />
        </View>

        {/* Stats Summary */}
        <Card style={styles.totalCard}>
          <View style={styles.totalRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: c.mutedForeground }]}>{t.journey.distance}</Text>
              <Text style={[typography.stat, { color: c.foreground, marginTop: 5 }]}>
                {formatDistance(profile.totalDistance)}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[typography.label, { color: c.mutedForeground }]}>{t.journey.sessions}</Text>
              <Text style={[typography.stat, { color: c.foreground, marginTop: 5 }]}>
                {profile.totalSessions}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[typography.label, { color: c.mutedForeground }]}>{t.journey.streak}</Text>
              <Text style={[typography.stat, { color: c.foreground, marginTop: 5 }]}>
                {profile.streak}
              </Text>
            </View>
          </View>
        </Card>

        {/* Session List */}
        {state.sessions.length > 0 ? (
          <View style={{ marginTop: spacing.lg }}>
            {state.sessions.map((session, index) => (
              <Card key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionRow}>
                  <View style={[styles.sessionMap, { backgroundColor: c.secondary }]}>
                    <Feather name="navigation" size={22} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h4, { color: c.foreground }]}>
                      {t.journey.sessionTitle}
                    </Text>
                    <Text style={[typography.bodySmall, { color: c.mutedForeground, marginTop: 4 }]}>
                      {formatDate(session.date)} · {session.activityType === 'run' ? t.journey.run : t.journey.run}
                    </Text>
                    <View style={styles.sessionStats}>
                      <Text style={[typography.bodySmall, { color: c.primary }]}>
                        {formatDistance(session.distance)}
                      </Text>
                      <Text style={[typography.bodySmall, { color: c.mutedForeground }]}> · </Text>
                      <Text style={[typography.bodySmall, { color: c.primary }]}>
                        {formatDuration(session.duration)}
                      </Text>
                      <Text style={[typography.bodySmall, { color: c.mutedForeground }]}> · </Text>
                      <Text style={[typography.bodySmall, { color: c.primary }]}>
                        +{session.xpEarned} XP
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color={c.mutedForeground} />
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="map"
            title={t.journey.emptyTitle}
            description={t.journey.emptyBody}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 26, paddingBottom: 120 },
  totalCard: { marginBottom: 0 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sessionCard: { marginTop: 12 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  sessionMap: {
    height: 56, width: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  sessionStats: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
