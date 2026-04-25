export const theme = {
  colors: {
    // Primary brand colors
    primary: '#C8873A',         // warm amber/coffee
    primaryVariant: '#A0632A',
    primaryContainer: '#3D2B1F',
    onPrimaryContainer: '#F5C87A',
    secondary: '#6B4F3A',       // espresso brown
    secondaryContainer: '#4A3728',
    accent: '#F5C87A',          // golden latte

    // Backgrounds
    background: '#1A1210',      // deep dark espresso
    surface: '#231A15',
    surfaceContainer: '#2C1F18',
    surfaceContainerLow: '#251B15',
    surfaceContainerHigh: '#362820',
    surfaceVariant: '#3A2820',

    // Text
    onBackground: '#F2E8DC',
    onSurface: '#F2E8DC',
    onSurfaceVariant: '#A89080',
    onPrimary: '#1A1210',

    // Specific named tokens used in the app
    espresso: '#3D2B1F',
    cream: '#F2E8DC',
    foam: '#FFF8F0',
    caramel: '#C8873A',
    darkRoast: '#1A1210',
    milk: '#E8D5C0',

    // UI utility
    outline: '#5C4A3A',
    border: '#3D2B1F',
    divider: '#2C1F18',
    overlay: 'rgba(0,0,0,0.6)',

    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },

  typography: {
    fontFamily: {
      serif: 'Noto Serif',
      sans: 'Manrope',
      mono: 'SpaceMono',
    },
    // Pre-composed text styles
    headlineXl: {
      fontFamily: 'Noto Serif',
      fontSize: 36,
      fontWeight: '700' as const,
    },
    headlineLg: {
      fontFamily: 'Noto Serif',
      fontSize: 28,
      fontWeight: '700' as const,
    },
    headlineMd: {
      fontFamily: 'Noto Serif',
      fontSize: 22,
      fontWeight: '600' as const,
    },
    bodyLg: {
      fontFamily: 'Manrope',
      fontSize: 17,
      fontWeight: '400' as const,
    },
    bodyMd: {
      fontFamily: 'Manrope',
      fontSize: 15,
      fontWeight: '400' as const,
    },
    bodySm: {
      fontFamily: 'Manrope',
      fontSize: 13,
      fontWeight: '400' as const,
    },
    labelLg: {
      fontFamily: 'Manrope',
      fontSize: 15,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    },
    labelMd: {
      fontFamily: 'Manrope',
      fontSize: 13,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    },
    labelSm: {
      fontFamily: 'Manrope',
      fontSize: 11,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    },
    // Raw sizes (legacy)
    fontSize: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semiBold: '600' as const,
      bold: '700' as const,
      extraBold: '800' as const,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },

  rounded: {
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
    full: 9999,
  },

  borderRadius: {
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
