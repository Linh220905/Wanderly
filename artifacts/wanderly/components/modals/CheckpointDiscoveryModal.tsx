/**
 * Checkpoint Discovery Modal
 * Popup when approaching/discovering a hidden POI on the map.
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
import type { Checkpoint } from '@/models/types';

interface CheckpointDiscoveryModalProps {
  visible: boolean;
  checkpoint: Checkpoint | null;
  onClose: () => void;
}

export function CheckpointDiscoveryModal({ visible, checkpoint, onClose }: CheckpointDiscoveryModalProps) {
  const c = useColors();
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
    } else {
      scale.setValue(0.7);
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        <Animated.View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border, transform: [{ scale }] }]}>
          <View style={[styles.iconWrapper, { backgroundColor: c.primary + '20' }]}>
            <Feather name={getTypeIcon(checkpoint.type)} size={32} color={c.primary} />
          </View>

          <Text style={[typography.label, { color: c.primary, textAlign: 'center', marginTop: spacing.md }]}>
            {getTypeName(checkpoint.type)}
          </Text>

          <Text style={[typography.h2, { color: c.foreground, textAlign: 'center', marginTop: 4 }]}>
            {checkpoint.title}
          </Text>

          <View style={[styles.rewardBadge, { backgroundColor: c.secondary }]}>
            <Feather name={checkpoint.reward.type === 'xp' ? 'zap' : 'circle'} size={18} color={c.primary} />
            <Text style={[typography.h3, { color: c.primary }]}>
              +{checkpoint.reward.amount} {checkpoint.reward.type.toUpperCase()}
            </Text>
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <Button title={t.checkpoint.collect} onPress={onClose} icon="gift" />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28,
  },
  modalCard: {
    width: '100%', borderRadius: radii['2xl'], borderWidth: 1, padding: spacing.xl,
  },
  iconWrapper: {
    width: 64, height: 64, borderRadius: 22, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
  },
  rewardBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: radii.lg, paddingVertical: 12, paddingHorizontal: 20,
    marginTop: spacing.lg, alignSelf: 'center',
  },
});
