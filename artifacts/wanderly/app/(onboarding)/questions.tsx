import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Card, Logo, Tag } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';

export default function QuestionsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const { state, dispatch } = useApp();

  const questionKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'] as const;
  const optKeys = [
    'q1_opts',
    'q2_opts',
    'q3_opts',
    'q4_opts',
    'q5_opts',
    'q6_opts',
    'q7_opts',
    'q8_opts',
    'q9_opts',
    'q10_opts',
  ] as const;

  const qi = state.questionIndex;
  const isMulti = qi === 0;
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

  const progressPercent = ((qi + 1) / 10) * 100;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Logo small />
          <View style={[styles.stepBadge, { backgroundColor: c.secondary, borderColor: c.border }]}>
            <Text style={[styles.stepText, { color: c.foreground }]}>
              {qi + 1} / 10
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: c.secondary }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: c.primary },
            ]}
          />
        </View>

        {/* Question Header */}
        <View style={styles.questionSection}>
          <Text style={[styles.eyebrow, { color: c.primary }]}>
            {t.onboarding.eyebrow} · CÂU HỎI {qi + 1}/10
          </Text>
          <Text style={[typography.h2, { color: c.foreground, marginTop: 4 }]}>
            {prompt}
          </Text>
          <Text style={[styles.subHint, { color: c.mutedForeground }]}>
            {isMulti ? t.onboarding.selectAll : t.onboarding.selectOne}
          </Text>
        </View>

        {/* Option Tags */}
        <View style={styles.tagsContainer}>
          {opts.map(x => (
            <Tag key={x} text={x} active={chosen.includes(x)} onPress={() => pick(x)} />
          ))}
        </View>

        <View style={styles.actions}>
          {qi > 0 && (
            <Pressable
              style={[styles.backButton, { backgroundColor: c.secondary, borderColor: c.border }]}
              onPress={back}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
            >
              <Feather name="arrow-left" size={18} color={c.foreground} />
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
  content: { paddingHorizontal: 16, flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  stepText: {
    fontSize: 11,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
  },
  progressTrack: {
    height: 4,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: 4,
    borderRadius: radii.full,
  },
  questionSection: {
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 1,
    fontWeight: '800',
  },
  subHint: {
    fontSize: 12,
    fontFamily: typography.caption.fontFamily,
    marginTop: 4,
  },
  tagsContainer: {
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.xl,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
