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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Native Clean App Header */}
        <View style={styles.navHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: c.primary }]}>{t.missions.eyebrow}</Text>
            <Text style={[typography.h1, { color: c.foreground, marginTop: 2 }]}>
              {t.missions.title}
            </Text>
          </View>

          <View style={[styles.timerBadge, { backgroundColor: c.card, borderColor: c.border }]}>
            <Feather name="clock" size={12} color={c.primary} />
            <Text style={[styles.timerBadgeText, { color: c.mutedForeground }]}>
              {interpolate(t.missions.refreshIn, { time: refreshTime })}
            </Text>
          </View>
        </View>

        {/* Segment Switcher */}
        <View style={{ marginTop: spacing.md }}>
          <SegmentControl
            segments={[t.missions.daily, t.missions.weekly]}
            active={activeSegment}
            onChange={setActiveSegment}
          />
        </View>

        {/* Mission List */}
        <View style={{ marginTop: spacing.md, gap: 10 }}>
          {activeMissions.map(mission => {
            const { progressPercent, isComplete } = getMissionDisplayValues(mission);
            const rewardLabel = `+${mission.reward.amount} ${mission.reward.type === 'xp' ? 'XP' : 'XU'}`;

            return (
              <Card
                key={mission.id}
                style={[
                  styles.missionCard,
                  isComplete && !mission.claimed && { borderColor: c.primary + '80' },
                ]}
              >
                <View style={styles.missionTop}>
                  <View
                    style={[
                      styles.missionIcon,
                      {
                        backgroundColor: isComplete ? c.primary + '15' : c.secondary,
                        borderColor: isComplete ? c.primary + '40' : c.border,
                      },
                    ]}
                  >
                    <Feather
                      name={getMissionIcon(mission.type)}
                      size={20}
                      color={isComplete ? c.primary : c.foreground}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h4, { color: c.foreground }]} numberOfLines={2}>
                      {getMissionTitle(mission)}
                    </Text>
                    <View style={styles.rewardRow}>
                      <View style={[styles.rewardBadge, { backgroundColor: c.primary + '18' }]}>
                        <Feather
                          name={mission.reward.type === 'xp' ? 'zap' : 'award'}
                          size={11}
                          color={c.primary}
                        />
                        <Text style={[styles.rewardBadgeText, { color: c.primary }]}>
                          {rewardLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {isComplete && !mission.claimed ? (
                    <Pressable
                      style={[styles.claimButton, { backgroundColor: c.primary }]}
                      onPress={() => claimMission(mission.id)}
                      accessibilityLabel={t.missions.claim}
                    >
                      <Feather name="gift" size={13} color={c.primaryForeground} />
                      <Text style={[styles.claimText, { color: c.primaryForeground }]}>
                        {t.missions.claim}
                      </Text>
                    </Pressable>
                  ) : mission.claimed ? (
                    <View style={[styles.completedBadge, { backgroundColor: c.accent + '20' }]}>
                      <Feather name="check" size={15} color={c.accent} />
                    </View>
                  ) : (
                    <Text style={[styles.percentText, { color: c.mutedForeground }]}>
                      {progressPercent}%
                    </Text>
                  )}
                </View>

                <View style={{ marginTop: 12 }}>
                  <ProgressBar
                    progress={progressPercent / 100}
                    color={isComplete ? c.accent : c.primary}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16 },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  timerBadgeText: {
    fontSize: 11,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '700',
  },
  missionCard: {
    padding: spacing.md,
  },
  missionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  missionIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  rewardBadgeText: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.md,
  },
  claimText: {
    fontSize: 11,
    fontFamily: typography.buttonSmall.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 12,
    fontFamily: typography.statSmall.fontFamily,
    fontWeight: '700',
  },
});
