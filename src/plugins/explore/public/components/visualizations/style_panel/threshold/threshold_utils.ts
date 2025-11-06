/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getColors, DEFAULT_GREY } from '../../theme/default_colors';
import {
  Threshold,
  ThresholdLine,
  ColorSchemas,
  RangeValue,
  ThresholdMode,
  ThresholdOptions,
} from '../../types';

export function mergeThresholdsWithBase(
  minBase: number,
  maxBase: number,
  baseColor?: string,
  validThresholds?: Threshold[],
  targetValue?: number
): { textColor: string; mergedThresholds: Threshold[] } {
  const defaultColor = baseColor ?? getColors().statusGreen;

  // Handle empty thresholds
  if (!validThresholds || validThresholds.length === 0) {
    return {
      textColor: !targetValue || targetValue < minBase ? DEFAULT_GREY : defaultColor,
      mergedThresholds: [{ value: minBase, color: defaultColor }],
    };
  }

  let lastBelowIndex = -1;
  let textColor: string | undefined;

  for (let i = 0; i < validThresholds.length; i++) {
    const { value, color } = validThresholds[i];

    if (value <= minBase) lastBelowIndex = i;
    if (targetValue !== undefined && targetValue >= value) textColor = color;
  }

  // Default to baseColor if no textColor was found
  textColor ??= defaultColor;

  // If found a threshold below minBase, update thresholds
  if (lastBelowIndex !== -1) {
    const updated = validThresholds.slice(lastBelowIndex);
    updated[0] = { ...updated[0], value: minBase };
    return { textColor, mergedThresholds: updated.filter((t) => t.value <= maxBase) };
  }

  // Otherwise, insert a new base threshold at the beginning
  return {
    textColor,
    mergedThresholds: [{ value: minBase, color: defaultColor }, ...validThresholds].filter(
      (t) => t.value <= maxBase
    ),
  };
}

/**
 * Locate which range the target value falls into
 * @param thresholds Array of numeric values that combines thresholds and minBase
 * @param targetValue The value that will be displayed in gauge
 * @returns threshold
 */
export function locateThreshold(thresholds: Threshold[], targetValue: number): Threshold | null {
  // Return null if target value is below the minimum range
  if (thresholds.length < 1 || targetValue < thresholds[0].value) return null;

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

export const transformToThreshold = (schema: ColorSchemas, ranges?: RangeValue[]) => {
  if (!ranges || ranges.length === 0) {
    return [];
  }
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
};

export const transformThresholdLinesToThreshold = (
  thresholdLines: ThresholdLine[]
): Threshold[] => {
  if (thresholdLines.length === 0) {
    return [];
  }
  const combinedArray = thresholdLines.map((line) => {
    return {
      value: line.value,
      color: line.color,
    };
  });
  return combinedArray.sort((a, b) => a.value - b.value);
};

/**
 * Get stroke dash array for different line styles
 * @param style The line style ('dashed', 'dot-dashed', or 'full')
 * @returns The stroke dash array or undefined for solid lines
 */
export const getStrokeDash = (style: ThresholdMode): number[] | undefined => {
  switch (style) {
    case ThresholdMode.Dashed:
      return [5, 5];
    case ThresholdMode.DotDashed:
      return [5, 5, 1, 5];
    case ThresholdMode.Solid:
    default:
      return undefined;
  }
};

/**
 * Create threshold line layers for any chart type
 * @param thresholdLines The threshold lines array
 * @param tooltipMode The tooltip mode ('all', 'hidden', etc.)
 * @returns Array of threshold layer configurations or null if disabled
 */

export const createThresholdLayer = (
  thresholdOptions?: ThresholdOptions,
  barEncodingDefault?: 'x' | 'y'
): any => {
  const activeThresholds = thresholdOptions?.thresholds ?? [];
  const activeThresholdStyles = thresholdOptions?.thresholdStyle ?? ThresholdMode.Off;

  if (activeThresholdStyles === ThresholdMode.Off || activeThresholds.length === 0) {
    return null;
  }

  const encodingChannel = barEncodingDefault ?? 'y';

  const layers = activeThresholds.map((threshold) => {
    const markType = 'rule';
    const markConfig: any = {
      color: threshold.color,
      strokeWidth: 1,
    };

    // Apply stroke dash based on threshold style
    markConfig.strokeDash = getStrokeDash(activeThresholdStyles);

    // Create the base layer
    const layer: any = {
      mark: {
        type: markType,
        ...markConfig,
      },
      encoding: {
        [encodingChannel]: {
          datum: threshold.value,
          type: 'quantitative',
        },
      },
    };

    return layer;
  });

  // Return a layer object with the layers array
  return layers.length > 0 ? { layer: layers } : null;
};

export const getMaxAndMinBase = (
  minNumber: number,
  maxNumber: number,
  min?: number,
  max?: number,
  calculatedValue?: number
) => {
  const minBase = min ?? Math.min(minNumber, 0);
  const maxBase = max ?? Math.max(maxNumber, calculatedValue ?? 0);
  return {
    minBase,
    maxBase,
  };
};
