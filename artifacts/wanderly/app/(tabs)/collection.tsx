import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTranslation, interpolate } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Card, ProgressBar, SegmentControl } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { BADGE_DEFINITIONS, initializeBadges, checkBadgeUnlocks, getBadgeProgress } from '@/services/BadgeService';
import type { Badge, BadgeCategory } from '@/models/types';

const CATEGORIES: { key: BadgeCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'explorer', label: 'explorer' },
  { key: 'consistency', label: 'consistency' },
  { key: 'discovery', label: 'discovery' },
  { key: 'special', label: 'special' },
];

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t, locale } = useTranslation();
  const { state, dispatch, profile } = useApp();
  const [activeCategory, setActiveCategory] = useState(0);

  // Initialize badges if needed
  useEffect(() => {
    if (state.badges.length === 0) {
      const badges = initializeBadges();
      dispatch({ type: 'SET_BADGES', badges });
    }
  }, []);

  // Check for new unlocks
  useEffect(() => {
    if (state.badges.length === 0) return;
    const { updatedBadges, newlyUnlocked } = checkBadgeUnlocks(state.badges, profile);
    if (newlyUnlocked.length > 0) {
      dispatch({ type: 'SET_BADGES', badges: updatedBadges });
    }
  }, [profile.totalSessions, profile.totalDistance, profile.streak, profile.level]);

  const selectedCategory = CATEGORIES[activeCategory].key;
  const filteredBadges = state.badges.filter(
    badge => selectedCategory === 'all' || badge.category === selectedCategory,
  );

  const unlockedCount = state.badges.filter(b => b.unlocked).length;
  const totalCount = state.badges.length;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return c.rarityCommon;
      case 'rare': return c.rarityRare;
      case 'epic': return c.rarityEpic;
      case 'legendary': return c.rarityLegendary;
      default: return c.mutedForeground;
    }
  };

  const getRarityLabel = (rarity: string) => {
    return (t.collection as any)[rarity] || rarity.toUpperCase();
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.label, { color: c.primary }]}>{t.collection.eyebrow}</Text>
        <Text style={[typography.displaySmall, { color: c.foreground, marginTop: 6 }]}>
          {t.collection.title}
        </Text>
        <Text style={[typography.body, { color: c.mutedForeground, marginTop: spacing.md }]}>
          {t.collection.body}
        </Text>

        {/* Progress */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          <View style={styles.progressHeader}>
            <Text style={[typography.labelMedium, { color: c.foreground }]}>
              {interpolate(t.collection.progress, { current: unlockedCount, total: totalCount })}
            </Text>
          </View>
          <ProgressBar progress={totalCount > 0 ? unlockedCount / totalCount : 0} gradient />
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat, i) => (
            <Pressable
              key={cat.key}
              style={[
                styles.categoryChip,
                { backgroundColor: i === activeCategory ? c.primary : c.secondary, borderColor: c.border },
              ]}
              onPress={() => setActiveCategory(i)}
            >
              <Text style={[
                typography.buttonSmall,
                { color: i === activeCategory ? c.primaryForeground : c.mutedForeground },
              ]}>
                {(t.collection as any)[cat.label] || cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Badge Grid */}
        <View style={styles.grid}>
          {filteredBadges.map(badge => {
            const progress = getBadgeProgress(badge, profile);
            const badgeName = locale === 'vi' ? badge.nameVi : badge.name;

            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  { backgroundColor: c.card, borderColor: badge.unlocked ? getRarityColor(badge.rarity) + '40' : c.border },
                  !badge.unlocked && styles.locked,
                ]}
              >
                <View style={[
                  styles.badgeIcon,
                  { backgroundColor: badge.unlocked ? c.primary + '15' : c.secondary },
                ]}>
                  <Feather
                    name={badge.unlocked ? (badge.icon as keyof typeof Feather.glyphMap) : 'lock'}
                    size={24}
                    color={badge.unlocked ? c.primary : c.mutedForeground}
                  />
                </View>
                <Text style={[typography.h4, { color: c.foreground, marginTop: spacing.sm }]} numberOfLines={1}>
                  {badgeName}
                </Text>
                <Text style={[
                  typography.captionSmall,
                  { color: getRarityColor(badge.rarity), fontWeight: '700', marginTop: 4, letterSpacing: 1 },
                ]}>
                  {badge.unlocked ? getRarityLabel(badge.rarity) : t.collection.locked}
                </Text>
                {!badge.unlocked && (
                  <View style={{ marginTop: spacing.sm }}>
                    <ProgressBar progress={progress} height={3} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 26, paddingBottom: 120 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  categoryScroll: { marginTop: spacing.xl, marginBottom: spacing.xl },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    marginRight: 8, borderWidth: 1,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: {
    width: '47.5%' as any, borderRadius: radii.xl, padding: spacing.lg,
    borderWidth: 1,
  },
  locked: { opacity: 0.6 },
  badgeIcon: {
    height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});
