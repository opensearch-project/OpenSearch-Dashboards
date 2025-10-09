/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, Threshold } from '../types';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';

export const getBarOrientation = (
  styles: BarGaugeChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;

  if (styles?.exclusive.orientation === 'horizontal') {
    return {
      xAxis: yAxis,
      xAxisStyle: { axis: null },
      yAxis: xAxis,
      yAxisStyle: { axis: { tickOpacity: 0, grid: false, title: null, labelAngle: 0 } },
    };
  }

  return {
    xAxis,
    xAxisStyle: { axis: { tickOpacity: 0, grid: false, title: null, labelAngle: 0 } },
    yAxis,
    yAxisStyle: { axis: null },
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

export const getDisplayMode = (
  orientationMode: string,
  displayMode: string,
  threshold: Threshold,
  nextColor: string
) => {
  if (orientationMode === 'horizontal') {
    if (displayMode === 'gradient')
      return {
        color: {
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 0,
          gradient: 'linear',
          stops: [
            { offset: 0, color: `${threshold.color}` },
            {
              offset: 1,
              color: nextColor,
            },
          ],
        },
      };
    if (displayMode === 'stack') return { color: threshold.color };
  }

  if (displayMode === 'gradient')
    return {
      color: {
        x1: 1,
        y1: 1,
        x2: 1,
        y2: 0,
        gradient: 'linear',
        stops: [
          { offset: 0, color: `${threshold.color}` },
          {
            offset: 1,
            color: nextColor,
          },
        ],
      },
    };
  if (displayMode === 'stack') return { color: threshold.color };
};
