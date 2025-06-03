/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisFormats } from '../utils/types';

export interface AxisConfig {
  orient?: string;
  scale?: string;
  labelAngle?: number;
  labelAlign?: string;
  labelBaseline?: string;
  title: any;
  format?: string; // property for date format
}

/**
 * Builds the axes configuration for a chart.
 *
 * Note: This axis configuration is currently tailored for specific use cases.
 * In the future, we plan to expand and generalize this function to accommodate
 * a wider range of chart types and axis configurations.
 * @param {any} dimensions - The dimensions of the data.
 * @param {AxisFormats} formats - The formatting information for axes.
 */

export const buildAxes = (dimensions: any, formats: AxisFormats): AxisConfig[] => {
  const { xAxisLabel, yAxisLabel } = formats;
  const xAxis: AxisConfig = {
    orient: 'bottom',
    scale: 'x',
    labelAngle: -90,
    labelAlign: 'right',
    labelBaseline: 'middle',
    title: xAxisLabel || '_all',
  };

  // Add date format if x dimension is a date type
  if (dimensions.x && dimensions.x.format && dimensions.x.format.id === 'date') {
    xAxis.format = '%Y-%m-%d %H:%M';
  }

  const yAxis: AxisConfig = {
    orient: 'left',
    scale: 'y',
    title: yAxisLabel ? yAxisLabel : dimensions.y && dimensions.y[0] ? dimensions.y[0].label : '',
  };

  return [xAxis, yAxis];
};
