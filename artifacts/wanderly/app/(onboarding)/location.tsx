import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Card, Logo } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const { dispatch } = useApp();
  const [busy, setBusy] = useState(false);

  const goToMain = () => {
    dispatch({ type: 'SET_GATE', gate: 'main' });
    router.replace('/(tabs)/map' as any);
  };

  const request = async () => {
    setBusy(true);
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      if (result.status === 'granted') {
        goToMain();
      } else {
        Alert.alert(
          t.location.deniedTitle,
          t.location.deniedBody,
          [{ text: t.common.continue, onPress: goToMain }],
        );
      }
    } catch {
      goToMain();
    } finally {
      setBusy(false);
    }
  };

  const tipIcons: (keyof typeof Feather.glyphMap)[] = ['play-circle', 'battery', 'eye-off'];

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Logo />

        {/* GPS Radar Header */}
        <View style={styles.radarSection}>
          <View style={[styles.radarCircleOuter, { borderColor: c.border, backgroundColor: c.secondary }]}>
            <View style={[styles.radarCircleInner, { borderColor: c.primary, backgroundColor: c.card }]}>
              <Feather name="map-pin" size={32} color={c.primary} />
            </View>
            <View style={[styles.radarSweep, { borderColor: c.primary + '40' }]} />
          </View>

          <Text style={[typography.displaySmall, { color: c.foreground, textAlign: 'center', marginTop: 14 }]}>
            {t.location.title}
          </Text>
          <Text style={[typography.body, { color: c.mutedForeground, textAlign: 'center', marginTop: 6 }]}>
            {t.location.body}
          </Text>
        </View>

        {/* Privacy & Battery Tips Card */}
        <Card style={styles.tipsCard}>
          <Text style={[styles.tipsHeader, { color: c.primary }]}>CAM KẾT TRẢI NGHIỆM</Text>
          {t.location.tips.map((tip, i) => (
            <View style={styles.tipRow} key={tip}>
              <View style={[styles.tipIconBox, { backgroundColor: c.accent + '18' }]}>
                <Feather name={tipIcons[i]} size={15} color={c.accent} />
              </View>
              <Text style={[typography.caption, { color: c.foreground, flex: 1, fontWeight: '600' }]}>{tip}</Text>
            </View>
          ))}
        </Card>

        <View style={{ marginTop: spacing.lg, gap: 10 }}>
          <Button
            title={busy ? t.location.requesting : t.location.enable}
            onPress={request}
            disabled={busy}
            icon="navigation"
          />
          <Button title={t.location.later} onPress={goToMain} secondary />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, flexGrow: 1 },
  radarSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  radarCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarCircleInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarSweep: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  tipsCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    gap: 10,
  },
  tipsHeader: {
    fontSize: 10,
    fontFamily: typography.label.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipIconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
