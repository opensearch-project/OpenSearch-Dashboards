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
    categories: [
      '#5C7FFF',
      '#00A4BD',
      '#A669E2',
      '#003B8F',
      '#005237',
      '#B2008F',
      '#FF4B14',
      '#EB003B',
      '#F90',
      '#7A2B00',
    ],
  };
};
