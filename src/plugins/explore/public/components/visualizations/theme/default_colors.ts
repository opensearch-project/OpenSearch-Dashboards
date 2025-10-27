/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { euiPaletteColorBlind } from '@elastic/eui';
import { darkMode, euiThemeVars } from '@osd/ui-shared-deps/theme';

export const getColors = () => {
  // Temporary change to rollout discover visualization theme changes for development before OUI theme changes
  // been implemented accordingly.
  const isExperimental =
    localStorage.getItem('__DEVELOPMENT__.discover.vis.theme') === 'experimental';
  if (isExperimental) {
    if (darkMode) {
      return {
        statusBlue: '#006CE0',
        statusGreen: '#00BD6B',
        statusYellow: '#F90',
        statusOrange: '#FF6A3D',
        statusRed: '#DB0000',
        text: '#FFF',
        grid: '#27252C',
        backgroundShade: '#27252C',
        categories: [
          '#7598FF',
          '#A669E2',
          '#FF4B14',
          '#F90',
          '#006CE0',
          '#008559',
          '#EB003B',
          '#FFE8BD',
          '#00A4BD',
          '#D600BA',
        ],
      };
    }
    return {
      statusBlue: '#004A9E',
      statusGreen: '#00BD6B',
      statusYellow: '#F90',
      statusOrange: '#FF6A3D',
      statusRed: '#DB0000',
      text: '#313131',
      grid: '#F5F7FF',
      backgroundShade: '#f1f1f1ff',
      categories: [
        '#5C7FFF',
        '#A669E2',
        '#FF4B14',
        '#F90',
        '#003B8F',
        '#005237',
        '#EB003B',
        '#7A2B00',
        '#00A4BD',
        '#B2008F',
      ],
    };
  }

  return {
    statusBlue: '#004A9E',
    statusGreen: '#00BD6B',
    statusYellow: '#F90',
    statusOrange: '#FF6A3D',
    statusRed: '#DB0000',
    text: euiThemeVars.euiTextColor,
    grid: euiThemeVars.euiColorChartLines,
    backgroundShade: darkMode ? '#27252C' : '#f1f1f1ff',
    categories: euiPaletteColorBlind(),
  };
};

export const DEFAULT_GREY = '#d3d3d3';

function hexToRgb(hex: string) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((x) => x + x)
      .join('');
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function generateColorGroup(start: string, end: string, groupName: string, nums: number = 5) {
  const s = hexToRgb(start);
  const e = hexToRgb(end);

  const colors: Record<string, string> = {};
  for (let i = 0; i < nums; i++) {
    const t = i / (nums - 1);
    const r = Math.round(s.r + (e.r - s.r) * t);
    const g = Math.round(s.g + (e.g - s.g) * t);
    const b = Math.round(s.b + (e.b - s.b) * t);
    colors[`${groupName}${i + 1}`] = rgbToHex(r, g, b);
  }
  return colors;
}

export const getColorGroups = () => {
  if (darkMode) {
    return {
      red: generateColorGroup('#ffb3b8', '#DB0000', 'red'),
      orange: generateColorGroup('#ffcb7e', '#FF6A3D', 'orange'),
      yellow: generateColorGroup('#fff2b3', '#F90', 'yellow'),
      green: generateColorGroup('#c9f2c2', '#00BD6B', 'green'),
      blue: generateColorGroup('#c0d8ff', '#7598FF', 'blue'),
      purple: generateColorGroup('#deb7f2', '#A669E2', 'purple'),
    };
  }
  return {
    red: generateColorGroup('#DB0000', '#ffb3b8', 'red'),
    orange: generateColorGroup('#FF4B14', '#ffcb7e', 'orange'),
    yellow: generateColorGroup('#F90', '#fff2b3', 'yellow'),
    green: generateColorGroup('#005237', '#c9f2c2', 'green'),
    blue: generateColorGroup('#5C7FFF', '#c0d8ff', 'blue'),
    purple: generateColorGroup('#A669E2', '#deb7f2', 'purple'),
  };
};

export const getCategoryNextColor = (index: number) => {
  return getColors().categories[index % getColors().categories.length];
};

// Resolve color name to hex value
export const resolveColor = (colorName?: string) => {
  if (!colorName) return undefined;

  // Return hex color
  if (colorName.startsWith('#')) return colorName;
  const colorGroups = getColorGroups();

  for (const group of Object.values(colorGroups)) {
    if (colorName in group) {
      return group[colorName as keyof typeof group];
    }
  }

  return colorName;
};
