/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const shades = {
  white: '#FFFFFF',
  grey50: '#F7F7F7',
  grey100: '#E7E7E7',
  grey200: '#CCCCCC',
  grey300: '#B3B3B3',
  grey400: '#999999',
  grey500: '#808080',
  grey600: '#666666',
  grey700: '#4D4D4D',
  grey800: '#333333',
  grey900: '#1A1A1A',
  black: '#000000',
};

const headerColors = {
  background: shades.grey100,
  text: shades.grey900,
};

const sidebarColors = {
  background: shades.white,
};

const cardColors = {
  background: shades.white,
};

const buttonColors = {
  background: {
    idle: '#2E4053',
    hover: '#1E3448',
  },
  text: {
    idle: shades.white,
    hover: shades.white,
  },
};

const inputColors = {
  background: shades.white,
  border: shades.grey200,
};

export const colors = {
  sidebar: sidebarColors,
  header: headerColors,
  card: cardColors,
  input: inputColors,
  button: buttonColors,
};

export const spacing = {
  s: '8px',
  m: '16px',
  l: '24px',
};

export const borderRadius = {
  s: '4px',
  m: '8px',
  l: '12px',
};

export const typography = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  headerSize: '18px',
};
