/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieChartStyle } from './pie_vis_config';
import { AxisRole, VisColumn, AggregationType } from '../types';
import { pipe, createBaseConfig, assembleSpec } from '../utils/echarts_spec';
import { aggregate, convertTo2DArray, transform } from '../utils/data_transformation';
import { createPieSeries } from './pie_chart_utils';

export const createPieSpec = (
  transformedData: Array<Record<string, any>>,
  styleOptions: PieChartStyle,
  axisColumnMappings: { [AxisRole.SIZE]: VisColumn; [AxisRole.COLOR]: VisColumn }
) => {
  const colorCol = axisColumnMappings[AxisRole.COLOR];
  const sizeCol = axisColumnMappings[AxisRole.SIZE];

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);

  const defaultTitle = `${sizeCol.name} by ${colorCol.name}`;

  const result = pipe(
    transform(
      aggregate({
        groupBy: colorCol.column,
        field: sizeCol.column,
        aggregationType: AggregationType.SUM,
      }),
      convertTo2DArray(allColumns)
    ),
    createBaseConfig({ title: defaultTitle, legend: { show: styleOptions.addLegend } }),
    createPieSeries({
      styles: styleOptions,
      cateField: colorCol.column,
      valueField: sizeCol.column,
    }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisColumnMappings,
  });

  return result.spec;
};
