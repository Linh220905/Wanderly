import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation, interpolate } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Card, Logo } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import type { ExplorerType } from '@/models/types';

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const answers = state.profile.onboardingAnswers;

  // Determine explorer type
  const explorerType: ExplorerType =
    answers[6]?.includes(t.onboarding.q7_opts.split('|')[2]) ? 'trailSeeker' :
    answers[8]?.includes(t.onboarding.q9_opts.split('|')[1]) ? 'rewardHunter' :
    answers[8]?.includes(t.onboarding.q9_opts.split('|')[0]) ? 'cityPathfinder' :
    'consistencyBuilder';

  const typeName = t.summary.types[explorerType];
  const weeklyTarget = answers[5]?.[0] || '10 km';
  const daysRaw = answers[3]?.[0]?.split(/[–-]/)[0]?.trim() || '3';
  const recommendedDays = interpolate(t.summary.days, { count: daysRaw });

  const handleNext = () => {
    dispatch({ type: 'UPDATE_PROFILE', updates: { explorerType } });
    dispatch({ type: 'SET_GATE', gate: 'paywall' });
    router.push('/(onboarding)/paywall' as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Logo small />

        {/* Archetype Hero Section */}
        <View style={styles.archetypeSection}>
          <View style={[styles.archetypeBadge, { backgroundColor: c.primary + '18' }]}>
            <Feather name="compass" size={13} color={c.primary} />
            <Text style={[styles.archetypeBadgeText, { color: c.primary }]}>{t.summary.eyebrow}</Text>
          </View>

          <Text style={[typography.displayMedium, { color: c.foreground, textAlign: 'center', marginTop: 10 }]}>
            {typeName}
          </Text>

          <Text style={[typography.body, { color: c.mutedForeground, textAlign: 'center', marginTop: 6 }]}>
            {t.summary.body}
          </Text>
        </View>

        {/* Athletic Metrics Targets Card */}
        <Card style={styles.targetsCard}>
          <View style={styles.targetItem}>
            <Text style={[styles.targetLabel, { color: c.mutedForeground }]}>{t.summary.weeklyTarget}</Text>
            <Text style={[typography.h3, { color: c.foreground, marginTop: 2 }]}>{weeklyTarget}</Text>
          </View>
          <View style={[styles.targetDivider, { backgroundColor: c.border }]} />
          <View style={styles.targetItem}>
            <Text style={[styles.targetLabel, { color: c.mutedForeground }]}>{t.summary.recommended}</Text>
            <Text style={[typography.h3, { color: c.primary, marginTop: 2 }]}>{recommendedDays}</Text>
          </View>
        </Card>

        {/* Motto Quote Card */}
        <Card style={styles.quoteCard}>
          <Feather name="award" color={c.accent} size={20} />
          <Text style={[typography.caption, { flex: 1, color: c.foreground, fontWeight: '600' }]}>
            {t.summary.quote}
          </Text>
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            title={t.summary.buildAdventure}
            onPress={handleNext}
            icon="arrow-right"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, flexGrow: 1 },
  archetypeSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  archetypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  archetypeBadgeText: {
    fontSize: 9.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  targetsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  targetItem: {
    alignItems: 'center',
    flex: 1,
  },
  targetLabel: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  targetDivider: {
    width: 1,
    height: 32,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.md,
    padding: spacing.md,
  },
});
