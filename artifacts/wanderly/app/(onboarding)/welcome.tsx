import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { Button, Logo } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing } from '@/constants/spacing';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <LinearGradient colors={[c.gradientStart, c.gradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 35, paddingBottom: insets.bottom + 20 }]}>
        <Logo />

        {/* Hero Orb */}
        <View style={[styles.orb, { borderColor: c.border, backgroundColor: c.secondary }]}>
          <View style={[styles.orbCore, { borderColor: c.primary, backgroundColor: c.secondary }]}>
            <Feather name="navigation" size={45} color={c.primary} />
          </View>
          <View style={[styles.fog, { top: 40, left: 12, backgroundColor: c.shimmer }]} />
          <View style={[styles.fog, { top: 95, left: 52, width: 130, backgroundColor: c.shimmer }]} />
          <View style={[styles.fog, { top: 150, left: 25, width: 160, backgroundColor: c.shimmer }]} />
          <View style={[styles.dot, { backgroundColor: c.primary }]} />
        </View>

        {/* Content */}
        <Text style={[typography.label, { color: c.primary, marginBottom: spacing.md }]}>
          {t.welcome.eyebrow}
        </Text>
        <Text style={[typography.displayMedium, { color: c.foreground }]}>
          {t.welcome.title}
        </Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          {t.welcome.subtitle}
        </Text>

        <View style={styles.privacy}>
          <Feather name="shield" size={16} color={c.accent} />
          <Text style={[typography.bodySmall, { color: c.accent }]}>{t.welcome.privacy}</Text>
        </View>

        <Button
          title={t.welcome.start}
          onPress={() => router.push('/(onboarding)/questions' as any)}
          icon="arrow-right"
        />

        <Text style={[styles.note, { color: c.mutedForeground }]}>
          {t.welcome.note}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 28 },
  orb: {
    height: 250, width: 250, borderRadius: 125, borderWidth: 1,
    alignSelf: 'center', marginTop: 58, marginBottom: 42,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  orbCore: {
    height: 112, width: 112, borderRadius: 56,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  fog: { height: 22, width: 180, borderRadius: 11, position: 'absolute' },
  dot: { height: 10, width: 10, borderRadius: 5, position: 'absolute', bottom: 36, right: 52 },
  subtitle: { fontSize: 18, marginTop: 15, marginBottom: 25 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  note: { textAlign: 'center', fontSize: 11, marginTop: 15 },
});
