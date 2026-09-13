/**
 * Mystery Hike Quest Modal
 * Cryptic Clue, Proximity Beacon & Claim Victory for daily mystery trails.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import type { MysteryHikeQuest } from '@/models/types';

interface MysteryHikeModalProps {
  visible: boolean;
  quest: MysteryHikeQuest | null;
  distanceMeters?: number;
  isArrived?: boolean;
  onClose: () => void;
  onClaim?: () => void;
}

export function MysteryHikeModal({
  visible,
  quest,
  distanceMeters,
  isArrived = false,
  onClose,
  onClaim,
}: MysteryHikeModalProps) {
  const c = useColors();
  const { locale } = useTranslation();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!quest) return null;

  const title = locale === 'vi' ? quest.titleVi : quest.title;
  const clue = locale === 'vi' ? quest.clueVi : quest.clue;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: c.card, borderColor: isArrived ? c.primary : '#9333EA' },
          ]}
          onPress={e => e.stopPropagation()}
        >
          {/* Close button */}
          <Pressable style={[styles.closeBtn, { backgroundColor: c.secondary }]} onPress={onClose}>
            <Feather name="x" size={15} color={c.foreground} />
          </Pressable>

          {/* Compass Icon */}
          <View style={[styles.beaconIconBox, { backgroundColor: '#9333EA18', borderColor: '#9333EA40' }]}>
            <Feather name="compass" size={32} color="#9333EA" />
          </View>

          {/* Category Pill */}
          <View style={[styles.typePill, { backgroundColor: '#9333EA18' }]}>
            <Feather name="map" size={11} color="#9333EA" />
            <Text style={[styles.typePillText, { color: '#9333EA' }]}>MYSTERY HIKE QUEST</Text>
          </View>

          <Text style={[typography.h3, { color: c.foreground, textAlign: 'center', marginTop: 8 }]}>
            {title}
          </Text>

          {/* Distance Indicator */}
          {distanceMeters !== undefined && (
            <View style={[styles.distancePill, { backgroundColor: c.secondary }]}>
              <Feather name="navigation" size={11} color="#9333EA" />
              <Text style={[styles.distanceText, { color: c.foreground }]}>
                {isArrived ? 'ĐÃ ĐẾN VỊ TRÍ BÍ ẨN!' : `Cách mục tiêu ${Math.round(distanceMeters)}m`}
              </Text>
            </View>
          )}

          {/* Cryptic Clue Card */}
          <View style={[styles.clueCard, { backgroundColor: c.secondary + '80', borderColor: c.border }]}>
            <View style={styles.clueHeaderRow}>
              <Feather name="help-circle" size={13} color="#9333EA" />
              <Text style={[styles.clueHeaderLabel, { color: '#9333EA' }]}>MANH MỐI BÍ MẬT</Text>
            </View>
            <Text style={[styles.clueText, { color: c.foreground }]}>
              "{clue}"
            </Text>
            <Text style={[styles.clueHint, { color: c.mutedForeground }]}>
              Chạy đến gần mục tiêu trong bán kính {quest.targetRadiusMeters}m để mở khóa kho báu.
            </Text>
          </View>

          {/* Rewards Box */}
          <View style={[styles.rewardBox, { backgroundColor: '#9333EA10', borderColor: '#9333EA30' }]}>
            <Text style={[styles.rewardLabel, { color: c.mutedForeground }]}>PHẦN THƯỞNG HOÀN THÀNH</Text>
            <View style={styles.rewardRow}>
              <View style={[styles.rewardBadge, { backgroundColor: '#9333EA20' }]}>
                <Feather name="zap" size={13} color="#9333EA" />
                <Text style={[styles.rewardVal, { color: '#9333EA' }]}>+{quest.reward.xp} XP</Text>
              </View>
              <View style={[styles.rewardBadge, { backgroundColor: c.warning + '20' }]}>
                <Feather name="award" size={13} color={c.warning} />
                <Text style={[styles.rewardVal, { color: c.warning }]}>+{quest.reward.coins} Coins</Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <Pressable
            style={[
              styles.actionBtn,
              { backgroundColor: isArrived ? c.primary : '#9333EA' },
            ]}
            onPress={() => {
              if (isArrived && onClaim) {
                onClaim();
              } else {
                onClose();
              }
            }}
          >
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
              {isArrived ? 'NHẬN KHO BÁU BÍ ẨN' : 'BẮT ĐẦU THEO DẤU'}
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
    maxWidth: 380,
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
  beaconIconBox: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginTop: 6,
  },
  distanceText: {
    fontSize: 10.5,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '700',
  },
  clueCard: {
    width: '100%',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  clueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  clueHeaderLabel: {
    fontSize: 9.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  clueText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  clueHint: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  rewardBox: {
    width: '100%',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: 8,
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 9,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  rewardVal: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: typography.caption.fontFamily,
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
