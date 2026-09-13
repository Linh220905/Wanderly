/**
 * Checkpoint Discovery Modal
 * Popup when approaching/discovering or inspecting a POI on the map.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import type { Checkpoint } from '@/models/types';

interface CheckpointDiscoveryModalProps {
  visible: boolean;
  checkpoint: Checkpoint | null;
  mode?: 'discovered' | 'inspect';
  distanceMeters?: number;
  onClose: () => void;
}

const TYPE_EXPLANATIONS: Record<string, { desc: string; hint: string }> = {
  cache: {
    desc: 'Hòm tiếp tế lữ khách bị phong tỏa bởi sương mù. Chứa tiền xu để mua giao diện sương mù và vật phẩm nâng cấp.',
    hint: 'Chạy đến gần trong bán kính 25m để tự động mở khóa và thu thập xu.',
  },
  landmark: {
    desc: 'Di tích và địa danh lịch sử trên thành phố. Khám phá địa điểm giúp mở rộng hiểu biết và cộng điểm XP kinh nghiệm lớn.',
    hint: 'Chạy qua vị trí này để ghi danh địa danh vào sổ tay hành trình.',
  },
  fragment: {
    desc: 'Mảnh tinh thể năng lượng quý hiếm. Dùng để ghép các huy hiệu thành tựu và gia tăng cấp bậc nhà thám hiểm.',
    hint: 'Mỗi khu vực chỉ xuất hiện một vài mảnh tinh thể mỗi ngày.',
  },
  mystery: {
    desc: 'Rương kho báu huyền bí có giá trị cao nhất. Chứa số lượng xu và XP thưởng gấp 3 lần bình thường.',
    hint: 'Hãy chạy đến vị trí trước khi ngày mới bắt đầu để nhận phần thưởng tối đa.',
  },
};

export function CheckpointDiscoveryModal({
  visible,
  checkpoint,
  mode = 'discovered',
  distanceMeters,
  onClose,
}: CheckpointDiscoveryModalProps) {
  const c = useColors();
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 50 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!checkpoint) return null;

  const getTypeIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case 'landmark': return 'map-pin';
      case 'cache': return 'gift';
      case 'fragment': return 'grid';
      case 'mystery': return 'help-circle';
      default: return 'compass';
    }
  };

  const getTypeName = (type: string) => {
    return (t.checkpoint as any)[type] || type.toUpperCase();
  };

  const info = TYPE_EXPLANATIONS[checkpoint.type] || TYPE_EXPLANATIONS.cache;
  const isDiscoveredMode = mode === 'discovered';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            {
              backgroundColor: c.card,
              borderColor: isDiscoveredMode ? c.primary : c.border,
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          {/* Close button top right */}
          <Pressable style={[styles.closeBtn, { backgroundColor: c.secondary }]} onPress={onClose}>
            <Feather name="x" size={16} color={c.foreground} />
          </Pressable>

          {/* Mystery Chest Icon Box */}
          <View style={[styles.iconWrapper, { backgroundColor: c.primary + '18', borderColor: c.primary + '40' }]}>
            <Feather name={getTypeIcon(checkpoint.type)} size={32} color={c.primary} />
          </View>

          <View style={[styles.typePill, { backgroundColor: c.primary + '18' }]}>
            <Text style={[styles.typePillText, { color: c.primary }]}>
              {getTypeName(checkpoint.type)}
            </Text>
          </View>

          <Text style={[typography.h3, { color: c.foreground, textAlign: 'center', marginTop: 8 }]}>
            {checkpoint.title}
          </Text>

          {/* Distance Indicator if inspecting */}
          {distanceMeters !== undefined && (
            <View style={[styles.distanceBadge, { backgroundColor: c.secondary }]}>
              <Feather name="navigation" size={12} color={c.primary} />
              <Text style={[styles.distanceText, { color: c.foreground }]}>
                Cách bạn {Math.round(distanceMeters)}m
              </Text>
            </View>
          )}

          {/* Description & How it works */}
          <View style={[styles.descContainer, { backgroundColor: c.secondary + '80', borderColor: c.border }]}>
            <Text style={[styles.descText, { color: c.foreground }]}>
              {info.desc}
            </Text>
            <View style={styles.hintRow}>
              <Feather name="info" size={13} color={c.primary} />
              <Text style={[styles.hintText, { color: c.mutedForeground }]}>
                {info.hint}
              </Text>
            </View>
          </View>

          {/* Reward Preview Box */}
          <View style={[styles.rewardBox, { backgroundColor: c.primary + '10', borderColor: c.primary + '30' }]}>
            <Text style={[styles.rewardLabel, { color: c.mutedForeground }]}>PHẦN THƯỞNG NHẬN ĐƯỢC</Text>
            <View style={styles.rewardValueRow}>
              <Feather name={checkpoint.reward.type === 'xp' ? 'zap' : 'award'} size={18} color={c.primary} />
              <Text style={[styles.rewardAmount, { color: c.primary }]}>
                +{checkpoint.reward.amount} {checkpoint.reward.type === 'xp' ? 'XP KINH NGHIỆM' : 'XU WANDERLY'}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <Pressable
            style={[styles.actionBtn, { backgroundColor: c.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.actionBtnText, { color: c.primaryForeground }]}>
              {isDiscoveredMode ? 'THU THẬP NGAY' : 'ĐÃ HIỂU'}
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
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii['2xl'],
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginTop: 10,
  },
  typePillText: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginTop: 6,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  descContainer: {
    width: '100%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  descText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  rewardBox: {
    width: '100%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rewardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  rewardAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtn: {
    width: '100%',
    height: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
