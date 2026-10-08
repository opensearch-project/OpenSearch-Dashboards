/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GaugeChartStyle } from './gauge_vis_config';
import { AxisRole, VisColumn } from '../types';
import { buildGaugeRenderData, createGaugeSeries } from './gauge_chart_utils';
import { convertTo2DArray } from '../utils/data_transformation';
import { createBaseConfig } from '../utils/echarts_spec';

export const createGauge = (
  transformedData: Array<Record<string, any>>,
  styleOptions: GaugeChartStyle,
  axisColumnMappings: { [AxisRole.Value]: VisColumn }
) => {
  const valueColumn = axisColumnMappings[AxisRole.Value];
  const tableData = convertTo2DArray()(transformedData);
  const baseConfig = createBaseConfig({})({
    data: transformedData,
    styles: styleOptions,
    axisColumnMappings,
  }).baseConfig;

  const gaugeData = buildGaugeRenderData({
    transformedData: tableData,
    styles: styleOptions,
    valueColumn,
  });

  return {
    spec: {
      ...baseConfig,
      dataset: { source: tableData },
      series: createGaugeSeries(gaugeData?.arc),
    },
    text: gaugeData?.text,
  };
};
