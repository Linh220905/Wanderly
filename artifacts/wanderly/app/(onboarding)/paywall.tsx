import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Card } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={[styles.close, { backgroundColor: c.secondary, borderColor: c.border }]}
          onPress={() => go(false)}
          accessibilityLabel="Đóng"
        >
          <Feather name="x" color={c.foreground} size={18} />
        </Pressable>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.badge, { backgroundColor: c.primary }]}>
            <Feather name="star" size={12} color={c.primaryForeground} />
            <Text style={[styles.badgeText, { color: c.primaryForeground }]}>{t.paywall.badge}</Text>
          </View>

          <Text style={[typography.displaySmall, { color: c.foreground, marginTop: 10 }]}>
            {t.paywall.title}
          </Text>
          <Text style={[typography.body, { color: c.mutedForeground, marginTop: 4 }]}>
            {t.paywall.body}
          </Text>
        </View>

        {/* Benefits Card */}
        <Card style={styles.benefitsCard}>
          <Text style={[styles.benefitsLabel, { color: c.primary }]}>QUYỀN LỢI ĐẶC QUYỀN</Text>
          {t.paywall.benefits.map(text => (
            <View style={styles.benefit} key={text}>
              <View style={[styles.check, { backgroundColor: c.primary + '18' }]}>
                <Feather name="check" size={12} color={c.primary} />
              </View>
              <Text style={[typography.caption, { color: c.foreground, flex: 1, fontWeight: '600' }]}>{text}</Text>
            </View>
          ))}
        </Card>

        {/* Plan Select Card */}
        <Card style={styles.planCard} onPress={() => go(true)} accentBorder>
          <View>
            <View style={[styles.bestValuePill, { backgroundColor: c.primary }]}>
              <Text style={[styles.bestValueText, { color: c.primaryForeground }]}>{t.paywall.bestValue}</Text>
            </View>
            <Text style={[typography.h4, { color: c.foreground, marginTop: 6 }]}>{t.paywall.yearlyName}</Text>
            <Text style={[typography.captionSmall, { color: c.mutedForeground, marginTop: 1 }]}>{t.paywall.yearlySub}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[typography.h2, { color: c.primary }]}>{t.paywall.yearlyPrice}</Text>
            <Text style={[typography.captionSmall, { color: c.mutedForeground }]}>{t.paywall.perYear}</Text>
          </View>
        </Card>

        <View style={{ marginTop: spacing.lg, gap: 10 }}>
          <Button title={t.paywall.continuePremium} onPress={() => go(true)} icon="star" />
          <Button title={t.paywall.continueFree} onPress={() => go(false)} secondary />
        </View>

        <Text style={[styles.legal, { color: c.mutedForeground }]}>{t.paywall.legal}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, flexGrow: 1 },
  close: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroSection: {
    marginBottom: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  benefitsCard: {
    padding: spacing.md,
    gap: 10,
    marginBottom: spacing.md,
  },
  benefitsLabel: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  bestValuePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radii.xs,
  },
  bestValueText: {
    fontSize: 8.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  legal: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 14,
    fontFamily: typography.caption.fontFamily,
  },
});
