/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const uiThemeColors = {
  // Neutrals
  grey50: '#F7F7F7',
  grey100: '#EDEDED',
  grey200: '#DADADA',
  grey300: '#BDBDBD',
  grey400: '#9E9E9E',
  grey500: '#7A7A7A',
  grey600: '#5E5E5E',
  grey700: '#424242',
  grey800: '#2B2B2B',
  grey900: '#1A1A1A',

  // Primary (blue)
  primary50: '#E3F2FD',
  primary100: '#BBDEFB',
  primary200: '#90CAF9',
  primary300: '#64B5F6',
  primary400: '#42A5F5',
  primary500: '#2196F3',
  primary600: '#1E88E5',
  primary700: '#1976D2',
  primary800: '#1565C0',
  primary900: '#0D47A1',

  // Base
  white: '#FFFFFF',
  black: '#000000',

  // Feedback
  red600: '#D32F2F',
  green600: '#2E7D32',
  orange600: '#ED6C02',
};

export const semanticColors = {
  text: {
    primary: uiThemeColors.grey900,
    secondary: uiThemeColors.grey700,
    muted: uiThemeColors.grey500,
    inverse: uiThemeColors.white,
  },

  background: {
    page: uiThemeColors.white,
    surface: uiThemeColors.grey50,
    elevated: uiThemeColors.white,
    subtle: uiThemeColors.grey100,
  },

  border: {
    default: uiThemeColors.grey200,
    subtle: uiThemeColors.grey100,
    focus: uiThemeColors.primary500,
  },

  intent: {
    primary: uiThemeColors.primary500,
    primaryHover: uiThemeColors.primary600,
    primaryActive: uiThemeColors.primary700,

    info: uiThemeColors.primary700,
    success: uiThemeColors.green600,
    warning: uiThemeColors.orange600,
    danger: uiThemeColors.red600,
  },
};

export const componentTokens = {
  header: {
    background: semanticColors.background.surface,
    text: semanticColors.text.primary,
  },

  sidebar: {
    background: semanticColors.background.page,
    border: semanticColors.border.subtle,
  },

  card: {
    background: semanticColors.background.elevated,
    border: semanticColors.border.default,
    header: {
      background: semanticColors.intent.primary,
      text: semanticColors.text.inverse,
    },
    body: {
      text: semanticColors.text.primary,
    },
  },

  button: {
    primary: {
      background: {
        idle: semanticColors.intent.primary,
        hover: semanticColors.intent.primaryHover,
        active: semanticColors.intent.primaryActive,
      },
      text: semanticColors.text.inverse,
      outline: semanticColors.intent.primary,
    },
  },

  input: {
    background: semanticColors.background.page,
    border: {
      idle: semanticColors.border.default,
      focus: semanticColors.border.focus,
      error: semanticColors.intent.danger,
    },
  },
};

export const spacing = {
  xs: '4px',
  s: '8px',
  m: '16px',
  l: '24px',
  xl: '32px',
};

export const elevation = {
  s: '0 1px 3px rgba(0,0,0,0.1)',
  m: '0 4px 6px rgba(0,0,0,0.12)',
  l: '0 10px 20px rgba(0,0,0,0.16)',
  overlay: '0 12px 28px rgba(0,0,0,0.2)',
  inset: 'inset -1px 0 0 rgba(0,0,0,0.08)',
};

export const borderRadius = {
  s: '4px',
  m: '8px',
  l: '12px',
};

export const typography = {
  fontFamily: 'Inter, sans-serif',
  fontSize: {
    s: '14px',
    m: '16px',
    l: '18px',
    xl: '22px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
