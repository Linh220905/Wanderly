import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTranslation, interpolate } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Card, ProgressBar, SegmentControl } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import {
  generateDailyMissions,
  generateWeeklyMissions,
  shouldRefreshDailyMissions,
  shouldRefreshWeeklyMissions,
  getMissionDisplayValues,
  timeUntilDailyRefresh,
  timeUntilWeeklyRefresh,
} from '@/services/MissionService';

export default function MissionsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const { state, dispatch, profile } = useApp();
  const [activeSegment, setActiveSegment] = useState(0);

  // Initialize or refresh missions
  useEffect(() => {
    let missions = [...state.missions];
    let changed = false;

    if (shouldRefreshDailyMissions(missions)) {
      const dailyMissions = generateDailyMissions(profile);
      missions = missions.filter(m => m.frequency !== 'daily').concat(dailyMissions);
      changed = true;
    }

    if (shouldRefreshWeeklyMissions(missions)) {
      const weeklyMissions = generateWeeklyMissions(profile);
      missions = missions.filter(m => m.frequency !== 'weekly').concat(weeklyMissions);
      changed = true;
    }

    if (changed) {
      dispatch({ type: 'SET_MISSIONS', missions });
    }
  }, []);

  const dailyMissions = state.missions.filter(m => m.frequency === 'daily');
  const weeklyMissions = state.missions.filter(m => m.frequency === 'weekly');
  const activeMissions = activeSegment === 0 ? dailyMissions : weeklyMissions;
  const refreshTime = activeSegment === 0 ? timeUntilDailyRefresh() : timeUntilWeeklyRefresh();

  const claimMission = (missionId: string) => {
    const mission = state.missions.find(m => m.id === missionId);
    if (!mission || mission.claimed) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: 'CLAIM_MISSION', missionId });

    if (mission.reward.type === 'xp') {
      dispatch({ type: 'ADD_XP', amount: mission.reward.amount });
    } else {
      dispatch({ type: 'ADD_COINS', amount: mission.reward.amount });
    }
  };

  const getMissionIcon = (type: string): keyof typeof Feather.glyphMap => {
    const icons: Record<string, keyof typeof Feather.glyphMap> = {
      moveDistance: 'navigation',
      exploreCells: 'grid',
      completeSessions: 'check-circle',
      maintainStreak: 'zap',
      discoverCheckpoint: 'gift',
      weeklyDistance: 'trending-up',
      weeklyExplore: 'map',
    };
    return icons[type] || 'target';
  };

  const getMissionTitle = (mission: typeof activeMissions[0]): string => {
    const { templateKey, templateVars } = getMissionDisplayValues(mission);
    const template = (t.missions.templates as any)[templateKey];
    return template ? interpolate(template, templateVars) : mission.title;
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.label, { color: c.primary }]}>{t.missions.eyebrow}</Text>
        <Text style={[typography.displaySmall, { color: c.foreground, marginTop: 6 }]}>
          {t.missions.title}
        </Text>
        <Text style={[typography.body, { color: c.mutedForeground, marginTop: spacing.md, marginBottom: spacing.xl }]}>
          {t.missions.body}
        </Text>

        <SegmentControl
          segments={[t.missions.daily, t.missions.weekly]}
          active={activeSegment}
          onChange={setActiveSegment}
        />

        <View style={{ marginTop: spacing.xl }}>
          {activeMissions.map(mission => {
            const { progressPercent, isComplete } = getMissionDisplayValues(mission);
            const rewardLabel = `${mission.reward.amount} ${mission.reward.type === 'xp' ? 'XP' : 'coins'}`;

            return (
              <Card key={mission.id} style={styles.missionCard}>
                <View style={styles.missionTop}>
                  <View style={[styles.missionIcon, { backgroundColor: c.secondary }]}>
                    <Feather name={getMissionIcon(mission.type)} size={18} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h4, { color: c.foreground }]}>
                      {getMissionTitle(mission)}
                    </Text>
                    <Text style={[typography.bodySmall, { color: c.primary, marginTop: 4 }]}>
                      {rewardLabel}
                    </Text>
                  </View>
                  {isComplete && !mission.claimed ? (
                    <Pressable
                      style={[styles.claimButton, { backgroundColor: c.primary }]}
                      onPress={() => claimMission(mission.id)}
                    >
                      <Text style={[typography.buttonSmall, { color: c.primaryForeground }]}>
                        {t.missions.claim}
                      </Text>
                    </Pressable>
                  ) : mission.claimed ? (
                    <View style={[styles.completedBadge, { backgroundColor: c.success + '20' }]}>
                      <Feather name="check" size={14} color={c.success} />
                    </View>
                  ) : (
                    <Text style={[typography.labelMedium, { color: c.accent }]}>
                      {progressPercent}%
                    </Text>
                  )}
                </View>
                <View style={{ marginTop: spacing.md }}>
                  <ProgressBar progress={progressPercent / 100} />
                </View>
              </Card>
            );
          })}
        </View>

        {/* Refresh Timer */}
        <Text style={[typography.caption, { color: c.mutedForeground, textAlign: 'center', marginTop: spacing.xl }]}>
          {interpolate(t.missions.refreshIn, { time: refreshTime })}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 26, paddingBottom: 120 },
  missionCard: { marginBottom: 12 },
  missionTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  missionIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  claimButton: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  completedBadge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});
