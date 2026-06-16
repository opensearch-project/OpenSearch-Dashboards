/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieChartStyle } from './pie_vis_config';
import { AxisRole, VisColumn, AggregationType } from '../types';
import { pipe, createBaseConfig, assembleSpec, collectPieLegend } from '../utils/echarts_spec';
import { aggregate, transform } from '../utils/data_transformation';
import { createPieSeries } from './pie_chart_utils';
import { ColorMap } from '../utils/color_map';

export const createPieSpec = (
  transformedData: Array<Record<string, any>>,
  styleOptions: PieChartStyle,
  axisColumnMappings: { [AxisRole.SIZE]: VisColumn; [AxisRole.COLOR]: VisColumn },
  onLegend?: (legend: ColorMap) => void
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
    }),
    collectPieLegend(onLegend),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisColumnMappings,
  });

  return result.spec;
};
