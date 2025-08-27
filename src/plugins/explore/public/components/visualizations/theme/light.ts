/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config } from './config';

const gridColor = '#F5F7FF';
const textColor = '#313131';

// Color palette variables
const paletteColor1 = '#5C7FFF';
const paletteColor2 = '#00A4BD';
const paletteColor3 = '#A669E2';
const paletteColor4 = '#003B8F';
const paletteColor5 = '#005237';
const paletteColor6 = '#B2008F';
const paletteColor7 = '#FF4B14';
const paletteColor8 = '#EB003B';
const paletteColor9 = '#F90';
const paletteColor10 = '#7A2B00';

export const defaultLightTheme: Config = {
  arc: { fill: paletteColor1 },
  area: { fill: paletteColor1 },
  // path: { stroke: paletteColor1 },
  rect: { fill: paletteColor1 },
  // shape: { stroke: paletteColor1 },
  // symbol: { stroke: paletteColor1 },
  circle: { fill: paletteColor1 },
  bar: { fill: paletteColor1 },
  line: { stroke: paletteColor1 },
  point: { fill: paletteColor1, filled: true },
  text: { fill: textColor },
  style: {
    'guide-label': {
      fontSize: 12,
    },
    'guide-title': {
      fontSize: 12,
    },
    'group-title': {
      fontSize: 12,
    },
  },
  title: {
    fontSize: 14,
  },
  axis: {
    gridColor,
    tickColor: gridColor,
    labelColor: textColor,
    domainColor: gridColor,
    domain: true,
    grid: true,
  },
  range: {
    category: [
      paletteColor1,
      paletteColor2,
      paletteColor3,
      paletteColor4,
      paletteColor5,
      paletteColor6,
      paletteColor7,
      paletteColor8,
      paletteColor9,
      paletteColor10,
    ],
  },
  view: {
    stroke: null,
  },
};
