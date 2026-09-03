import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Logo } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing } from '@/constants/spacing';

export default function AuthScreen() {
  const c = useColors();
  const { t } = useTranslation();
  const { dispatch } = useApp();

  const handleAuth = (provider: 'apple' | 'google' | null) => {
    // TODO: Integrate real auth with expo-auth-session
    if (provider) {
      dispatch({ type: 'UPDATE_PROFILE', updates: { authProvider: provider, name: 'Explorer' } });
    }
    dispatch({ type: 'SET_GATE', gate: 'location' });
    router.push('/(onboarding)/location' as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Logo />

        <View style={[styles.authIcon, { backgroundColor: c.secondary }]}>
          <Feather name="user" size={28} color={c.primary} />
        </View>

        <Text style={[typography.displaySmall, { color: c.foreground, marginBottom: spacing.md }]}>
          {t.auth.title}
        </Text>
        <Text style={[typography.bodyLarge, { color: c.mutedForeground, marginBottom: spacing['3xl'] }]}>
          {t.auth.body}
        </Text>

        {/* Apple Sign In */}
        <Button title={t.auth.apple} onPress={() => handleAuth('apple')} icon="user" />
        <View style={{ height: spacing.sm }} />

        {/* Google Sign In */}
        <Button title={t.auth.google} onPress={() => handleAuth('google')} secondary icon="mail" />
        <View style={{ height: spacing.sm }} />

        {/* Skip */}
        <Button title={t.auth.skip} onPress={() => handleAuth(null)} secondary />

        <Text style={[styles.legal, { color: c.mutedForeground }]}>
          {t.auth.legal}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 28, paddingTop: 64, paddingBottom: 35, flexGrow: 1 },
  authIcon: {
    width: 64, height: 64, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 70, marginBottom: 24,
  },
  legal: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 16 },
});
