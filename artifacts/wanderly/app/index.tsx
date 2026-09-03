/**
 * Gate Checker — Entry point for Wanderly.
 *
 * Reads the persisted gate state and redirects to either
 * the onboarding flow or the main app tabs.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function GateChecker() {
  const { loaded, gate } = useApp();
  const c = useColors();

  useEffect(() => {
    if (!loaded) return;

    // Route based on persisted gate state
    switch (gate) {
      case 'main':
        router.replace('/(tabs)/map' as any);
        break;
      case 'welcome':
        router.replace('/(onboarding)/welcome' as any);
        break;
      case 'questions':
        router.replace('/(onboarding)/questions' as any);
        break;
      case 'summary':
        router.replace('/(onboarding)/summary' as any);
        break;
      case 'paywall':
        router.replace('/(onboarding)/paywall' as any);
        break;
      case 'auth':
        router.replace('/(onboarding)/auth' as any);
        break;
      case 'location':
        router.replace('/(onboarding)/location' as any);
        break;
      default:
        router.replace('/(onboarding)/welcome' as any);
    }
  }, [loaded, gate]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ActivityIndicator color={c.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});