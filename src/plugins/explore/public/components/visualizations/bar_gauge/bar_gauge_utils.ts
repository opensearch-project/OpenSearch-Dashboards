/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, Threshold, VisFieldType } from '../types';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { getColors } from '../theme/default_colors';

export const getBarOrientation = (
  styles: BarGaugeChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;
  const isHorizontal = styles?.exclusive.orientation === 'horizontal';
  const isXNumerical = xAxis?.schema === VisFieldType.Numerical;

  const axisStyle = {
    axis: { tickOpacity: 0, grid: false, title: null, labelAngle: 0, labelOverlap: 'greedy' },
  };
  const nullStyle = { axis: null };

  if (isHorizontal) {
    return {
      xAxis: yAxis,
      xAxisStyle: isXNumerical ? axisStyle : nullStyle,
      yAxis: xAxis,
      yAxisStyle: isXNumerical ? nullStyle : axisStyle,
    };
  }

  return {
    xAxis,
    xAxisStyle: isXNumerical ? nullStyle : axisStyle,
    yAxis,
    yAxisStyle: isXNumerical ? axisStyle : nullStyle,
  };
};

export const thresholdsToGradient = (thresholds: Threshold[]) => {
  return thresholds.map((threshold: Threshold, index) => {
    return {
      calculate: `${threshold.value}`,
      as: `threshold${index}`,
    };
  });
};

export const symbolOpposite = (orientationMode: string, symbol: string) => {
  if (orientationMode === 'horizontal') {
    return symbol === 'x' ? 'y' : 'x';
  }
  return symbol;
};

export const getGradientConfig = (
  orientationMode: string,
  displayMode: string,
  isXaxisNumerical: boolean
) => {
  if (
    (!isXaxisNumerical && orientationMode === 'horizontal') ||
    (isXaxisNumerical && orientationMode !== 'horizontal')
  ) {
    if (displayMode === 'gradient')
      return {
        x1: 0,
        y1: 0,
        x2: 1,
        y2: 0,
      };
  }

  if (displayMode === 'gradient')
    return {
      x1: 1,
      y1: 1,
      x2: 1,
      y2: 0,
    };
};

export const normalizeData = (data: number, start: number, end: number) => {
  if (start === end) return null;
  // normalize data value between start and end into 0–1 range
  return (data - start) / (end - start);
};

export const generateParams = (
  thresholds: Threshold[],
  styleOptions: BarGaugeChartStyle,
  isXaxisNumerical: boolean
) => {
  const result: any[] = [];

  for (let i = 0; i < thresholds.length; i++) {
    const start = thresholds[0].value;

    const end = thresholds[i].value;

    if (i === 0) {
      result.push({
        name: `gradient${i}`,
        value: thresholds[0]?.color,
      });
      continue;
    }

    const allStops = thresholds.slice(0, i + 1).map((t) => ({
      offset: normalizeData(t.value, start, end),
      color: t.color,
    }));

    const stops = [];
    for (let j = 0; j < allStops.length; j++) {
      const curr = allStops[j];
      const prev = allStops[j - 1];

      if (j === 0 || j === allStops.length - 1 || curr.color !== prev?.color) {
        stops.push(curr);
      }
    }

    if (stops.length > 2 && stops[stops.length - 1].color === stops[stops.length - 2].color) {
      stops.splice(stops.length - 2, 1);
    }

    result.push({
      name: `gradient${i}`,
      value: {
        gradient: 'linear',
        ...getGradientConfig(
          styleOptions.exclusive.orientation,
          styleOptions.exclusive.displayMode,
          isXaxisNumerical
        ),
        stops,
      },
    });
  }

  return result;
};

export const generateThresholds = (
  minBase: number,
  maxBase: number,
  thresholds: Threshold[],
  baseColor: string | undefined,
  valueStops: number[]
) => {
  const defaultColor = baseColor ?? getColors().statusGreen;

  const filteredThresholds = thresholds.filter((t) => t.value <= maxBase);
  const filteredValueStops = valueStops
    .filter((v) => v <= maxBase && v >= minBase)
    .sort((a, b) => a - b);
  const result: Threshold[] = [];
  let lastBelowIndex = -1;
  let lastThresholdValue: Threshold | undefined;

  for (let i = 0; i < filteredThresholds.length; i++) {
    const currentThreshold = filteredThresholds[i];

    // Handle duplicate values - keep the latest one
    if (lastThresholdValue && lastThresholdValue.value === currentThreshold.value) {
      result.pop();
    }

    result.push(currentThreshold);
    lastThresholdValue = currentThreshold;

    // Track last threshold below minBase
    if (minBase >= currentThreshold.value) {
      lastBelowIndex = i;
    }
  }

  if (lastBelowIndex !== -1) {
    result.splice(0, lastBelowIndex);
    result[0] = { ...result[0], value: minBase };
  } else {
    result.unshift({ value: minBase, color: defaultColor });
  }

  const valueResults: Threshold[] = [];
  if (filteredValueStops.length > 0 && result.length > 0) {
    const stops = [...new Set(filteredValueStops)];

    let thresholdIndex = 0;

    for (const stop of stops) {
      while (thresholdIndex < result.length - 1 && result[thresholdIndex + 1].value <= stop) {
        thresholdIndex++;
      }

      // Add valid threshold for this stop
      if (result[thresholdIndex].value <= stop) {
        valueResults.push({ value: stop, color: result[thresholdIndex].color });
      }
    }
  }

  return {
    mergedThresholds: result,
    valueThresholds: valueResults,
  };
};
