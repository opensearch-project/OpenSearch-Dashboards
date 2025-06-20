/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieChartStyleControls } from './pie_vis_config';
import { VisColumn, VEGASCHEMA } from '../types';

export const createPieSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: Partial<PieChartStyleControls>
) => {
  const numericField = numericalColumns[0].column;
  const numericName = numericalColumns[0].name;
  const categoryField = categoricalColumns[0].column;

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
    mark: {
      type: 'arc',
      innerRadius: styleOptions.exclusive?.donut ? 30 : 0,
      radius: 130,
      tooltip: styleOptions?.addTooltip,
    },
  };

  const labelLayer = {
    mark: {
      type: 'text',
      limit: styleOptions.exclusive?.truncate ? styleOptions.exclusive?.truncate : 100,
      radius: 180,
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
      radius: 150,
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
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: transformedData },
    layer: [
      markLayer,
      styleOptions.exclusive?.showLabels ? labelLayer : null,
      styleOptions.exclusive?.showValues ? valueLayer : null,
    ].filter(Boolean),
    encoding: encodingBase,
  };

  return baseSpec;
};
