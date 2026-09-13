import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useTranslation } from '@/i18n';
import typography from '@/constants/typography';

export default function TabLayout() {
  const c = useColors();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : c.card,
          borderTopColor: c.border,
          borderTopWidth: 1,
          elevation: 10,
          shadowColor: '#64748B',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          height: isWeb ? 72 : isIOS ? 88 : 68,
          paddingTop: 8,
          paddingBottom: isIOS ? 30 : 10,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={85}
              tint="light"
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.85)' }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border },
              ]}
            />
          ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: typography.label.fontFamily,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: t.tabs.map,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="map" size={20} color={color} style={focused ? styles.activeIcon : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: t.tabs.missions,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="target" size={20} color={color} style={focused ? styles.activeIcon : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: t.tabs.journey,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="activity" size={20} color={color} style={focused ? styles.activeIcon : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: t.tabs.collection,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="award" size={20} color={color} style={focused ? styles.activeIcon : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="user" size={20} color={color} style={focused ? styles.activeIcon : undefined} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIcon: {
    transform: [{ scale: 1.08 }],
  },
});
