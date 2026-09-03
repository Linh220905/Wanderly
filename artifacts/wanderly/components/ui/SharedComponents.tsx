/**
 * Reusable UI components for Wanderly.
 *
 * Premium design system with consistent styling, haptic feedback,
 * and smooth animations.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import typography from '@/constants/typography';
import { spacing, radii, shadows } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

// ── Button ────────────────────────────────────────────────

interface ButtonProps {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  size?: 'default' | 'small';
}

export function Button({ title, onPress, secondary = false, disabled = false, icon, loading = false, size = 'default' }: ButtonProps) {
  const c = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        testID={title}
        disabled={disabled || loading}
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          size === 'small' && styles.buttonSmall,
          secondary && { backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border },
          (disabled || loading) && styles.disabled,
        ]}
      >
        {icon && !loading && (
          <Feather name={icon} size={size === 'small' ? 15 : 17} color={secondary ? c.accent : c.primaryForeground} />
        )}
        <Text style={[
          styles.buttonText,
          size === 'small' && styles.buttonTextSmall,
          secondary && { color: c.accent },
        ]}>
          {loading ? 'Loading…' : title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Card ──────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  glow?: boolean;
}

export function Card({ children, style, onPress, glow = false }: CardProps) {
  const c = useColors();
  const content = (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, glow && shadows.glow, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>{content}</Pressable>;
  }
  return content;
}

// ── ProgressBar ───────────────────────────────────────────

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  showLabel?: boolean;
  gradient?: boolean;
}

export function ProgressBar({ progress, height = 6, showLabel = false, gradient = false }: ProgressBarProps) {
  const c = useColors();
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: Math.min(1, Math.max(0, progress)),
      useNativeDriver: false,
      friction: 12,
    }).start();
  }, [progress, animatedWidth]);

  return (
    <View>
      <View style={[styles.progressTrack, { height, backgroundColor: c.secondary }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              height,
              backgroundColor: gradient ? undefined : c.primary,
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          {gradient && (
            <LinearGradient
              colors={[c.primary, c.warning]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          )}
        </Animated.View>
      </View>
      {showLabel && (
        <Text style={[styles.progressLabel, { color: c.mutedForeground }]}>
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
}

// ── SegmentControl ────────────────────────────────────────

interface SegmentControlProps {
  segments: string[];
  active: number;
  onChange: (index: number) => void;
}

export function SegmentControl({ segments, active, onChange }: SegmentControlProps) {
  const c = useColors();

  return (
    <View style={[styles.segmentContainer, { backgroundColor: c.secondary }]}>
      {segments.map((label, index) => (
        <Pressable
          key={label}
          style={[
            styles.segmentItem,
            index === active && { backgroundColor: c.card },
          ]}
          onPress={() => { Haptics.selectionAsync(); onChange(index); }}
        >
          <Text style={[
            styles.segmentText,
            { color: c.mutedForeground },
            index === active && { color: c.foreground, fontWeight: '700' as const },
          ]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── StatCard ──────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon?: keyof typeof Feather.glyphMap;
  accent?: boolean;
}

export function StatCard({ label, value, icon, accent = false }: StatCardProps) {
  const c = useColors();
  return (
    <Card style={styles.statCard}>
      {icon && (
        <View style={[styles.statIcon, { backgroundColor: accent ? c.primary + '20' : c.secondary }]}>
          <Feather name={icon} size={16} color={accent ? c.primary : c.mutedForeground} />
        </View>
      )}
      <Text style={[typography.label, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[typography.statSmall, { color: c.foreground, marginTop: 4 }]}>{value}</Text>
    </Card>
  );
}

// ── EmptyState ────────────────────────────────────────────

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  action?: { title: string; onPress: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const c = useColors();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: c.secondary }]}>
        <Feather name={icon} size={32} color={c.primary} />
      </View>
      <Text style={[typography.h3, { color: c.foreground, marginTop: spacing.lg }]}>{title}</Text>
      <Text style={[typography.body, { color: c.mutedForeground, textAlign: 'center', marginTop: spacing.sm }]}>
        {description}
      </Text>
      {action && (
        <View style={{ marginTop: spacing.xl }}>
          <Button title={action.title} onPress={action.onPress} size="small" />
        </View>
      )}
    </View>
  );
}

// ── Tag ───────────────────────────────────────────────────

interface TagProps {
  text: string;
  active: boolean;
  onPress: () => void;
}

export function Tag({ text, active, onPress }: TagProps) {
  const c = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={[
          styles.tag,
          { borderColor: c.border, backgroundColor: c.card },
          active && { backgroundColor: c.primary, borderColor: c.primary },
        ]}
      >
        <Text style={[
          styles.tagText,
          { color: c.cardForeground },
          active && { color: c.primaryForeground, fontWeight: '700' as const },
        ]}>
          {text}
        </Text>
        {active && <Feather name="check" size={15} color={c.primaryForeground} />}
      </Pressable>
    </Animated.View>
  );
}

// ── Logo ──────────────────────────────────────────────────

export function Logo({ small = false }: { small?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.logo}>
      <View style={[
        styles.logoMark,
        { backgroundColor: c.primary },
        small && styles.logoSmall,
      ]}>
        <Feather name="navigation" size={small ? 14 : 21} color={c.primaryForeground} />
      </View>
      <Text style={[
        styles.logoText,
        { color: c.foreground },
        small && styles.logoTextSmall,
      ]}>
        wanderly
      </Text>
    </View>
  );
}

// ── AnimatedCounter ───────────────────────────────────────

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  style?: any;
  decimals?: number;
}

export function AnimatedCounter({ value, suffix = '', style, decimals = 0 }: AnimatedCounterProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState('0');

  useEffect(() => {
    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(v.toFixed(decimals));
    });

    Animated.timing(animValue, {
      toValue: value,
      duration: 800,
      useNativeDriver: false,
    }).start();

    return () => animValue.removeListener(listener);
  }, [value, animValue, decimals]);

  return <Text style={style}>{displayValue}{suffix}</Text>;
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonSmall: {
    height: 44,
    borderRadius: radii.md,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  buttonText: {
    ...typography.button,
    color: colors.light.primaryForeground,
  },
  buttonTextSmall: {
    ...typography.buttonSmall,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.sm,
  },
  progressTrack: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressLabel: {
    ...typography.captionSmall,
    textAlign: 'right',
    marginTop: 4,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: radii.md,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    borderRadius: radii.sm + 2,
    paddingVertical: 9,
    alignItems: 'center',
  },
  segmentText: {
    ...typography.buttonSmall,
  },
  statCard: {
    width: '48%' as any,
    padding: spacing.lg,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing['2xl'],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    minHeight: 54,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSmall: {
    width: 31,
    height: 31,
    borderRadius: 11,
  },
  logoText: {
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -1,
  },
  logoTextSmall: {
    fontSize: 18,
  },
});
