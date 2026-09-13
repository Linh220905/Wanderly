import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { Button, Card, Logo } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <LinearGradient colors={[c.gradientStart, c.gradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Logo />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.orb, { borderColor: c.border, backgroundColor: c.secondary }]}>
            <View style={[styles.orbCore, { borderColor: c.primary, backgroundColor: c.card }]}>
              <Feather name="navigation" size={40} color={c.primary} />
            </View>
            <View style={[styles.fog, { top: 32, left: 10, backgroundColor: c.primary + '15' }]} />
            <View style={[styles.fog, { top: 82, left: 40, width: 110, backgroundColor: c.primary + '20' }]} />
            <View style={[styles.fog, { top: 130, left: 20, width: 130, backgroundColor: c.primary + '15' }]} />
            <View style={[styles.dot, { backgroundColor: c.primary }]} />
          </View>

          <View style={[styles.heroBadge, { backgroundColor: c.primary + '18' }]}>
            <Feather name="map" size={12} color={c.primary} />
            <Text style={[styles.heroBadgeText, { color: c.primary }]}>FOG OF WAR EXPLORATION</Text>
          </View>

          <Text style={[typography.displaySmall, { color: c.foreground, textAlign: 'center', marginTop: 10 }]}>
            {t.welcome.title}
          </Text>
          <Text style={[typography.body, { color: c.mutedForeground, textAlign: 'center', marginTop: 6 }]}>
            {t.welcome.subtitle}
          </Text>
        </View>

        {/* Feature Highlights Grid */}
        <View style={styles.featureGrid}>
          <Card style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: c.primary + '18' }]}>
              <Feather name="gift" size={18} color={c.primary} />
            </View>
            <Text style={[typography.h4, { color: c.foreground, marginTop: 8 }]}>Rương bí ẩn</Text>
            <Text style={[typography.caption, { color: c.mutedForeground, marginTop: 2 }]}>
              Khám phá kho báu rải rác mỗi ngày
            </Text>
          </Card>

          <Card style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: c.accent + '18' }]}>
              <Feather name="zap" size={18} color={c.accent} />
            </View>
            <Text style={[typography.h4, { color: c.foreground, marginTop: 8 }]}>Combo Pace</Text>
            <Text style={[typography.caption, { color: c.mutedForeground, marginTop: 2 }]}>
              Nhân x2.0 XP khi chạy đều chân
            </Text>
          </Card>
        </View>

        {/* Privacy Highlight */}
        <View style={[styles.privacyBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="shield" size={16} color={c.accent} />
          <Text style={[typography.caption, { color: c.mutedForeground, flex: 1 }]}>
            {t.welcome.privacy}
          </Text>
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Button
            title={t.welcome.start}
            onPress={() => router.push('/(onboarding)/questions' as any)}
            icon="arrow-right"
          />
        </View>

        <Text style={[styles.note, { color: c.mutedForeground }]}>
          {t.welcome.note}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16 },
  heroSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  orb: {
    height: 180,
    width: 180,
    borderRadius: 90,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  orbCore: {
    height: 84,
    width: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  fog: { height: 16, width: 120, borderRadius: 8, position: 'absolute' },
  dot: { height: 8, width: 8, borderRadius: 4, position: 'absolute', bottom: 28, right: 38 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  heroBadgeText: {
    fontSize: 9.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.lg,
  },
  featureItem: {
    flex: 1,
    padding: spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  note: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 12,
    fontFamily: typography.caption.fontFamily,
  },
});
