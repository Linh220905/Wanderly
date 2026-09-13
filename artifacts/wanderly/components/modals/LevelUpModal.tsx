/**
 * Level Up Modal
 * Celebration popup when the user reaches a new Explorer Level.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { useTranslation, interpolate } from '@/i18n';
import { Button } from '@/components/ui/SharedComponents';
import { getLevelTitle } from '@/services/GamificationService';

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ visible, level, onClose }: LevelUpModalProps) {
  const c = useColors();
  const { t, locale } = useTranslation();
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
        Animated.timing(rotate, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.5);
      rotate.setValue(0);
    }
  }, [visible]);

  const levelTitle = getLevelTitle(level, locale as 'en' | 'vi');
  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        <Animated.View
          style={[
            styles.modalCard,
            { backgroundColor: c.card, borderColor: c.primary, transform: [{ scale }, { rotate: spin }] },
          ]}
        >
          {/* Level Crown Icon */}
          <View style={[styles.crownWrapper, { backgroundColor: c.primary }]}>
            <Feather name="award" size={32} color={c.primaryForeground} />
          </View>

          <View style={[styles.badgePill, { backgroundColor: c.primary + '18' }]}>
            <Text style={[styles.badgeText, { color: c.primary }]}>
              ★ LEVEL UPGRADE ★
            </Text>
          </View>

          <Text style={[typography.displayMedium, { color: c.foreground, textAlign: 'center', marginTop: 6 }]}>
            Level {level}
          </Text>

          <Text style={[typography.h3, { color: c.primary, textAlign: 'center', marginTop: 2 }]}>
            {levelTitle}
          </Text>

          <Text style={[typography.caption, { color: c.mutedForeground, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg }]}>
            {interpolate(t.levelUp.body, { level })}
          </Text>

          <Button title={t.levelUp.celebrate} onPress={onClose} icon="award" />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: radii.xl,
    borderWidth: 1.5,
    padding: spacing.lg,
    alignItems: 'stretch',
  },
  crownWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: 9.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
