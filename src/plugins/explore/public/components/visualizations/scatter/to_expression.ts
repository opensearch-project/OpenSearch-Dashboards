/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterChartStyleControls } from './scatter_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings } from '../types';
import { applyAxisStyling, getSchemaFromAxisMapping } from '../utils/utils';

export const createTwoMetricScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<ScatterChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;
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
        field: xAxis?.column,
        type: getSchemaFromAxisMapping(xAxis),
        axis: applyAxisStyling(xAxis, styles?.grid?.xLines),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaFromAxisMapping(yAxis),
        axis: applyAxisStyling(yAxis, styles?.grid?.yLines),
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
  styles: Partial<ScatterChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const categoryFields = axisColumnMappings?.color;
  const categoryNames = axisColumnMappings?.color?.name!;
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;
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
        field: xAxis?.column,
        type: getSchemaFromAxisMapping(xAxis),
        axis: applyAxisStyling(xAxis, styles?.grid?.xLines),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaFromAxisMapping(yAxis),
        axis: applyAxisStyling(yAxis, styles?.grid?.yLines),
      },
      color: {
        field: categoryFields?.column,
        type: getSchemaFromAxisMapping(categoryFields),
        legend: styles?.addLegend
          ? {
              title: categoryNames || 'Metrics',
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
  styles: Partial<ScatterChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const categoryFields = axisColumnMappings?.color;
  const categoryNames = axisColumnMappings?.color?.name!;
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;
  const numericalSize = axisColumnMappings?.size;
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
        field: xAxis?.column,
        type: getSchemaFromAxisMapping(xAxis),
        axis: applyAxisStyling(xAxis, styles?.grid?.xLines),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaFromAxisMapping(yAxis),
        axis: applyAxisStyling(yAxis, styles?.grid?.yLines),
      },
      color: {
        field: categoryFields,
        type: getSchemaFromAxisMapping(categoryFields),
        legend: styles?.addLegend
          ? {
              title: categoryNames || 'Metrics',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
      size: {
        field: numericalSize?.column,
        type: getSchemaFromAxisMapping(numericalSize),
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
