import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { Button, Card } from '@/components/ui/SharedComponents';
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
  const [showCard, setShowCard] = useState(false);

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
      setShowCard(false);
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

  const handleShare = async () => {
    try {
      const dist = formatDistance(session.distance);
      const dur = formatDuration(session.duration);
      const chests = session.checkpointsDiscovered?.length || 0;
      const message = `🗺️ WANDERLY EXPLORATION CARD 🏆\n\n🏃‍♂️ Quãng đường: ${dist}\n⏱️ Thời gian: ${dur}\n✨ Sương mù đã mở: ${session.cellsRevealed} ô\n🎁 Rương bí ẩn: ${chests}\n⚡ Phần thưởng: +${session.xpEarned} XP & +${session.coinsEarned} Coins!\n\nTham gia khám phá bản đồ thế giới cùng Wanderly! #Wanderly #RunningGame`;
      await Share.share({ message });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        <Animated.View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border, transform: [{ scale }], opacity }]}>
          {/* Victory Card Mode */}
          {showCard ? (
            <View style={styles.victoryCardContainer}>
              <View style={[styles.victoryCard, { backgroundColor: c.background, borderColor: c.primary }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.victoryPill, { backgroundColor: c.primary + '20' }]}>
                    <Text style={[styles.cardBrand, { color: c.primary }]}>WANDERLY EXPLORER</Text>
                  </View>
                  <View style={[styles.victoryPill, { backgroundColor: c.warning + '20' }]}>
                    <Text style={[styles.cardBadge, { color: c.warning }]}>🏆 VICTORY CARD</Text>
                  </View>
                </View>

                <View style={styles.cardCenter}>
                  <Text style={[styles.cardDistVal, { color: c.foreground }]}>{formatDistance(session.distance)}</Text>
                  <Text style={[styles.cardDistLabel, { color: c.mutedForeground }]}>TỔNG QUÃNG ĐƯỜNG KHÁM PHÁ</Text>
                </View>

                <View style={[styles.cardGrid, { backgroundColor: c.secondary, borderColor: c.border }]}>
                  <View style={styles.cardGridItem}>
                    <Text style={[styles.cardGridVal, { color: c.foreground }]}>{formatDuration(session.duration)}</Text>
                    <Text style={[styles.cardGridLabel, { color: c.mutedForeground }]}>THỜI GIAN</Text>
                  </View>
                  <View style={[styles.cardGridDivider, { backgroundColor: c.border }]} />
                  <View style={styles.cardGridItem}>
                    <Text style={[styles.cardGridVal, { color: c.foreground }]}>+{session.cellsRevealed}</Text>
                    <Text style={[styles.cardGridLabel, { color: c.mutedForeground }]}>Ô SƯƠNG MÙ</Text>
                  </View>
                  <View style={[styles.cardGridDivider, { backgroundColor: c.border }]} />
                  <View style={styles.cardGridItem}>
                    <Text style={[styles.cardGridVal, { color: c.warning }]}>{session.checkpointsDiscovered?.length || 0}</Text>
                    <Text style={[styles.cardGridLabel, { color: c.mutedForeground }]}>RƯƠNG NHẬN</Text>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: c.border }]}>
                  <View style={[styles.rewardPill, { backgroundColor: c.primary + '20' }]}>
                    <Feather name="zap" size={13} color={c.primary} />
                    <Text style={[styles.cardReward, { color: c.primary }]}>+{session.xpEarned} XP</Text>
                  </View>
                  <View style={[styles.rewardPill, { backgroundColor: c.accent + '20' }]}>
                    <Feather name="award" size={13} color={c.accent} />
                    <Text style={[styles.cardReward, { color: c.accent }]}>+{session.coinsEarned} Coins</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Button title="Chia sẻ lên Mạng Xã Hội" onPress={handleShare} icon="share-2" />
                <Pressable style={styles.backBtn} onPress={() => setShowCard(false)}>
                  <Text style={[typography.buttonSmall, { color: c.mutedForeground }]}>Quay lại chi tiết</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {/* Header Badge */}
              <View style={[styles.iconWrapper, { backgroundColor: c.primary + '20' }]}>
                <Feather name="flag" size={32} color={c.primary} />
              </View>

              <Text style={[typography.h2, { color: c.foreground, textAlign: 'center', marginTop: spacing.md }]}>
                {t.sessionSummary.title}
              </Text>

              <Text style={[typography.body, { color: c.mutedForeground, textAlign: 'center', marginTop: 4, marginBottom: spacing.lg }]}>
                {t.sessionSummary.greatJob}
              </Text>

              {/* Stats Grid 3x2 */}
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: c.secondary, borderColor: c.border }]}>
                  <Feather name="navigation" size={16} color={c.primary} />
                  <Text style={[typography.statSmall, { color: c.foreground, marginTop: 2 }]}>
                    {formatDistance(session.distance)}
                  </Text>
                  <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{t.sessionSummary.distance}</Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: c.secondary, borderColor: c.border }]}>
                  <Feather name="clock" size={16} color={c.accent} />
                  <Text style={[typography.statSmall, { color: c.foreground, marginTop: 2 }]}>
                    {formatDuration(session.duration)}
                  </Text>
                  <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{t.sessionSummary.duration}</Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: c.secondary, borderColor: c.border }]}>
                  <Feather name="grid" size={16} color={c.info} />
                  <Text style={[typography.statSmall, { color: c.foreground, marginTop: 2 }]}>
                    +{session.cellsRevealed}
                  </Text>
                  <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{t.sessionSummary.cellsRevealed}</Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: c.secondary, borderColor: c.border }]}>
                  <Feather name="gift" size={16} color={c.warning} />
                  <Text style={[typography.statSmall, { color: c.warning, marginTop: 2 }]}>
                    {session.checkpointsDiscovered?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Rương</Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: c.secondary, borderColor: c.border }]}>
                  <Feather name="zap" size={16} color={c.primary} />
                  <Text style={[typography.statSmall, { color: c.primary, marginTop: 2 }]}>
                    +{session.xpEarned}
                  </Text>
                  <Text style={[styles.statLabel, { color: c.mutedForeground }]}>XP Nhận</Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: c.secondary, borderColor: c.border }]}>
                  <Feather name="award" size={16} color={c.accent} />
                  <Text style={[typography.statSmall, { color: c.accent, marginTop: 2 }]}>
                    +{session.coinsEarned}
                  </Text>
                  <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Xu Nhận</Text>
                </View>
              </View>

              {didLevelUp && newLevel && (
                <View style={[styles.levelUpBanner, { backgroundColor: c.primary + '18', borderColor: c.primary }]}>
                  <Feather name="award" size={18} color={c.primary} />
                  <Text style={[typography.buttonSmall, { color: c.primary }]}>
                    {t.sessionSummary.newLevel} (Lvl {newLevel})
                  </Text>
                </View>
              )}

              <View style={{ marginTop: spacing.lg, gap: 10 }}>
                <Button title="📸 Thẻ Khoe Thành Tích" onPress={() => setShowCard(true)} secondary icon="award" />
                <Button title={t.sessionSummary.saveJourney} onPress={onClose} icon="check" />
              </View>
            </>
          )}
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
    padding: 16,
  },
  modalCard: {
    width: '100%',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  statBox: {
    width: '31.5%',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '700',
    marginTop: 1,
  },
  levelUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 8,
    marginTop: spacing.md,
  },
  victoryCardContainer: {
    width: '100%',
  },
  victoryCard: {
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  victoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  cardBrand: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: typography.label.fontFamily,
  },
  cardBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: typography.label.fontFamily,
  },
  cardCenter: {
    alignItems: 'center',
    marginVertical: 10,
  },
  cardDistVal: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: typography.displayLarge.fontFamily,
  },
  cardDistLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
    fontFamily: typography.label.fontFamily,
  },
  cardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 10,
    marginVertical: 12,
  },
  cardGridItem: {
    alignItems: 'center',
    flex: 1,
  },
  cardGridDivider: {
    width: 1,
    height: 24,
  },
  cardGridVal: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: typography.statSmall.fontFamily,
  },
  cardGridLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    fontFamily: typography.label.fontFamily,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  cardReward: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: typography.label.fontFamily,
  },
  cardActions: {
    marginTop: 14,
    gap: 8,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
});
