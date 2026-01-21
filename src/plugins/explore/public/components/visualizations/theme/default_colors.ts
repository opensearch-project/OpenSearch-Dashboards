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

  const euiPaletteColorBlindColors = euiPaletteColorBlind();

  if (isExperimental) {
    if (darkMode) {
      return {
        statusBlue: '#006CE0',
        statusGreen: '#00BD6B',
        statusYellow: '#F90',
        statusOrange: '#FF6A3D',
        statusRed: '#DB0000',
        text: '#FFF',
        subText: '#ccc',
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
      subText: '#6E7079',
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
    subText: euiThemeVars.euiTextColors.subdued,
    grid: euiThemeVars.euiColorChartLines,
    backgroundShade: darkMode ? '#27252C' : '#f1f1f1ff',
    categories: [
      euiPaletteColorBlindColors[1],
      euiPaletteColorBlindColors[3],
      euiPaletteColorBlindColors[9],
      euiPaletteColorBlindColors[5],
      euiPaletteColorBlindColors[1],
      euiPaletteColorBlindColors[0],
      euiPaletteColorBlindColors[2],
      euiPaletteColorBlindColors[8],
      euiPaletteColorBlindColors[0],
      euiPaletteColorBlindColors[4],
    ],
  };
};

export const DEFAULT_GREY = '#d3d3d3';
