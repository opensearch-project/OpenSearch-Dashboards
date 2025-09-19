/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterChartStyleControls } from './scatter_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings } from '../types';
import { applyAxisStyling, getSwappedAxisRole, getSchemaByAxis, findLegend } from '../utils/utils';

export const createTwoMetricScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<ScatterChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

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
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling(xAxis, xAxisStyle),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling(yAxis, yAxisStyle),
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
        ],
      }),
    },
  };

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    layer: [markLayer].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${xAxis?.name} with ${yAxis?.name}`
      : undefined,
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
  const colorColumn = axisColumnMappings?.color;
  const categoryFields = axisColumnMappings?.color?.column!;
  const categoryNames = axisColumnMappings?.color?.name!;
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const colorLegend = findLegend(styles, 'color');
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
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling(xAxis, xAxisStyle),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling(yAxis, yAxisStyle),
      },
      color: {
        field: categoryFields,
        type: getSchemaByAxis(colorColumn),
        legend: colorLegend?.show
          ? {
              title: colorLegend.title || categoryNames,
              orient: colorLegend.position,
              symbolLimit: 10,
            }
          : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
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
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${xAxis?.name} with ${yAxis?.name} by ${categoryNames}`
      : undefined,
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
  const colorColumn = axisColumnMappings?.color;
  const categoryFields = axisColumnMappings?.color?.column!;
  const categoryNames = axisColumnMappings?.color?.name!;
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const colorLegend = findLegend(styles, 'color');
  const sizeLegend = findLegend(styles, 'size');
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
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling(xAxis, xAxisStyle),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling(yAxis, yAxisStyle),
      },
      color: {
        field: categoryFields,
        type: getSchemaByAxis(colorColumn),
        legend: colorLegend?.show
          ? {
              title: colorLegend.title || categoryNames,
              orient: colorLegend.position,
              symbolLimit: 10,
            }
          : null,
      },
      ...(numericalSize &&
        sizeLegend?.show && {
          size: {
            field: numericalSize.column,
            type: getSchemaByAxis(numericalSize),
            legend: {
              title: sizeLegend.title || numericalSize.name,
              orient: sizeLegend.position,
              symbolLimit: 10,
            },
          },
        }),
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
          { field: categoryFields, type: 'nominal', title: categoryNames },
          { field: numericalSize?.column, type: 'quantitative', title: numericalSize?.name },
        ],
      }),
    },
  };

  const baseSpec = {
    $schema: VEGASCHEMA,
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: transformedData },
    layer: [markLayer].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName ||
        `${xAxis?.name} with ${yAxis?.name} by ${categoryNames} (Size shows ${numericalSize?.name})`
      : undefined,
  };
  return baseSpec;
};
