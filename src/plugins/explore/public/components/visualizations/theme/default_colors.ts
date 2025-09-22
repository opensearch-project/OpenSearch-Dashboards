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
