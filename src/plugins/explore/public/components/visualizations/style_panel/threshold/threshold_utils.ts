/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Threshold, ThresholdLine, ColorSchemas, RangeValue } from '../../types';

/**
 * Merge custom ranges with min base.
 * @param minBase Minimum value for the gauge scale
 * @param baseColor Default color for the base range
 * @param thresholds  threshold values with colors
 * @returns Array of merged threshold ranges
 */

export function mergeThresholdsWithBase(
  minBase: number,
  maxBase: number,
  baseColor: string,
  thresholds?: Threshold[]
) {
  // only display threshold ranges under the max base and above min base
  const validThresholds =
    thresholds?.filter((range) => range.value >= minBase && range.value <= maxBase) || [];

  // Return existing thresholds if minBase already exists as a threshold
  if (validThresholds.some((range) => range.value === minBase)) {
    return validThresholds;
  }

  const aboveMin = validThresholds.filter((range) => range.value > minBase);
  return [{ value: minBase, color: baseColor }, ...aboveMin];
}

/**
 * Locate which range the target value falls into
 * @param thresholds Array of numeric values that combines thresholds and minBase
 * @param targetValue The value that will be displayed in gauge
 * @returns threshold
 */
export function locateThreshold(thresholds: Threshold[], targetValue: number): Threshold | null {
  // Return null if target value is below the minimum range
  if (targetValue < thresholds[0].value) return null;

  // Iterate through ranges to find where target value belongs
  for (let i = 0; i < thresholds.length - 1; i++) {
    const currentValue = thresholds[i].value || 0;
    const nextValue = thresholds[i + 1].value;
    if (targetValue >= currentValue && targetValue < nextValue) {
      return thresholds[i];
    }
  }
  // Fallback: return the last range index if no match found
  return thresholds[thresholds.length - 1];
}

export function generateRanges(thresholds: Threshold[], maxValue: number) {
  const ranges = [];

  for (let i = 0; i < thresholds.length; i++) {
    const currentValue = thresholds[i].value;

    if (currentValue > maxValue) return ranges;
    const nextValue = i < thresholds.length - 1 ? thresholds[i + 1].value : maxValue;

    ranges.push({ min: currentValue, max: nextValue, color: thresholds[i].color });
  }

  return ranges;
}

export const Colors: Record<ColorSchemas, any> = {
  [ColorSchemas.BLUES]: {
    baseColor: '#9ecae1',
    colors: [
      '#c6dbef',
      '#9ecae1',
      '#6baed6',
      '#4292c6',
      '#2171b5',
      '#08519c',
      '#08306b',
      '#041f45',
    ],
  },

  [ColorSchemas.GREENS]: {
    baseColor: '#a1d99b',
    colors: [
      '#c7e9c0',
      '#a1d99b',
      '#74c476',
      '#41ab5d',
      '#238b45',
      '#006d2c',
      '#00441b',
      '#003214',
    ],
  },

  [ColorSchemas.GREYS]: {
    baseColor: '#d9d9d9',
    colors: [
      '#f0f0f0',
      '#d9d9d9',
      '#bdbdbd',
      '#969696',
      '#737373',
      '#525252',
      '#252525',
      '#111111',
    ],
  },

  [ColorSchemas.REDS]: {
    baseColor: '#fc9272',
    colors: [
      '#fcbba1',
      '#fc9272',
      '#fb6a4a',
      '#ef3b2c',
      '#cb181d',
      '#a50f15',
      '#67000d',
      '#3b0008',
    ],
  },

  [ColorSchemas.GREENBLUE]: {
    baseColor: '#a8ddb5',
    colors: [
      '#ccebc5',
      '#a8ddb5',
      '#7bccc4',
      '#4eb3d3',
      '#2b8cbe',
      '#0868ac',
      '#084081',
      '#042f5f',
    ],
  },

  [ColorSchemas.YELLOWORANGE]: {
    baseColor: '#fed976',
    colors: [
      '#ffffb2',
      '#fed976',
      '#feb24c',
      '#fd8d3c',
      '#f03b20',
      '#bd0026',
      '#800026',
      '#4d0019',
    ],
  },
};

export const transformToThreshold = (ranges: RangeValue[], schema: ColorSchemas) => {
  if (ranges.length === 0) {
    return [];
  } else {
    // if min is undefined and max > min, then discard this range
    const combinedArray = ranges.reduce<number[]>((acc, val) => {
      if (val.min === undefined || (val.max && val.max < val.min)) return acc;
      acc.push(val.min);
      if (val.max) acc.push(val.max);
      return acc;
    }, []);

    const uniqueArray = Array.from(new Set(combinedArray)).sort((a, b) => a - b);

    const result = uniqueArray.map((num, i) => ({
      value: num,
      color: Colors[schema].colors[i % 6],
    }));
    return result;
  }
};

export const transformThresholdLinesToThreshold = (
  thresholdLines: ThresholdLine[]
): Threshold[] => {
  if (thresholdLines.length === 0) {
    return [];
  } else {
    // if min is undefined and max > min, then discard this range
    const combinedArray = thresholdLines.map((line) => {
      return {
        value: line.value,
        color: line.color,
      };
    });
    return combinedArray.sort((a, b) => a.value - b.value);
  }
};
