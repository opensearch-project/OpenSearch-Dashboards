/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterChartStyleControls } from './scatter_vis_config';
import { VisColumn, AxisRole, VEGASCHEMA } from '../types';
import { applyAxisStyling, getAxisByRole } from '../utils/utils';

export const createTwoMetricScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<ScatterChartStyleControls>
): any => {
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);
  const markLayer = {
    mark: {
      type: 'point',
      tooltip: styles.addTooltip,
      shape: styles?.exclusive?.pointShape,
      angle: styles?.exclusive?.angle,
      filled: styles?.exclusive?.filled,
    },
    encoding: {
      x: {
        field: xAxis?.field?.default.column,
        type: 'quantitative',
        axis: applyAxisStyling(xAxis),
      },
      y: {
        field: yAxis?.field?.default.column,
        type: 'quantitative',
        axis: applyAxisStyling(yAxis),
      },
    },
  };

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    layer: [markLayer].filter(Boolean),
  };
  return baseSpec;
};

export const createTwoMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<ScatterChartStyleControls>
): any => {
  const categoryFields = categoricalColumns?.map((item) => item.column);
  const categoryNames = categoricalColumns?.map((item) => item.name);
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);
  const markLayer = {
    mark: {
      type: 'point',
      tooltip: styles.addTooltip,
      shape: styles?.exclusive?.pointShape,
      angle: styles?.exclusive?.angle,
      filled: styles?.exclusive?.filled,
    },
    encoding: {
      x: {
        field: xAxis?.field?.default.column,
        type: 'quantitative',
        axis: applyAxisStyling(xAxis),
      },
      y: {
        field: yAxis?.field?.default.column,
        type: 'quantitative',
        axis: applyAxisStyling(yAxis),
      },
      color: {
        field: categoryFields[0],
        type: 'nominal',
        legend: styles?.addLegend
          ? {
              title: categoryNames[0] || 'Metrics',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
    },
  };

  const baseSpec = {
    $schema: VEGASCHEMA,
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: transformedData },
    layer: [markLayer].filter(Boolean),
  };
  return baseSpec;
};

export const createThreeMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<ScatterChartStyleControls>
): any => {
  const categoryFields = categoricalColumns.map((item) => item.column);
  const categoryNames = categoricalColumns.map((item) => item.name);
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);
  const numericalSize = numericalColumns.filter(
    (f) => f.column !== xAxis?.field?.default.column && f.column !== yAxis?.field?.default.column
  )[0];
  const markLayer = {
    mark: {
      type: 'point',
      tooltip: styles.addTooltip,
      shape: styles?.exclusive?.pointShape,
      angle: styles?.exclusive?.angle,
      filled: styles?.exclusive?.filled,
    },
    encoding: {
      x: {
        field: xAxis?.field?.default.column,
        type: 'quantitative',
        axis: applyAxisStyling(xAxis),
      },
      y: {
        field: yAxis?.field?.default.column,
        type: 'quantitative',
        axis: applyAxisStyling(yAxis),
      },
      color: {
        field: categoryFields[0],
        type: 'nominal',
        legend: styles?.addLegend
          ? {
              title: categoryNames[0] || 'Metrics',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
      size: {
        field: numericalSize.column,
        type: 'quantitative',
        legend: styles?.addLegend
          ? {
              title: numericalSize?.name || 'Metrics',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
    },
  };

  const baseSpec = {
    $schema: VEGASCHEMA,
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: transformedData },
    layer: [markLayer].filter(Boolean),
  };
  return baseSpec;
};
