import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from '@/i18n';
import { useApp } from '@/contexts/AppContext';
import { Button, Card, Logo } from '@/components/ui/SharedComponents';
import typography from '@/constants/typography';
import { spacing, radii } from '@/constants/spacing';
import { supabase } from '@/services/SupabaseService';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const { dispatch } = useApp();
  const [loading, setLoading] = useState(false);

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      const redirectUrl = Linking.createURL('/(onboarding)/location');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        Alert.alert('Đăng nhập không thành công', error.message);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success') {
          dispatch({ type: 'UPDATE_PROFILE', updates: { authProvider: provider } });
          dispatch({ type: 'SET_GATE', gate: 'location' });
          router.push('/(onboarding)/location' as any);
        }
      }
    } catch (err: any) {
      Alert.alert('Lỗi đăng nhập', err?.message || 'Không thể kết nối dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      // Anonymous sign-in so user still gets a Supabase user ID for cloud sync
      await supabase.auth.signInAnonymously().catch(() => {});
      dispatch({ type: 'UPDATE_PROFILE', updates: { authProvider: null, name: 'Explorer' } });
      dispatch({ type: 'SET_GATE', gate: 'location' });
      router.push('/(onboarding)/location' as any);
    } catch {
      dispatch({ type: 'SET_GATE', gate: 'location' });
      router.push('/(onboarding)/location' as any);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Identity Header Card */}
        <Card style={styles.authCard}>
          <View style={[styles.authIconBox, { backgroundColor: c.primary + '18' }]}>
            <Feather name="shield" size={32} color={c.primary} />
          </View>

          <Text style={[typography.displaySmall, { color: c.foreground, textAlign: 'center', marginTop: 14 }]}>
            {t.auth.title}
          </Text>
          <Text style={[typography.body, { color: c.mutedForeground, textAlign: 'center', marginTop: 8 }]}>
            {t.auth.body}
          </Text>
        </Card>

        {/* Action Encasement Card */}
        <Card style={styles.actionCard}>
          {loading ? (
            <ActivityIndicator size="large" color={c.primary} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Button title={t.auth.apple} onPress={() => handleOAuthLogin('apple')} icon="user" />
              <Button title={t.auth.google} onPress={() => handleOAuthLogin('google')} secondary icon="mail" />
              <Button title={t.auth.skip} onPress={handleSkip} secondary />
            </>
          )}
        </Card>

        <Text style={[styles.legal, { color: c.mutedForeground }]}>
          {t.auth.legal}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, flexGrow: 1 },
  authCard: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  authIconBox: {
    width: 68,
    height: 68,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    gap: 12,
  },
  legal: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 18,
    fontFamily: typography.captionSmall.fontFamily,
  },
});
