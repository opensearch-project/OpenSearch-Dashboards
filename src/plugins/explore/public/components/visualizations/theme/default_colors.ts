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
    categories: euiPaletteColorBlind(),
  };
};

export const DEFAULT_GREY = '#d3d3d3';

export const getUnfilledArea = () => {
  if (darkMode) return '#27252C';
  return '#f1f1f1ff';
};

export const darkenColor = (hex: string, degree = 1) => {
  // degree: 1 = 10%, 2 = 20%, etc.
  const factor = 1 - degree * 0.1;

  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.max(Math.floor(r * factor), 0);
  g = Math.max(Math.floor(g * factor), 0);
  b = Math.max(Math.floor(b * factor), 0);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
