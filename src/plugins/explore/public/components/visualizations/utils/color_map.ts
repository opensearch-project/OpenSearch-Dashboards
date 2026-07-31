/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getColors } from '../theme/default_colors';

export type ColorMap = Record<string, string>;

export function buildColorMap(seriesNames: string[]): ColorMap {
  const palette = getColors().categories;
  const map: ColorMap = {};
  seriesNames.forEach((name, i) => {
    map[name] = palette[i % palette.length];
  });
  return map;
}
