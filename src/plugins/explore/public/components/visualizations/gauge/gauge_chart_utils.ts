/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThresholdRangeValue, AggregationType } from '../types';

export function mergeCustomRangesWithBase(
  minBase: number,
  baseColor: string,
  customRanges?: ThresholdRangeValue[]
) {
  const insertIndex = customRanges?.findIndex((range) => range.value > minBase);

  // Return base range if no threshold exist or minBase exceeds all threshold values
  if (!customRanges?.length || insertIndex === -1) return [{ value: minBase, color: baseColor }];

  // Return existing thresholds if minBase already exists as a threshold
  const hasValue = customRanges.some((range) => range.value === minBase);
  if (hasValue) return customRanges;

  // Insert base range and exclude thresholds below minBase
  return [{ value: minBase, color: baseColor }, ...customRanges.slice(insertIndex)];
}

export function locateRange(mergedRanges: ThresholdRangeValue[], targetValue: number) {
  if (targetValue < mergedRanges[0].value) return -1;
  for (let i = 0; i < mergedRanges.length; i++) {
    const currentValue = mergedRanges[i].value || 0;
    const nextValue = i < mergedRanges.length - 1 ? mergedRanges[i + 1].value : Infinity;

    if (targetValue >= currentValue && targetValue < nextValue) {
      return i;
    }
  }
  return mergedRanges.length - 1;
}

export function generateRanges(customRanges: ThresholdRangeValue[], maxValue: number) {
  const ranges = [];

  for (let i = 0; i < customRanges.length; i++) {
    const currentValue = customRanges[i].value;
    if (currentValue > maxValue) return ranges;

    const nextValue =
      i < customRanges.length - 1 ? Math.min(customRanges[i + 1].value, maxValue) : maxValue;

    ranges.push({ min: currentValue, max: nextValue, color: customRanges[i].color });
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

export function calculateAggregation(
  type: AggregationType,
  transformedData: Array<Record<string, any>>,
  numericFields: string
) {
  if (transformedData.length === 1) return transformedData[0]?.[numericFields];
  switch (type) {
    case AggregationType.SUM:
      return transformedData.reduce((acc, val) => acc + val[numericFields], 0);
    case AggregationType.MEAN:
      return (
        transformedData.reduce((acc, val) => acc + val[numericFields], 0) / transformedData.length
      );
    case AggregationType.MAX:
      return transformedData.reduce((acc, val) => Math.max(acc, val[numericFields]), 0);
    case AggregationType.MIN:
      return transformedData.reduce((acc, val) => Math.min(acc, val[numericFields]), Infinity);
    default:
      return transformedData.reduce((acc, val) => acc + val[numericFields], 0);
  }
}
