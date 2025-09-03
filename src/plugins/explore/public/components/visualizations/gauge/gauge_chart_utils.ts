/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThresholdRangeValue } from '../types';

/**
 * Merge custom ranges with min base.
 * @param minBase Minimum value for the gauge scale
 * @param baseColor Default color for the base range
 * @param thresholdValues  threshold values with colors
 * @returns Array of merged threshold ranges
 */

export function mergeCustomRangesWithBase(
  minBase: number,
  maxBase: number,
  baseColor: string,
  thresholdValues?: ThresholdRangeValue[]
) {
  // only display threhold ranges under the max base and above min base
  const validThresholds =
    thresholdValues?.filter((range) => range.value >= minBase && range.value <= maxBase) || [];

  // Return existing thresholds if minBase already exists as a threshold
  if (validThresholds.some((range) => range.value === minBase)) {
    return validThresholds;
  }

  const aboveMin = validThresholds.filter((range) => range.value > minBase);
  return [{ value: minBase, color: baseColor }, ...aboveMin];
}

/**
 * Locate which range the target value falls into
 * @param mergedRanges Array of numeric values that combines thresholds and minBase
 * @param targetValue The value that will be displayed in gauge
 * @returns Index
 */
export function locateRange(mergedRanges: ThresholdRangeValue[], targetValue: number) {
  // Return -1 if target value is below the minimum range
  if (targetValue < mergedRanges[0].value) return -1;

  // Iterate through ranges to find where target value belongs
  for (let i = 0; i < mergedRanges.length - 1; i++) {
    const currentValue = mergedRanges[i].value || 0;
    const nextValue = mergedRanges[i + 1].value;
    if (targetValue >= currentValue && targetValue < nextValue) {
      return i;
    }
  }
  // Fallback: return the last range index if no match found
  return mergedRanges.length - 1;
}

export function generateRanges(mergedRanges: ThresholdRangeValue[], maxValue: number) {
  const ranges = [];

  for (let i = 0; i < mergedRanges.length; i++) {
    const currentValue = mergedRanges[i].value;

    const nextValue = i < mergedRanges.length - 1 ? mergedRanges[i + 1].value : maxValue;

    ranges.push({ min: currentValue, max: nextValue, color: mergedRanges[i].color });
  }

  return ranges;
}

export function generateArcExpression(startAngle: number, endAngle: number, fillColor: string) {
  return {
    type: 'arc',
    encode: {
      enter: {
        startAngle: {
          scale: 'gaugeScale',
          signal: `${startAngle}`,
        },
      },
      update: {
        x: {
          signal: 'centerX',
        },
        y: {
          signal: 'centerY',
        },
        innerRadius: {
          signal: 'innerRadius*0.95',
        },
        outerRadius: {
          signal: 'innerRadius*0.98',
        },
        endAngle: {
          scale: 'gaugeScale',
          signal: `${endAngle}`,
        },
        fill: {
          value: fillColor,
        },
      },
    },
  };
}
