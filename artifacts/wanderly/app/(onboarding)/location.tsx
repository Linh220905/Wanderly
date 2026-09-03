import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Logo } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing } from '@/constants/spacing';

export default function LocationScreen() {
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
      <ScrollView contentContainerStyle={styles.content}>
        <Logo />

        {/* Location Art */}
        <View style={styles.locationArt}>
          <Feather name="map-pin" size={42} color={c.primary} />
          <View style={[styles.radar, { borderColor: c.border }]} />
          <View style={[styles.radarSmall, { borderColor: c.primary }]} />
        </View>

        <Text style={[typography.displaySmall, { color: c.foreground, marginBottom: spacing.md }]}>
          {t.location.title}
        </Text>
        <Text style={[typography.bodyLarge, { color: c.mutedForeground, marginBottom: spacing['2xl'] }]}>
          {t.location.body}
        </Text>

        {/* Privacy Tips */}
        {t.location.tips.map((tip, i) => (
          <View style={styles.privacyRow} key={tip}>
            <Feather name={tipIcons[i]} size={19} color={c.accent} />
            <Text style={[typography.body, { color: c.accent, flex: 1 }]}>{tip}</Text>
          </View>
        ))}

        <View style={{ marginTop: spacing.xl }}>
          <Button
            title={busy ? t.location.requesting : t.location.enable}
            onPress={request}
            disabled={busy}
            icon="navigation"
          />
        </View>
        <View style={{ height: spacing.sm }} />
        <Button title={t.location.later} onPress={goToMain} secondary />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 28, paddingTop: 64, paddingBottom: 35, flexGrow: 1 },
  locationArt: {
    height: 175, marginVertical: 28,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  radar: {
    position: 'absolute', width: 145, height: 145, borderRadius: 73, borderWidth: 1,
  },
  radarSmall: {
    position: 'absolute', width: 85, height: 85, borderRadius: 43, borderWidth: 1,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
});
