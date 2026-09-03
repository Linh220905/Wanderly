/**
 * Session Summary Modal
 * Shown when an exploration session finishes.
 * Displays total distance, duration, cells revealed, XP earned, coins earned, and level progress.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { useTranslation, interpolate } from '@/i18n';
import { Button } from '@/components/ui/SharedComponents';
import type { ExplorationSession } from '@/models/types';

interface SessionSummaryModalProps {
  visible: boolean;
  session: ExplorationSession | null;
  didLevelUp?: boolean;
  newLevel?: number;
  onClose: () => void;
}

export function SessionSummaryModal({ visible, session, didLevelUp = false, newLevel, onClose }: SessionSummaryModalProps) {
  const c = useColors();
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.8);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!session) return null;

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        <Animated.View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border, transform: [{ scale }], opacity }]}>
          {/* Header Badge */}
          <View style={[styles.iconWrapper, { backgroundColor: c.primary + '20' }]}>
            <Feather name="flag" size={32} color={c.primary} />
          </View>

          <Text style={[typography.h2, { color: c.foreground, textAlign: 'center', marginTop: spacing.md }]}>
            {t.sessionSummary.title}
          </Text>

          <Text style={[typography.body, { color: c.mutedForeground, textAlign: 'center', marginTop: 4, marginBottom: spacing.xl }]}>
            {t.sessionSummary.greatJob}
          </Text>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: c.secondary }]}>
              <Feather name="navigation" size={18} color={c.primary} />
              <Text style={[typography.statSmall, { color: c.foreground, marginTop: 4 }]}>
                {formatDistance(session.distance)}
              </Text>
              <Text style={[typography.captionSmall, { color: c.mutedForeground }]}>{t.sessionSummary.distance}</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: c.secondary }]}>
              <Feather name="clock" size={18} color={c.accent} />
              <Text style={[typography.statSmall, { color: c.foreground, marginTop: 4 }]}>
                {formatDuration(session.duration)}
              </Text>
              <Text style={[typography.captionSmall, { color: c.mutedForeground }]}>{t.sessionSummary.duration}</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: c.secondary }]}>
              <Feather name="grid" size={18} color={c.warning} />
              <Text style={[typography.statSmall, { color: c.foreground, marginTop: 4 }]}>
                +{session.cellsRevealed}
              </Text>
              <Text style={[typography.captionSmall, { color: c.mutedForeground }]}>{t.sessionSummary.cellsRevealed}</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: c.secondary }]}>
              <Feather name="zap" size={18} color={c.primary} />
              <Text style={[typography.statSmall, { color: c.primary, marginTop: 4 }]}>
                +{session.xpEarned} XP
              </Text>
              <Text style={[typography.captionSmall, { color: c.mutedForeground }]}>{t.sessionSummary.xpEarned}</Text>
            </View>
          </View>

          {didLevelUp && newLevel && (
            <View style={[styles.levelUpBanner, { backgroundColor: c.primary + '25', borderColor: c.primary }]}>
              <Feather name="award" size={20} color={c.primary} />
              <Text style={[typography.buttonSmall, { color: c.primary }]}>
                {t.sessionSummary.newLevel} (Lvl {newLevel})
              </Text>
            </View>
          )}

          <View style={{ marginTop: spacing.xl }}>
            <Button title={t.sessionSummary.saveJourney} onPress={onClose} icon="check" />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', borderRadius: radii['2xl'], borderWidth: 1, padding: spacing.xl,
  },
  iconWrapper: {
    width: 64, height: 64, borderRadius: 22, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  statBox: {
    width: '48.5%' as any, padding: spacing.md, borderRadius: radii.lg, alignItems: 'center',
  },
  levelUpBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: radii.md, padding: 10, marginTop: spacing.md,
  },
});
