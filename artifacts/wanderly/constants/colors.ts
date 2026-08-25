/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#F4F7F3', tint: '#F4A340', background: '#071B1C',
    foreground: '#F4F7F3', card: '#102B2B', cardForeground: '#F4F7F3',
    primary: '#F4A340', primaryForeground: '#071B1C',
    secondary: '#173D3A', secondaryForeground: '#DDE9E1',
    muted: '#173D3A', mutedForeground: '#91AAA2',
    accent: '#D7E9C3', accentForeground: '#102B2B',
    destructive: '#E67566', destructiveForeground: '#FFFFFF',
    border: '#28514B', input: '#28514B',
  },
  radius: 18,
};

export default colors;
