import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Wanderly uses a dark-first design, so both light and dark palettes
 * are dark-themed. The hook still respects the system preference and
 * will pick the `dark` palette when available.
 */
export function useColors() {
  const scheme = useColorScheme();
  const palette =
    scheme === 'dark' && 'dark' in colors
      ? colors.dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
