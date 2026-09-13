/**
 * Territory Zone Discovery & Inspection Modal
 * Shows territory name, type, exploration percentage and progress breakdown.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { ProgressBar } from '@/components/ui/SharedComponents';
import type { TerritoryZone } from '@/models/types';

interface TerritoryModalProps {
  visible: boolean;
  territory: TerritoryZone | null;
  onClose: () => void;
}

export function TerritoryModal({ visible, territory, onClose }: TerritoryModalProps) {
  const c = useColors();
  const { locale } = useTranslation();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!territory) return null;

  const name = locale === 'vi' ? territory.nameVi : territory.name;

  const getTypeIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case 'waterfront': return 'anchor';
      case 'heritage': return 'shield';
      case 'park': return 'sun';
      default: return 'map-pin';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: c.card, borderColor: territory.color }]}
          onPress={e => e.stopPropagation()}
        >
          {/* Close button */}
          <Pressable style={[styles.closeBtn, { backgroundColor: c.secondary }]} onPress={onClose}>
            <Feather name="x" size={15} color={c.foreground} />
          </Pressable>

          {/* Icon Box */}
          <View style={[styles.iconBox, { backgroundColor: territory.color + '18', borderColor: territory.color + '40' }]}>
            <Feather name={getTypeIcon(territory.type)} size={30} color={territory.color} />
          </View>

          {/* Sector Pill */}
          <View style={[styles.typePill, { backgroundColor: territory.color + '18' }]}>
            <Text style={[styles.typePillText, { color: territory.color }]}>
              VÙNG LÃNH THỔ · {territory.type.toUpperCase()}
            </Text>
          </View>

          <Text style={[typography.h3, { color: c.foreground, textAlign: 'center', marginTop: 8 }]}>
            {name}
          </Text>

          {/* Progress Card */}
          <View style={[styles.progressBox, { backgroundColor: c.secondary, borderColor: c.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: c.mutedForeground }]}>MỨC ĐỘ GIẢI TỎA SƯƠNG MÙ</Text>
              <Text style={[typography.statSmall, { color: territory.color }]}>
                {territory.explorationPercent}%
              </Text>
            </View>

            <View style={{ marginTop: 8 }}>
              <ProgressBar progress={territory.explorationPercent / 100} color={territory.color} height={6} />
            </View>

            <View style={styles.cellRow}>
              <Text style={[styles.cellText, { color: c.mutedForeground }]}>
                Đã khám phá {territory.revealedCells} / {territory.totalCells} ô địa hình
              </Text>
              {territory.isUnlocked && (
                <View style={[styles.badgeUnlocked, { backgroundColor: c.accent + '20' }]}>
                  <Feather name="check" size={11} color={c.accent} />
                  <Text style={[styles.badgeUnlockedText, { color: c.accent }]}>LÀM CHỦ VÙNG</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action button */}
          <Pressable
            style={[styles.actionBtn, { backgroundColor: territory.color }]}
            onPress={onClose}
          >
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
              TIẾP TỤC KHÁM PHÁ
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginTop: 8,
  },
  typePillText: {
    fontSize: 9.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  progressBox: {
    width: '100%',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 9.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cellRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cellText: {
    fontSize: 10.5,
    fontFamily: typography.caption.fontFamily,
  },
  badgeUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  badgeUnlockedText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionBtn: {
    width: '100%',
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
