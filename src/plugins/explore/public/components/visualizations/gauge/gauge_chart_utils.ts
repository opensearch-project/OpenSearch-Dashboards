/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Threshold } from '../types';

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

export function generateArcExpression(startValue: number, endValue: number, fillColor: string) {
  return {
    mark: {
      type: 'arc',
      y: { expr: 'centerY' },
      x: { expr: 'centerX' },
      radius: { expr: 'innerRadius * 0.98' },
      radius2: { expr: 'innerRadius * 0.96' },
      theta: {
        expr: `theta_single_arc + (theta2_single_arc - theta_single_arc) * (( ${startValue} - minValue) / (maxValue - minValue))`,
      },
      theta2: {
        expr: `theta_single_arc + (theta2_single_arc - theta_single_arc) * (( ${endValue} - minValue) / (maxValue - minValue))`,
      },
      fill: fillColor,
    },
  };
}
