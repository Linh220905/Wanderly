import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation, interpolate } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Logo } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import type { ExplorerType } from '@/models/types';

export default function SummaryScreen() {
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
      <ScrollView contentContainerStyle={styles.content}>
        <Logo small />

        <Text style={[typography.label, { color: c.primary, marginTop: spacing['3xl'] }]}>
          {t.summary.eyebrow}
        </Text>
        <Text style={[typography.displayLarge, { color: c.foreground, marginTop: spacing.sm }]}>
          {typeName}
        </Text>
        <Text style={[typography.bodyLarge, { color: c.mutedForeground, marginTop: spacing.md, marginBottom: spacing['2xl'] }]}>
          {t.summary.body}
        </Text>

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View>
            <Text style={[typography.label, { color: c.mutedForeground }]}>{t.summary.weeklyTarget}</Text>
            <Text style={[typography.stat, { color: c.foreground, marginTop: 7 }]}>{weeklyTarget}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View>
            <Text style={[typography.label, { color: c.mutedForeground }]}>{t.summary.recommended}</Text>
            <Text style={[typography.stat, { color: c.foreground, marginTop: 7 }]}>{recommendedDays}</Text>
          </View>
        </View>

        {/* Quote */}
        <View style={[styles.quote, { borderLeftColor: c.primary }]}>
          <Feather name="compass" color={c.primary} size={21} />
          <Text style={[typography.body, { flex: 1, color: c.accent, fontWeight: '500' }]}>
            {t.summary.quote}
          </Text>
        </View>

        <Button
          title={t.summary.buildAdventure}
          onPress={handleNext}
          icon="arrow-right"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 26, paddingTop: 58, paddingBottom: 32, flexGrow: 1 },
  statsCard: {
    borderRadius: 22, borderWidth: 1, padding: 21,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  divider: { width: 1, height: 48 },
  quote: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginVertical: 28, padding: 17, borderLeftWidth: 2,
  },
});
