/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, Threshold, VisFieldType } from '../types';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';

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

  const shouldSwapAxes = (isXNumerical && isHorizontal) || (!isXNumerical && isHorizontal);

  if (shouldSwapAxes) {
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

export const darkenColor = (hex: string, degree = 1) => {
  // degree: 1 = 10%, 2 = 20%, etc.
  const factor = 1 - degree * 0.1;

  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.max(Math.floor(r * factor), 0);
  g = Math.max(Math.floor(g * factor), 0);
  b = Math.max(Math.floor(b * factor), 0);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const processThresholds = (thresholds: Threshold[]) => {
  const result: Threshold[] = [];

  for (let i = 0; i < thresholds.length; i++) {
    const current = thresholds[i];
    const next = thresholds[i + 1];

    // if the next threshold has the same value, use next
    if (next && next.value === current.value) continue;

    result.push(current);
  }

  return result;
};

export const NormalizeData = (data: number, start: number, end: number) => {
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
        name: `test${i}`,
        value: {
          gradient: 'linear',
          ...getGradientConfig(
            styleOptions.exclusive.orientation,
            styleOptions.exclusive.displayMode,
            isXaxisNumerical
          ),
          stops: [
            { offset: 0, color: thresholds[0].color },
            {
              offset: 1,
              color: darkenColor(thresholds[0]?.color, 2),
            },
          ],
        },
      });
      continue;
    }

    // collect stops up to current threshold
    const stops = thresholds.slice(0, i + 1).map((threshold) => {
      const offset = NormalizeData(threshold.value, start, end);
      return { offset, color: threshold.color };
    });

    result.push({
      name: `test${i}`,
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
