/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { darkMode } from '@osd/ui-shared-deps/theme';
import { getColors } from './default_colors';

export function hexToRgb(hex: string) {
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

export function rgbToHex(r: number, g: number, b: number) {
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
