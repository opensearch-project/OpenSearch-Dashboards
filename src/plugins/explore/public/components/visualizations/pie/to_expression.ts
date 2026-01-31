/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defaultPieChartStyles, PieChartStyle } from './pie_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings, AxisRole, AggregationType } from '../types';
import { DEFAULT_OPACITY } from '../constants';
import { getChartRender } from '../utils/utils';
import { pipe, createBaseConfig, assembleSpec } from '../utils/echarts_spec';
import { aggregate, convertTo2DArray, transform } from '../utils/data_transformation';
import { createPieSeries } from './pie_chart_utils';

export const createPieSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: PieChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  if (getChartRender() === 'echarts') {
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
          aggregationType: AggregationType.SUM, // TODO add aggregation in UI, temporarily use sum to aggregate data
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
  }

  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const thetaColumn = axisColumnMappings?.[AxisRole.SIZE];

  const numericField = thetaColumn?.column;
  const numericName = thetaColumn?.name;
  const categoryField = colorColumn?.column;
  const categoryName = colorColumn?.name;

  const encodingBase = {
    theta: {
      field: numericField,
      type: 'quantitative',
      stack: true,
    },
    color: {
      field: categoryField,
      // if color mapping is numerical, also treat it as nominal
      type: 'nominal',
      legend: styleOptions.addLegend
        ? {
            title: styleOptions.legendTitle,
            orient: styleOptions.legendPosition,
            symbolLimit: 10,
          }
        : null,
    },
  };

  const markLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: {
      type: 'arc',
      innerRadius: styleOptions.exclusive?.donut ? { expr: '7*stepSize' } : 0,
      radius: { expr: '9*stepSize' },
      tooltip: styleOptions?.tooltipOptions?.mode === 'all',
      padAngle: styleOptions.exclusive?.donut ? 0.01 : 0,
    },
    encoding: {
      opacity: {
        value: DEFAULT_OPACITY,
        condition: { param: 'highlight', value: 1, empty: false },
      },
      ...(styleOptions.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          { field: categoryField, type: 'nominal', title: categoryName },
          { field: numericField, type: 'quantitative', title: numericName },
        ],
      }),
    },
  };

  const hoverStateLayer = {
    mark: {
      type: 'arc',
      innerRadius: styleOptions.exclusive?.donut ? { expr: '7*stepSize' } : 0,
      radius: { expr: '9*stepSize + 0.35*stepSize' },
      padAngle: styleOptions.exclusive?.donut ? 0.01 : 0,
    },
    encoding: {
      opacity: {
        value: 0,
        condition: { param: 'highlight', value: DEFAULT_OPACITY / 3, empty: false },
      },
    },
  };

  const labelLayer = {
    mark: {
      type: 'text',
      limit: styleOptions.exclusive?.truncate
        ? styleOptions.exclusive?.truncate
        : defaultPieChartStyles.exclusive.truncate,
      radius: { expr: '12*stepSize' },
    },
    encoding: {
      text: {
        field: categoryField,
        type: 'nominal',
      },
    },
  };

  const valueLayer = {
    mark: {
      type: 'text',
      limit: 100,
      radius: { expr: '10*stepSize' },
    },
    encoding: {
      text: {
        field: numericField,
        type: 'nominal',
      },
    },
  };

  const baseSpec = {
    $schema: VEGASCHEMA,
    params: [{ name: 'stepSize', expr: 'min(width, height) / 20' }],
    data: { values: transformedData },
    layer: [
      markLayer,
      hoverStateLayer,
      styleOptions.exclusive?.showLabels ? labelLayer : null,
      styleOptions.exclusive?.showValues ? valueLayer : null,
    ].filter(Boolean),
    encoding: encodingBase,
    title: styleOptions.titleOptions?.show
      ? styleOptions.titleOptions?.titleName || `${numericName} by ${categoryName}`
      : undefined,
  };

  return baseSpec;
};
