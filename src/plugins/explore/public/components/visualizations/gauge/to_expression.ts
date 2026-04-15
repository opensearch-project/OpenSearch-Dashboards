/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GaugeChartStyle } from './gauge_vis_config';
import { AxisRole, AxisColumnMappings } from '../types';
import { createGaugeSeries, assembleGaugeSpec } from './gauge_chart_utils';
import { pipe, createBaseConfig } from '../utils/echarts_spec';
import { convertTo2DArray, transform } from '../utils/data_transformation';

export const createGauge = (
  transformedData: Array<Record<string, any>>,
  styleOptions: GaugeChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const valueColumn = axisColumnMappings?.[AxisRole.Value];
  if (!valueColumn?.column) {
    throw Error('Missing value for metric chart');
  }

  const result = pipe(
    transform(convertTo2DArray()),
    createBaseConfig({ title: '' }),
    createGaugeSeries({ styles: styleOptions, seriesFields: [valueColumn.column] }),
    assembleGaugeSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisColumnMappings: axisColumnMappings ?? {},
  });
  return result.spec;
};
