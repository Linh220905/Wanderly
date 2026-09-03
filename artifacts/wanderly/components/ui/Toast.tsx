/**
 * In-App Toast Notification
 * Displays temporary toast messages for achievements, rewards, and status.
 */

import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import typography from '@/constants/typography';
import { spacing, radii, shadows } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  icon?: keyof typeof Feather.glyphMap;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (options: Omit<ToastMessage, 'id'>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const newToast = { ...options, id: Date.now().toString() };
    setToast(newToast);

    Animated.spring(translateY, {
      toValue: insets.top + 10,
      useNativeDriver: true,
      friction: 8,
    }).start();

    timeoutRef.current = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 3000);
  };

  const getIcon = (type: ToastType): keyof typeof Feather.glyphMap => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'info': return 'info';
      case 'warning': return 'alert-triangle';
      case 'error': return 'x-circle';
    }
  };

  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success': return c.success;
      case 'info': return c.info;
      case 'warning': return c.warning;
      case 'error': return c.destructive;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              transform: [{ translateY }],
            },
            shadows.lg,
          ]}
        >
          <Feather name={toast.icon || getIcon(toast.type)} size={20} color={getColor(toast.type)} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.h4, { color: c.foreground }]}>{toast.title}</Text>
            {toast.message && (
              <Text style={[typography.bodySmall, { color: c.mutedForeground, marginTop: 2 }]}>
                {toast.message}
              </Text>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 0, left: 16, right: 16,
    borderRadius: radii.xl, borderWidth: 1, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 9999,
  },
});
