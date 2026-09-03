/**
 * Typography scale using Inter font family.
 *
 * All text styles reference Inter weights loaded in _layout.tsx.
 * Use these presets for consistent typography across all screens.
 */

import { StyleSheet } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const typography = StyleSheet.create({
  // Display — Splash, Hero
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.5,
  },
  displayMedium: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.2,
  },
  displaySmall: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
  },

  // Headings
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  h4: {
    fontFamily: fontFamily.semiBold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.2,
  },

  // Body
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: 17,
    lineHeight: 25,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },

  // Labels
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  labelMedium: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
  },

  // Button
  button: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 20,
  },
  buttonSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 18,
  },

  // Stats / Metrics
  statLarge: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
  },
  stat: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  statSmall: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    lineHeight: 24,
  },

  // Caption
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 15,
  },
  captionSmall: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 14,
  },
});

export default typography;
