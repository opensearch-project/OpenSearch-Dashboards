/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieChartStyleControls } from './pie_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings, AxisRole } from '../types';
import { DEFAULT_OPACITY } from '../constants';

export const createPieSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: Partial<PieChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
) => {
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
      type: 'nominal',
      legend: styleOptions.addLegend
        ? { title: numericName, orient: styleOptions.legendPosition, symbolLimit: 10 }
        : null,
    },
  };

  const markLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: {
      type: 'arc',
      // TODO: make radius relative to the chart width/height
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

  const labelLayer = {
    mark: {
      type: 'text',
      limit: styleOptions.exclusive?.truncate ? styleOptions.exclusive?.truncate : 100,
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
