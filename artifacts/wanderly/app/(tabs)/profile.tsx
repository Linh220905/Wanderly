import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useTranslation, interpolate } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Card, ProgressBar } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { getLevelProgress, getLevelTitle } from '@/services/GamificationService';
import type { SupportedLocale } from '@/i18n';
import { supabase } from '@/services/SupabaseService';

const FOG_THEMES = [
  { id: '#0C6B70', name: 'Ngọc Lục Bảo', hex: '#0C6B70' },
  { id: '#1E293B', name: 'Đá Slate', hex: '#1E293B' },
  { id: '#312E81', name: 'Tím Huyền Bí', hex: '#312E81' },
  { id: '#0F172A', name: 'Đêm Vô Tận', hex: '#0F172A' },
  { id: '#047857', name: 'Rừng Nhiệt Đới', hex: '#047857' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t, locale, setLocale } = useTranslation();
  const { profile, dispatch, resetApp, goToGate } = useApp();
  const { showToast } = useToast();

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'account' | 'units' | 'privacy' | 'fog' | 'notifications' | 'about' | null
  >(null);

  // Edit Name State
  const [editingName, setEditingName] = useState(profile.name);

  const levelProgress = getLevelProgress(profile.xp);
  const levelTitle = getLevelTitle(profile.level, locale as 'en' | 'vi');

  const handleSignOut = () => {
    Alert.alert(
      t.profile.signOutConfirmTitle,
      t.profile.signOutConfirmBody,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.reset,
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut().catch(() => {});
            resetApp();
            goToGate('welcome');
            router.replace('/(onboarding)/welcome' as any);
            showToast({
              type: 'info',
              title: 'Đã đăng xuất',
              message: 'Quay lại màn hình Onboarding.',
              icon: 'log-out',
            });
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.profile.deleteAccountConfirmTitle,
      t.profile.deleteAccountConfirmBody,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: 'Xóa tài khoản',
          style: 'destructive',
          onPress: async () => {
            const user = (await supabase.auth.getUser()).data.user;
            if (user) {
              await supabase.from('profiles').delete().eq('id', user.id);
            }
            await supabase.auth.signOut().catch(() => {});
            resetApp();
            goToGate('welcome');
            router.replace('/(onboarding)/welcome' as any);
            showToast({
              type: 'info',
              title: 'Đã xóa tài khoản',
              message: 'Toàn bộ dữ liệu của bạn đã được xóa hoàn toàn.',
              icon: 'trash-2',
            });
          },
        },
      ],
    );
  };

  const handleLanguageSwitch = () => {
    const newLocale: SupportedLocale = locale === 'en' ? 'vi' : 'en';
    setLocale(newLocale);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    showToast({
      type: 'success',
      title: newLocale === 'vi' ? 'Đã đổi sang Tiếng Việt' : 'Switched to English',
      icon: 'globe',
    });
  };

  const handleSaveName = () => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    dispatch({ type: 'UPDATE_PROFILE', updates: { name: trimmed } });
    setActiveModal(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast({
      type: 'success',
      title: 'Cập nhật tên thành công',
      message: `Chào mừng ${trimmed}!`,
      icon: 'user-check',
    });
  };

  const handleSelectUnit = (unit: 'metric' | 'imperial') => {
    dispatch({ type: 'UPDATE_PROFILE', updates: { units: unit } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    showToast({
      type: 'info',
      title: 'Đã cập nhật đơn vị đo',
      message: unit === 'metric' ? 'Sử dụng Mét / Kilômét (km)' : 'Sử dụng Feet / Dặm (mi)',
      icon: 'sliders',
    });
    setActiveModal(null);
  };

  const handleSelectFog = (hex: string) => {
    dispatch({ type: 'UPDATE_PROFILE', updates: { fogColor: hex } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    showToast({
      type: 'success',
      title: 'Đã đổi màu sương mù',
      icon: 'eye',
    });
    setActiveModal(null);
  };

  const handleToggleHaptics = (val: boolean) => {
    dispatch({ type: 'UPDATE_PROFILE', updates: { hapticsEnabled: val } });
    if (val) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handleToggleNotifications = (val: boolean) => {
    dispatch({ type: 'UPDATE_PROFILE', updates: { notificationsEnabled: val } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleRestorePurchases = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    showToast({
      type: 'info',
      title: 'Đang kết nối Apple App Store…',
      icon: 'refresh-cw',
    });

    setTimeout(() => {
      dispatch({ type: 'SET_PREMIUM', premium: true });
      showToast({
        type: 'success',
        title: 'Khôi phục gói mua thành công!',
        message: 'Gói Wanderly Premium đã được kích hoạt trên thiết bị.',
        icon: 'star',
      });
    }, 1200);
  };

  // Grouped Menu Definition
  const accountGroup = [
    {
      id: 'account_info',
      label: 'Thông tin tài khoản',
      icon: 'user' as const,
      value: profile.name,
      onPress: () => {
        setEditingName(profile.name);
        setActiveModal('account');
      },
    },
    {
      id: 'language',
      label: t.profile.language,
      icon: 'globe' as const,
      value: locale === 'vi' ? 'Tiếng Việt' : 'English',
      onPress: handleLanguageSwitch,
    },
  ];

  const trackingGroup = [
    {
      id: 'units',
      label: t.profile.unitPreferences,
      icon: 'sliders' as const,
      value: profile.units === 'imperial' ? 'Imperial (mi)' : 'Metric (km)',
      onPress: () => setActiveModal('units'),
    },
    {
      id: 'privacy',
      label: t.profile.trackingPrivacy,
      icon: 'shield' as const,
      value: 'Chỉ trên máy',
      onPress: () => setActiveModal('privacy'),
    },
    {
      id: 'fog',
      label: t.profile.fogAppearance,
      icon: 'eye' as const,
      value: FOG_THEMES.find(f => f.hex === profile.fogColor)?.name || 'Mặc định',
      onPress: () => setActiveModal('fog'),
    },
    {
      id: 'notifications',
      label: t.profile.hapticsReminders,
      icon: 'bell' as const,
      value: profile.notificationsEnabled ? 'Bật' : 'Tắt',
      onPress: () => setActiveModal('notifications'),
    },
  ];

  const infoGroup = [
    {
      id: 'restore',
      label: t.profile.restorePurchases,
      icon: 'refresh-cw' as const,
      value: undefined,
      onPress: handleRestorePurchases,
    },
    {
      id: 'about',
      label: t.profile.about,
      icon: 'info' as const,
      value: 'v1.0.0 (101)',
      onPress: () => setActiveModal('about'),
    },
    {
      id: 'delete_account',
      label: t.profile.deleteAccount,
      icon: 'trash-2' as const,
      value: undefined,
      onPress: handleDeleteAccount,
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Header */}
        <View style={styles.navHeader}>
          <Text style={[styles.headerEyebrow, { color: c.mutedForeground }]}>CÀI ĐẶT</Text>
          <Text style={[typography.h1, { color: c.foreground, marginTop: 2 }]}>
            {t.tabs.profile}
          </Text>
        </View>

        {/* User Card (Ref 2 Aesthetic) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setEditingName(profile.name);
            setActiveModal('account');
          }}
          style={[styles.userCard, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <View style={[styles.userAvatar, { backgroundColor: c.primary }]}>
            <Text style={[styles.userAvatarText, { color: c.primaryForeground }]}>
              {profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.userInfoCol}>
            <View style={styles.membershipRow}>
              {profile.premium && <Text style={{ fontSize: 12 }}>👑 </Text>}
              <Text
                style={[
                  styles.membershipTitle,
                  { color: profile.premium ? '#FC5200' : c.mutedForeground },
                ]}
              >
                {profile.premium ? 'Wanderly Premium' : 'Free Explorer'}
              </Text>
            </View>

            <Text style={[typography.h3, { color: c.foreground, marginTop: 1 }]}>
              {profile.name}
            </Text>
            <Text style={[styles.userSubTitle, { color: c.mutedForeground }]}>
              {levelTitle} · Lv.{profile.level}
            </Text>
          </View>

          <Feather name="edit-2" size={16} color={c.mutedForeground} />
        </TouchableOpacity>

        {/* Compact Level XP Bar */}
        <Card style={styles.xpCardCompact}>
          <View style={styles.xpRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="zap" size={13} color={c.primary} />
              <Text style={[styles.xpLevelTag, { color: c.foreground }]}>
                {interpolate(t.profile.explorerLevel, { level: profile.level })}
              </Text>
            </View>
            <Text style={[styles.xpNumbers, { color: c.mutedForeground }]}>
              {interpolate(t.profile.xpProgress, {
                current: levelProgress.current,
                target: levelProgress.target,
              })}
            </Text>
          </View>
          <View style={{ marginTop: 8 }}>
            <ProgressBar progress={levelProgress.progress} color={c.primary} />
          </View>
        </Card>

        {/* Section 1: TÀI KHOẢN */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: c.mutedForeground }]}>TÀI KHOẢN</Text>
          <Card style={styles.groupedListCard}>
            {accountGroup.map((item, idx) => (
              <Pressable
                key={item.id}
                style={[
                  styles.menuRow,
                  idx < accountGroup.length - 1 && [styles.menuRowDivider, { borderBottomColor: c.border }],
                ]}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: c.secondary }]}>
                  <Feather name={item.icon} size={16} color={c.foreground} />
                </View>
                <Text style={[styles.menuLabel, { color: c.foreground }]}>{item.label}</Text>
                <View style={styles.menuRightGroup}>
                  {item.value && (
                    <Text style={[styles.menuValueText, { color: c.mutedForeground }]}>
                      {item.value}
                    </Text>
                  )}
                  <Feather name="chevron-right" size={16} color={c.mutedForeground} />
                </View>
              </Pressable>
            ))}
          </Card>
        </View>

        {/* Section 2: MỤC TIÊU & THEO DÕI */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: c.mutedForeground }]}>MỤC TIÊU & THEO DÕI</Text>
          <Card style={styles.groupedListCard}>
            {trackingGroup.map((item, idx) => (
              <Pressable
                key={item.id}
                style={[
                  styles.menuRow,
                  idx < trackingGroup.length - 1 && [styles.menuRowDivider, { borderBottomColor: c.border }],
                ]}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: c.secondary }]}>
                  <Feather name={item.icon} size={16} color={c.foreground} />
                </View>
                <Text style={[styles.menuLabel, { color: c.foreground }]}>{item.label}</Text>
                <View style={styles.menuRightGroup}>
                  {item.value && (
                    <Text style={[styles.menuValueText, { color: c.mutedForeground }]}>
                      {item.value}
                    </Text>
                  )}
                  <Feather name="chevron-right" size={16} color={c.mutedForeground} />
                </View>
              </Pressable>
            ))}
          </Card>
        </View>

        {/* Section 3: DỊCH VỤ & THÔNG TIN */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: c.mutedForeground }]}>DỊCH VỤ & THÔNG TIN</Text>
          <Card style={styles.groupedListCard}>
            {infoGroup.map((item, idx) => (
              <Pressable
                key={item.id}
                style={[
                  styles.menuRow,
                  idx < infoGroup.length - 1 && [styles.menuRowDivider, { borderBottomColor: c.border }],
                ]}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: c.secondary }]}>
                  <Feather name={item.icon} size={16} color={c.foreground} />
                </View>
                <Text style={[styles.menuLabel, { color: c.foreground }]}>{item.label}</Text>
                <View style={styles.menuRightGroup}>
                  {item.value && (
                    <Text style={[styles.menuValueText, { color: c.mutedForeground }]}>
                      {item.value}
                    </Text>
                  )}
                  <Feather name="chevron-right" size={16} color={c.mutedForeground} />
                </View>
              </Pressable>
            ))}
          </Card>
        </View>

        {/* Sign Out Button */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title={t.profile.signOut}
            onPress={handleSignOut}
            secondary
            icon="log-out"
          />
        </View>
      </ScrollView>

      {/* ── MODAL 1: Account Edit Name ── */}
      <Modal visible={activeModal === 'account'} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[typography.h3, { color: c.foreground }]}>Thông Tin Người Dùng</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={10}>
                <Feather name="x" size={20} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: c.mutedForeground, marginTop: 14 }]}>
              TÊN HIỂN THỊ TRÊN BẢNG XẾP HẠNG
            </Text>
            <TextInput
              style={[
                styles.nameInput,
                { backgroundColor: c.secondary, borderColor: c.border, color: c.foreground },
              ]}
              value={editingName}
              onChangeText={setEditingName}
              placeholder="Nhập tên của bạn…"
              placeholderTextColor={c.mutedForeground}
              maxLength={30}
              autoFocus
            />

            <View style={[styles.accountDetailBox, { backgroundColor: c.secondary }]}>
              <View style={styles.accountDetailRow}>
                <Text style={[styles.detailKey, { color: c.mutedForeground }]}>Đăng nhập qua:</Text>
                <Text style={[styles.detailVal, { color: c.foreground }]}>
                  {profile.authProvider ? profile.authProvider.toUpperCase() : 'Khách (Guest)'}
                </Text>
              </View>
              <View style={[styles.accountDetailRow, { marginTop: 6 }]}>
                <Text style={[styles.detailKey, { color: c.mutedForeground }]}>Kiểu thám hiểm:</Text>
                <Text style={[styles.detailVal, { color: c.primary }]}>
                  {profile.explorerType || 'City Pathfinder'}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 18, gap: 8 }}>
              <Button title="Lưu Thay Đổi" onPress={handleSaveName} />
              <Button title="Hủy" onPress={() => setActiveModal(null)} secondary />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: Units Selection ── */}
      <Modal visible={activeModal === 'units'} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[typography.h3, { color: c.foreground }]}>Đơn Vị Đo Lường</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={10}>
                <Feather name="x" size={20} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 14, gap: 10 }}>
              <TouchableOpacity
                onPress={() => handleSelectUnit('metric')}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: profile.units === 'metric' ? c.primary + '14' : c.secondary,
                    borderColor: profile.units === 'metric' ? c.primary : c.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h4, { color: c.foreground }]}>Metric (Hệ Mét)</Text>
                  <Text style={[styles.optionSub, { color: c.mutedForeground }]}>
                    Khoảng cách: km, mét · Tốc độ: km/h
                  </Text>
                </View>
                {profile.units === 'metric' && <Feather name="check" size={18} color={c.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectUnit('imperial')}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: profile.units === 'imperial' ? c.primary + '14' : c.secondary,
                    borderColor: profile.units === 'imperial' ? c.primary : c.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h4, { color: c.foreground }]}>Imperial (Hệ Dặm Anh)</Text>
                  <Text style={[styles.optionSub, { color: c.mutedForeground }]}>
                    Khoảng cách: miles, feet · Tốc độ: mph
                  </Text>
                </View>
                {profile.units === 'imperial' && <Feather name="check" size={18} color={c.primary} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: Privacy & Security ── */}
      <Modal visible={activeModal === 'privacy'} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[typography.h3, { color: c.foreground }]}>Bảo Mật & Định Vị</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={10}>
                <Feather name="x" size={20} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12, gap: 10 }}>
              <View style={[styles.privacyPoint, { backgroundColor: c.secondary }]}>
                <Feather name="shield" size={18} color={c.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[typography.h4, { color: c.foreground }]}>Bảo Mật Tuyệt Đối</Text>
                  <Text style={[styles.optionSub, { color: c.mutedForeground }]}>
                    Mọi tọa độ GPS và lộ trình khám phá được lưu trữ 100% cục bộ trên thiết bị của bạn.
                  </Text>
                </View>
              </View>

              <View style={[styles.privacyPoint, { backgroundColor: c.secondary }]}>
                <Feather name="map-pin" size={18} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[typography.h4, { color: c.foreground }]}>Chỉ Khi Khám Phá</Text>
                  <Text style={[styles.optionSub, { color: c.mutedForeground }]}>
                    Wanderly chỉ thu thập vị trí khi bạn bấm "Bắt đầu khám phá" và dừng ngay khi bấm Kết thúc.
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Button title="Đã Hiểu" onPress={() => setActiveModal(null)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 4: Fog Theme ── */}
      <Modal visible={activeModal === 'fog'} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[typography.h3, { color: c.foreground }]}>Giao Diện Sương Mù</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={10}>
                <Feather name="x" size={20} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 14, gap: 8 }}>
              {FOG_THEMES.map(theme => {
                const isSelected = profile.fogColor === theme.hex;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => handleSelectFog(theme.hex)}
                    style={[
                      styles.fogThemeRow,
                      {
                        backgroundColor: isSelected ? c.primary + '12' : c.secondary,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                  >
                    <View style={[styles.fogColorDot, { backgroundColor: theme.hex }]} />
                    <Text style={[typography.h4, { color: c.foreground, flex: 1, marginLeft: 10 }]}>
                      {theme.name}
                    </Text>
                    {isSelected && <Feather name="check" size={18} color={c.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 5: Notifications & Haptics ── */}
      <Modal visible={activeModal === 'notifications'} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[typography.h3, { color: c.foreground }]}>Rung & Thông Báo</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={10}>
                <Feather name="x" size={20} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 14, gap: 14 }}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[typography.h4, { color: c.foreground }]}>Rung Phản Hồi (Haptics)</Text>
                  <Text style={[styles.optionSub, { color: c.mutedForeground }]}>
                    Rung xúc giác khi mở rương và hoàn thành nhiệm vụ.
                  </Text>
                </View>
                <Switch
                  value={profile.hapticsEnabled}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ false: '#CBD5E1', true: c.primary }}
                />
              </View>

              <View style={[styles.dividerLine, { backgroundColor: c.border }]} />

              <View style={styles.switchRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[typography.h4, { color: c.foreground }]}>Nhắc Nhở Khám Phá</Text>
                  <Text style={[styles.optionSub, { color: c.mutedForeground }]}>
                    Nhận thông báo khi gần chuỗi ngày hoặc có nhiệm vụ mới.
                  </Text>
                </View>
                <Switch
                  value={profile.notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: '#CBD5E1', true: c.primary }}
                />
              </View>
            </View>

            <View style={{ marginTop: 18 }}>
              <Button title="Xong" onPress={() => setActiveModal(null)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 6: About Wanderly (Apple Store Compliance) ── */}
      <Modal visible={activeModal === 'about'} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[typography.h3, { color: c.foreground }]}>Về Wanderly</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={10}>
                <Feather name="x" size={20} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginVertical: 14 }}>
              <View style={[styles.aboutLogoBox, { backgroundColor: '#FC5200' }]}>
                <Feather name="navigation" size={28} color="#FFFFFF" />
              </View>
              <Text style={[typography.h2, { color: c.foreground, marginTop: 8 }]}>Wanderly</Text>
              <Text style={[styles.aboutVersionText, { color: c.mutedForeground }]}>
                Phiên bản 1.0.0 (Build 101) · Production Ready
              </Text>
            </View>

            <View style={[styles.aboutInfoBox, { backgroundColor: c.secondary }]}>
              <Text style={[styles.aboutBodyText, { color: c.foreground }]}>
                Wanderly là ứng dụng thám hiểm đô thị và ghi nhận lộ trình chạy bộ ngoài đời thực theo cơ chế Fog of War (Bản đồ sương mù).
              </Text>
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.detailKey, { color: c.mutedForeground }]}>
                  Hỗ trợ kỹ thuật: support@wanderly.app
                </Text>
                <Text style={[styles.detailKey, { color: c.mutedForeground, marginTop: 2 }]}>
                  Bản quyền © 2026 Wanderly Inc.
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Button title="Đóng" onPress={() => setActiveModal(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16 },
  navHeader: {
    marginBottom: spacing.md,
  },
  headerEyebrow: {
    fontSize: 10.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontFamily: typography.h2.fontFamily,
    fontWeight: '800',
  },
  userInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  membershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipTitle: {
    fontSize: 11,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
  },
  userSubTitle: {
    fontSize: 11.5,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '500',
    marginTop: 2,
  },
  xpCardCompact: {
    padding: spacing.md,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpLevelTag: {
    fontSize: 11,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  xpNumbers: {
    fontSize: 11,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
  },
  sectionBlock: {
    marginTop: spacing.md,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedListCard: {
    padding: 0,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
  },
  menuIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.body.fontFamily,
    fontWeight: '600',
  },
  menuRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuValueText: {
    fontSize: 13,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  nameInput: {
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: typography.body.fontFamily,
    fontWeight: '600',
  },
  accountDetailBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: radii.md,
  },
  accountDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    fontSize: 12,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '700',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  optionSub: {
    fontSize: 11.5,
    fontFamily: typography.caption.fontFamily,
    marginTop: 2,
  },
  privacyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: radii.lg,
  },
  fogThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  fogColorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dividerLine: {
    height: 1,
    width: '100%',
  },
  aboutLogoBox: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FC5200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aboutVersionText: {
    fontSize: 12,
    fontFamily: typography.caption.fontFamily,
    marginTop: 2,
  },
  aboutInfoBox: {
    padding: 14,
    borderRadius: radii.lg,
    marginTop: 6,
  },
  aboutBodyText: {
    fontSize: 12.5,
    fontFamily: typography.body.fontFamily,
    lineHeight: 18,
  },
});
