import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';

export default function PaywallScreen() {
  const c = useColors();
  const { t } = useTranslation();
  const { dispatch } = useApp();

  const go = (premium: boolean) => {
    dispatch({ type: 'SET_PREMIUM', premium });
    dispatch({ type: 'SET_GATE', gate: 'auth' });
    router.push('/(onboarding)/auth' as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.close} onPress={() => go(false)}>
          <Feather name="x" color={c.mutedForeground} size={20} />
        </Pressable>

        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: c.primary }]}>
          <Feather name="star" size={14} color={c.primaryForeground} />
          <Text style={[styles.badgeText, { color: c.primaryForeground }]}>{t.paywall.badge}</Text>
        </View>

        <Text style={[typography.displayMedium, { color: c.foreground, marginTop: spacing.xl }]}>
          {t.paywall.title}
        </Text>
        <Text style={[typography.bodyLarge, { color: c.mutedForeground, marginTop: spacing.md }]}>
          {t.paywall.body}
        </Text>

        {/* Benefits */}
        <View style={styles.benefits}>
          {t.paywall.benefits.map(text => (
            <View style={styles.benefit} key={text}>
              <View style={[styles.check, { backgroundColor: c.primary }]}>
                <Feather name="check" size={13} color={c.primaryForeground} />
              </View>
              <Text style={[typography.body, { color: c.accent }]}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Plan Card */}
        <Pressable style={[styles.plan, { borderColor: c.primary, backgroundColor: c.card }]} onPress={() => go(true)}>
          <View>
            <Text style={[styles.badgeText, { color: c.primary }]}>{t.paywall.bestValue}</Text>
            <Text style={[typography.h4, { color: c.foreground, marginTop: 5 }]}>{t.paywall.yearlyName}</Text>
            <Text style={[typography.bodySmall, { color: c.mutedForeground, marginTop: 3 }]}>{t.paywall.yearlySub}</Text>
          </View>
          <View>
            <Text style={[typography.h2, { color: c.foreground, textAlign: 'right' }]}>
              {t.paywall.yearlyPrice}
            </Text>
            <Text style={[typography.captionSmall, { color: c.mutedForeground, textAlign: 'right' }]}>
              {t.paywall.perYear}
            </Text>
          </View>
        </Pressable>

        <Button title={t.paywall.continuePremium} onPress={() => go(true)} icon="star" />
        <View style={{ height: spacing.sm }} />
        <Button title={t.paywall.continueFree} onPress={() => go(false)} secondary />

        <Text style={[styles.legal, { color: c.mutedForeground }]}>{t.paywall.legal}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 26, paddingTop: 58, paddingBottom: 32, flexGrow: 1 },
  close: { alignSelf: 'flex-end', padding: 5 },
  badge: {
    alignSelf: 'flex-start', marginTop: 27,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10,
    flexDirection: 'row', gap: 6, alignItems: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  benefits: { gap: 16, marginVertical: 27 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  plan: {
    borderWidth: 1.5, borderRadius: radii.xl, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14,
  },
  legal: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 16 },
});
