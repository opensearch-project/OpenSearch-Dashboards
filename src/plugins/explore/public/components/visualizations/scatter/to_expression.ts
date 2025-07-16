/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterChartStyleControls } from './scatter_vis_config';
import { VisColumn, AxisRole, VEGASCHEMA, AxisColumnMappings } from '../types';
import { applyAxisStyling, getAxisByRole } from '../utils/utils';

export const createTwoMetricScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<ScatterChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);
  const xField = xAxis?.field?.default?.column;
  const yField = yAxis?.field?.default?.column;
  const xName = xAxis?.title?.text || xAxis?.field?.default?.name;
  const yName = yAxis?.title?.text || yAxis?.field?.default?.name;

  const markLayer = {
    mark: {
      type: 'point',
      tooltip: styles?.tooltipOptions?.mode !== 'hidden',
      shape: styles?.exclusive?.pointShape,
      angle: styles?.exclusive?.angle,
      filled: styles?.exclusive?.filled,
    },
    encoding: {
      x: {
        field: xField,
        type: 'quantitative',
        axis: applyAxisStyling(xAxis, styles?.grid?.xLines),
      },
      y: {
        field: yField,
        type: 'quantitative',
        axis: applyAxisStyling(yAxis, styles?.grid?.yLines),
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          { field: xField, type: 'quantitative', title: xName },
          { field: yField, type: 'quantitative', title: yName },
        ],
      }),
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
  styles: Partial<ScatterChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const categoryFields = axisColumnMappings?.color?.column!;
  const categoryNames = axisColumnMappings?.color?.name!;
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);
  const xField = xAxis?.field?.default?.column;
  const yField = yAxis?.field?.default?.column;
  const xName = xAxis?.title?.text || xAxis?.field?.default?.name;
  const yName = yAxis?.title?.text || yAxis?.field?.default?.name;

  const markLayer = {
    mark: {
      type: 'point',
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
      shape: styles.exclusive?.pointShape,
      angle: styles.exclusive?.angle,
      filled: styles.exclusive?.filled,
    },
    encoding: {
      x: {
        field: xField,
        type: 'quantitative',
        axis: applyAxisStyling(xAxis, styles?.grid?.xLines),
      },
      y: {
        field: yField,
        type: 'quantitative',
        axis: applyAxisStyling(yAxis, styles?.grid?.yLines),
      },
      color: {
        field: categoryFields,
        type: 'nominal',
        legend: styles?.addLegend
          ? {
              title: categoryNames || 'Metrics',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          { field: xField, type: 'quantitative', title: xName },
          { field: yField, type: 'quantitative', title: yName },
          { field: categoryFields, type: 'nominal', title: categoryNames },
        ],
      }),
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
  styles: Partial<ScatterChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const categoryFields = axisColumnMappings?.color?.column!;
  const categoryNames = axisColumnMappings?.color?.name!;
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);
  const numericalSize = axisColumnMappings?.size;
  const xField = xAxis?.field?.default?.column;
  const yField = yAxis?.field?.default?.column;
  const sizeField = numericalSize?.column;
  const xName = xAxis?.title?.text || xAxis?.field?.default?.name;
  const yName = yAxis?.title?.text || yAxis?.field?.default?.name;
  const sizeName = numericalSize?.name;
  const markLayer = {
    mark: {
      type: 'point',
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
      shape: styles.exclusive?.pointShape,
      angle: styles.exclusive?.angle,
      filled: styles.exclusive?.filled,
    },
    encoding: {
      x: {
        field: xField,
        type: 'quantitative',
        axis: applyAxisStyling(xAxis, styles?.grid?.xLines),
      },
      y: {
        field: yField,
        type: 'quantitative',
        axis: applyAxisStyling(yAxis, styles?.grid?.yLines),
      },
      color: {
        field: categoryFields,
        type: 'nominal',
        legend: styles?.addLegend
          ? {
              title: categoryNames || 'Metrics',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
      size: {
        field: sizeField,
        type: 'quantitative',
        legend: styles?.addLegend
          ? {
              title: sizeName || 'Metrics',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          { field: xField, type: 'quantitative', title: xName },
          { field: yField, type: 'quantitative', title: yName },
          { field: categoryFields, type: 'nominal', title: categoryNames },
          { field: sizeField, type: 'quantitative', title: sizeName },
        ],
      }),
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
