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
export const getColorGroups = () => {
  return {
    red: {
      red1: '#c4152a',
      red2: '#e02f44',
      red3: '#ff4b5e',
      red4: '#ff7f87',
      red5: '#ffb3b8',
    },
    orange: {
      orange1: '#fa6501',
      orange2: '#ff780b',
      orange3: '#ff9830',
      orange4: '#ffb357',
      orange5: '#ffcb7e',
    },
    yellow: {
      yellow1: '#e0b400',
      yellow2: '#ffca00',
      yellow3: '#ffdb4a',
      yellow4: '#ffe680',
      yellow5: '#fff2b3',
    },
    green: {
      green1: '#37872d',
      green2: '#57a64b',
      green3: '#73bf69',
      green4: '#96d98d',
      green5: '#c9f2c2',
    },
    blue: {
      blue1: '#2061c4',
      blue2: '#3275d9',
      blue3: '#5794f2',
      blue4: '#8ab8ff',
      blue5: '#c0d8ff',
    },
    purple: {
      purple1: '#8f3bb8',
      purple2: '#a352cd',
      purple3: '#b977d9',
      purple4: '#ca96e5',
      purple5: '#deb7f2',
    },
  };
};

export const greyDefault = '#cdccdc';

export const getCategoryNextColor = (index: number) => {
  return getColors().categories[index % getColors().categories.length];
};
