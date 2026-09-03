import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTranslation, interpolate } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Card, ProgressBar } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii, shadows } from '@/constants/spacing';
import { getLevelProgress, getLevelTitle } from '@/services/GamificationService';
import type { SupportedLocale } from '@/i18n';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t, locale, setLocale } = useTranslation();
  const { profile, resetApp } = useApp();

  const levelProgress = getLevelProgress(profile.xp);
  const levelTitle = getLevelTitle(profile.level, locale as 'en' | 'vi');

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1) + ' km';
  };

  const handleSignOut = () => {
    Alert.alert(
      t.profile.signOutConfirmTitle,
      t.profile.signOutConfirmBody,
      [
        { text: t.common.cancel },
        { text: t.common.reset, style: 'destructive', onPress: resetApp },
      ],
    );
  };

  const handleLanguageSwitch = () => {
    const newLocale: SupportedLocale = locale === 'en' ? 'vi' : 'en';
    setLocale(newLocale);
  };

  const settings = [
    { label: t.profile.unitPreferences, icon: 'sliders' as const },
    { label: t.profile.trackingPrivacy, icon: 'shield' as const },
    { label: t.profile.fogAppearance, icon: 'eye' as const },
    { label: t.profile.hapticsReminders, icon: 'bell' as const },
    { label: t.profile.language, icon: 'globe' as const, value: locale.toUpperCase(), onPress: handleLanguageSwitch },
    { label: t.profile.restorePurchases, icon: 'refresh-cw' as const },
    { label: t.profile.about, icon: 'info' as const },
  ];

  const stats = [
    { label: t.profile.distance, value: formatDistance(profile.totalDistance), icon: 'navigation' as const },
    { label: t.profile.sessions, value: String(profile.totalSessions), icon: 'activity' as const },
    { label: t.profile.revealed, value: `${profile.totalExplored} cells`, icon: 'grid' as const },
    { label: t.profile.checkpoints, value: String(profile.totalCheckpoints), icon: 'map-pin' as const },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Text style={[typography.h1, { color: c.primaryForeground }]}>
              {profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h2, { color: c.foreground }]}>{profile.name}</Text>
            <Text style={[typography.bodySmall, { color: c.primary, marginTop: 4 }]}>
              {profile.premium ? t.profile.premiumPathfinder : t.profile.freeExplorer}
            </Text>
          </View>
          <Feather name="settings" size={20} color={c.mutedForeground} />
        </View>

        {/* Level Card */}
        <Card style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Text style={[typography.label, { color: c.primary }]}>
                {interpolate(t.profile.explorerLevel, { level: profile.level })}
              </Text>
              <Text style={[typography.bodySmall, { color: c.foreground, marginTop: 4 }]}>
                {levelTitle}
              </Text>
            </View>
            <Text style={[typography.bodySmall, { color: c.mutedForeground }]}>
              {interpolate(t.profile.xpProgress, {
                current: levelProgress.current,
                target: levelProgress.target,
              })}
            </Text>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <ProgressBar progress={levelProgress.progress} gradient />
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Feather name={stat.icon} size={16} color={c.primary} style={{ marginBottom: 6 }} />
              <Text style={[typography.label, { color: c.mutedForeground }]}>{stat.label}</Text>
              <Text style={[typography.statSmall, { color: c.foreground, marginTop: 4 }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Coins */}
        <Card style={styles.coinsCard}>
          <View style={styles.coinsRow}>
            <View style={[styles.coinIcon, { backgroundColor: c.primary + '20' }]}>
              <Feather name="circle" size={18} color={c.primary} />
            </View>
            <View>
              <Text style={[typography.label, { color: c.mutedForeground }]}>COINS</Text>
              <Text style={[typography.stat, { color: c.foreground, marginTop: 2 }]}>{profile.coins}</Text>
            </View>
            <View style={[styles.streakBadge, { backgroundColor: c.secondary }]}>
              <Feather name="zap" size={14} color={c.primary} />
              <Text style={[typography.buttonSmall, { color: c.foreground }]}>
                {profile.streak} {locale === 'vi' ? 'ngày' : 'day'} streak
              </Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Text style={[typography.h3, { color: c.foreground, marginTop: spacing['3xl'], marginBottom: spacing.sm }]}>
          {t.profile.settings}
        </Text>

        {settings.map(setting => (
          <Pressable
            key={setting.label}
            style={[styles.settingRow, { borderBottomColor: c.border }]}
            onPress={setting.onPress}
          >
            <View style={styles.settingLeft}>
              <Feather name={setting.icon} size={18} color={c.mutedForeground} />
              <Text style={[typography.body, { color: c.accent }]}>{setting.label}</Text>
            </View>
            <View style={styles.settingRight}>
              {setting.value && (
                <Text style={[typography.bodySmall, { color: c.primary, marginRight: 8 }]}>
                  {setting.value}
                </Text>
              )}
              <Feather name="chevron-right" size={16} color={c.mutedForeground} />
            </View>
          </Pressable>
        ))}

        {/* Sign Out */}
        <Pressable style={styles.signOut} onPress={handleSignOut}>
          <Text style={[typography.buttonSmall, { color: c.destructive }]}>
            {t.profile.signOut}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 26, paddingBottom: 120 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.xl },
  avatar: {
    width: 58, height: 58, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  levelCard: { marginBottom: spacing.lg },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.lg },
  statCard: {
    width: '47.5%' as any, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1,
  },
  coinsCard: { marginBottom: 0 },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinIcon: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  streakBadge: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  settingRow: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRight: { flexDirection: 'row', alignItems: 'center' },
  signOut: { marginTop: spacing['3xl'], alignItems: 'center', paddingVertical: spacing.md },
});
