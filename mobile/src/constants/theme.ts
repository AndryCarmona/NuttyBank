/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Paleta de NuttyBank, tomada del mockup (Figma).
// Por ahora la app usa SIEMPRE la paleta `light` (ver hooks/use-color-scheme.ts);
// la `dark` queda lista para cuando se diseñe el modo oscuro de Ajustes.
export const Colors = {
  light: {
    text: '#1E242B',
    background: '#FAF9F6', // crema: fondo de pantallas
    backgroundElement: '#F0F2F5', // campos de texto y tarjetas claras
    backgroundSelected: '#E1E4E8',
    textSecondary: '#5A636B',
    primary: '#6C757D', // botones (gris pizarra del mockup)
    brand: '#7BA47E', // verde: panel de formularios
    danger: '#B42318',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#8A939B',
    brand: '#5E8A61',
    danger: '#F97066',
  },
} as const;

// Tipografía del mockup: Poppins. Cada peso es una familia distinta porque en
// Android `fontWeight` no elige variantes de una fuente personalizada.
export const Poppins = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
