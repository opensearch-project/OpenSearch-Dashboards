/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { euiPaletteColorBlind } from '@elastic/eui';
import { darkMode, euiThemeVars } from '@osd/ui-shared-deps/theme';
import { DEFAULT_DARK, DEFAULT_LIGHT, ECHARTS_DARK, ECHARTS_LIGHT } from './color_palettes';

export const getColors = () => {
  // Temporary change to rollout discover visualization theme changes for development before OUI theme changes
  // been implemented accordingly.
  const theme = localStorage.getItem('__DEVELOPMENT__.discover.vis.theme') || 'echarts';
  if (theme === 'experimental') {
    if (darkMode) {
      return DEFAULT_DARK;
    }
    return DEFAULT_LIGHT;
  }

  if (theme === 'echarts') {
    if (darkMode) {
      return ECHARTS_DARK;
    }
    return ECHARTS_LIGHT;
  }

  return {
    statusBlue: '#004A9E',
    statusGreen: '#00BD6B',
    statusYellow: '#F90',
    statusOrange: '#FF6A3D',
    statusRed: '#DB0000',
    text: euiThemeVars.euiTextColor,
    subText: euiThemeVars.euiTextColors.subdued,
    grid: euiThemeVars.euiColorChartLines,
    backgroundShade: darkMode ? '#27252C' : '#f1f1f1ff',
    categories: euiPaletteColorBlind(),
  };
};

export const DEFAULT_GREY = '#d3d3d3';
