import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Logo, Tag } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing } from '@/constants/spacing';

export default function QuestionsScreen() {
  const c = useColors();
  const { t } = useTranslation();
  const { state, dispatch } = useApp();

  const questionKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'] as const;
  const optKeys = ['q1_opts', 'q2_opts', 'q3_opts', 'q4_opts', 'q5_opts', 'q6_opts', 'q7_opts', 'q8_opts', 'q9_opts', 'q10_opts'] as const;

  const qi = state.questionIndex;
  const isMulti = qi === 0; // Only first question allows multiple selection
  const prompt = t.onboarding[questionKeys[qi]];
  const opts = t.onboarding[optKeys[qi]].split('|');
  const chosen = state.profile.onboardingAnswers[qi] || [];

  const pick = (x: string) => {
    const currentAnswers = [...chosen];
    if (isMulti) {
      const updated = currentAnswers.includes(x)
        ? currentAnswers.filter(y => y !== x)
        : [...currentAnswers, x];
      dispatch({ type: 'SET_ANSWER', questionIndex: qi, answers: updated });
    } else {
      dispatch({ type: 'SET_ANSWER', questionIndex: qi, answers: [x] });
    }
  };

  const next = () => {
    if (chosen.length === 0) return;
    if (qi === 9) {
      dispatch({ type: 'SET_GATE', gate: 'summary' });
      router.push('/(onboarding)/summary' as any);
    } else {
      dispatch({ type: 'SET_QUESTION_INDEX', index: qi + 1 });
    }
  };

  const back = () => {
    if (qi > 0) {
      dispatch({ type: 'SET_QUESTION_INDEX', index: qi - 1 });
    } else {
      router.back();
    }
  };

  const progressWidth = `${((qi + 1) / 10) * 100}%`;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Logo small />
          <Text style={[typography.labelMedium, { color: c.mutedForeground }]}>
            {qi + 1} / 10
          </Text>
        </View>

        <View style={[styles.progress, { backgroundColor: c.secondary }]}>
          <View style={[styles.progressFill, { width: progressWidth as any, backgroundColor: c.primary }]} />
        </View>

        <Text style={[typography.label, { color: c.primary, marginBottom: spacing.md }]}>
          {t.onboarding.eyebrow}
        </Text>
        <Text style={[typography.displaySmall, { color: c.foreground }]}>
          {prompt}
        </Text>
        <Text style={[typography.body, { color: c.mutedForeground, marginTop: spacing.md }]}>
          {isMulti ? t.onboarding.selectAll : t.onboarding.selectOne}
        </Text>

        <View style={styles.tags}>
          {opts.map(x => (
            <Tag key={x} text={x} active={chosen.includes(x)} onPress={() => pick(x)} />
          ))}
        </View>

        <View style={styles.actions}>
          {qi > 0 && (
            <Pressable style={styles.backButton} onPress={back}>
              <Feather name="arrow-left" size={17} color={c.mutedForeground} />
              <Text style={[typography.buttonSmall, { color: c.mutedForeground }]}>
                {t.common.back}
              </Text>
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Button
              title={qi === 9 ? t.onboarding.seeType : t.common.continue}
              onPress={next}
              disabled={chosen.length === 0}
              icon="arrow-right"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, paddingTop: 55, paddingBottom: 30, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progress: { height: 5, borderRadius: 3, marginTop: 22, marginBottom: 46 },
  progressFill: { height: 5, borderRadius: 3 },
  tags: { gap: 12, marginTop: 30 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 35 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 },
});
