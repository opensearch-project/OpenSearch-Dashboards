/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { darkMode } from '@osd/ui-shared-deps/theme';

export const getColors = () => {
  if (darkMode) {
    return {
      statusGreen: '#00BD6B',
      statusRed: '#DB0000',
      text: '#FFF',
      grid: '#F5F7FF',
      categories: [
        '#7598FF',
        '#00A4BD',
        '#A669E2',
        '#006CE0',
        '#00A4BD',
        '#D600BA',
        '#FF4B14',
        '#EB003B',
        '#F90',
        '#FFE8BD',
      ],
    };
  }
  return {
    statusGreen: '#00BD6B',
    statusRed: '#DB0000',
    text: '#313131',
    grid: '#27252C',
    categories: [
      '#5C7FFF',
      '#005237',
      '#A669E2',
      '#003B8F',
      '#00A4BD',
      '#B2008F',
      '#FF4B14',
      '#EB003B',
      '#F90',
      '#7A2B00',
    ],
  };
};
