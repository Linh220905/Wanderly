import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTranslation, interpolate } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Card, ProgressBar } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { initializeBadges, checkBadgeUnlocks, getBadgeProgress } from '@/services/BadgeService';
import type { BadgeCategory } from '@/models/types';

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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Native Clean App Header */}
        <View style={styles.navHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: c.primary }]}>{t.collection.eyebrow}</Text>
            <Text style={[typography.h1, { color: c.foreground, marginTop: 2 }]}>
              {t.collection.title}
            </Text>
          </View>

          <View style={[styles.progressPill, { backgroundColor: c.card, borderColor: c.border }]}>
            <Feather name="award" size={13} color={c.primary} />
            <Text style={[styles.progressPillText, { color: c.foreground }]}>
              {unlockedCount}/{totalCount}
            </Text>
          </View>
        </View>

        {/* Category Horizontal Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat, i) => {
            const isActive = i === activeCategory;
            return (
              <Pressable
                key={cat.key}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? c.primary : c.card,
                    borderColor: isActive ? c.primary : c.border,
                  },
                ]}
                onPress={() => setActiveCategory(i)}
                accessibilityRole="button"
                accessibilityLabel={(t.collection as any)[cat.label] || cat.label}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: isActive ? c.primaryForeground : c.foreground },
                  ]}
                >
                  {(t.collection as any)[cat.label] || cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Badge Grid 2 Columns */}
        <View style={styles.grid}>
          {filteredBadges.map(badge => {
            const progress = getBadgeProgress(badge, profile);
            const badgeName = locale === 'vi' ? badge.nameVi : badge.name;
            const rarityColor = getRarityColor(badge.rarity);

            return (
              <Card
                key={badge.id}
                style={StyleSheet.flatten([
                  styles.badgeCard,
                  !badge.unlocked && styles.lockedCard,
                ])}
                accentBorder={badge.unlocked}
              >
                {/* Rarity Pill Top */}
                <View style={styles.badgeTopRow}>
                  <View style={[styles.rarityPill, { backgroundColor: rarityColor + '20' }]}>
                    <Text style={[styles.rarityPillText, { color: rarityColor }]}>
                      {badge.unlocked ? getRarityLabel(badge.rarity) : t.collection.locked}
                    </Text>
                  </View>
                </View>

                {/* Badge Icon */}
                <View
                  style={[
                    styles.badgeIconBox,
                    {
                      backgroundColor: badge.unlocked ? c.primary + '18' : c.secondary,
                      borderColor: badge.unlocked ? c.primary + '40' : c.border,
                    },
                  ]}
                >
                  <Feather
                    name={badge.unlocked ? (badge.icon as keyof typeof Feather.glyphMap) : 'lock'}
                    size={26}
                    color={badge.unlocked ? c.primary : c.mutedForeground}
                  />
                </View>

                {/* Title */}
                <Text
                  style={[typography.h4, { color: c.foreground, textAlign: 'center', marginTop: 8 }]}
                  numberOfLines={1}
                >
                  {badgeName}
                </Text>

                {/* Unlock Progress */}
                {!badge.unlocked ? (
                  <View style={{ marginTop: 8, width: '100%' }}>
                    <ProgressBar progress={progress} height={4} color={c.primary} />
                  </View>
                ) : (
                  <View style={styles.unlockedRow}>
                    <Feather name="check" size={11} color={c.accent} />
                    <Text style={[styles.unlockedText, { color: c.accent }]}>ĐÃ MỞ KHÓA</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16 },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  progressPillText: {
    fontSize: 12,
    fontFamily: typography.buttonSmall.fontFamily,
    fontWeight: '800',
  },
  categoryScroll: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 11,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  badgeCard: {
    width: '48.5%',
    padding: spacing.md,
    alignItems: 'center',
  },
  lockedCard: {
    opacity: 0.72,
  },
  badgeTopRow: {
    width: '100%',
    alignItems: 'flex-start',
  },
  rarityPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radii.xs,
  },
  rarityPillText: {
    fontSize: 9,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  badgeIconBox: {
    width: 52,
    height: 52,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  unlockedText: {
    fontSize: 9,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
