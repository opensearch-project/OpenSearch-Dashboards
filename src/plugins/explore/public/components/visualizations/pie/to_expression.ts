/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieChartStyle } from './pie_vis_config';
import { AxisColumnMappings, AxisRole, AggregationType } from '../types';
import { pipe, createBaseConfig, assembleSpec } from '../utils/echarts_spec';
import { aggregate, convertTo2DArray, transform } from '../utils/data_transformation';
import { createPieSeries } from './pie_chart_utils';

export const createPieSpec = (
  transformedData: Array<Record<string, any>>,
  styleOptions: PieChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR]?.column;
  const thetaColumn = axisColumnMappings?.[AxisRole.SIZE]?.column;

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  if (!colorColumn || !thetaColumn) {
    throw Error('Missing color or theta config for pie chart');
  }

  const defaultTitle = `${axisColumnMappings?.[AxisRole.SIZE]?.name} by ${
    axisColumnMappings?.[AxisRole.COLOR]?.name
  }`;

  const result = pipe(
    transform(
      aggregate({
        groupBy: colorColumn,
        field: thetaColumn,
        aggregationType: AggregationType.SUM,
      }),
      convertTo2DArray(allColumns)
    ),
    createBaseConfig({ title: defaultTitle, legend: { show: styleOptions.addLegend } }),
    createPieSeries({ styles: styleOptions, cateField: colorColumn, valueField: thetaColumn }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisColumnMappings: axisColumnMappings ?? {},
  });

  return result.spec;
};
