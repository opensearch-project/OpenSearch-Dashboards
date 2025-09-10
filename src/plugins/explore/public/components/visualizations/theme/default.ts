/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getColors } from './default_colors';
import { Config } from './config';

const colorPalettes = getColors();

export const defaultTheme: Config = {
  arc: { fill: colorPalettes.categories[0] },
  area: { fill: colorPalettes.categories[0] },
  // path: { stroke: colorPalettes.categories[0] },
  rect: { fill: colorPalettes.categories[0] },
  // shape: { stroke: colorPalettes.categories[0] },
  // symbol: { stroke: colorPalettes.categories[0] },
  circle: { fill: colorPalettes.categories[0] },
  bar: { fill: colorPalettes.categories[0] },
  line: { stroke: colorPalettes.categories[0] },
  point: { fill: colorPalettes.categories[0], filled: true },
  text: { fill: colorPalettes.text },
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
    gridColor: colorPalettes.grid,
    tickColor: colorPalettes.grid,
    labelColor: colorPalettes.text,
    domainColor: colorPalettes.grid,
    domain: true,
    grid: true,
  },
  range: {
    category: colorPalettes.categories,
  },
  view: {
    stroke: null,
  },
};
