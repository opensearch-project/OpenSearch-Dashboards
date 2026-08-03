/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieChartStyle } from './pie_vis_config';
import { AxisRole, VisColumn, AggregationType } from '../types';
import { pipe, createBaseConfig, assembleSpec } from '../utils/echarts_spec';
import { aggregate, transform } from '../utils/data_transformation';
import { createPieSeries } from './pie_chart_utils';

export const createPieSpec = (
  transformedData: Array<Record<string, any>>,
  styleOptions: PieChartStyle,
  axisColumnMappings: { [AxisRole.SIZE]: VisColumn; [AxisRole.COLOR]: VisColumn },
  allData?: Array<Record<string, any>>
) => {
  const colorCol = axisColumnMappings[AxisRole.COLOR];
  const sizeCol = axisColumnMappings[AxisRole.SIZE];

  const result = pipe(
    transform(
      aggregate({
        groupBy: colorCol.column,
        field: sizeCol.column,
        aggregationType: AggregationType.SUM,
      })
    ),
    createBaseConfig({ legend: { show: false } }),
    createPieSeries({
      styles: styleOptions,
      cateField: colorCol.column,
      valueField: sizeCol.column,
      allData,
    }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisColumnMappings,
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};
