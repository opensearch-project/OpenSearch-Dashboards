/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterChartStyle } from './scatter_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings } from '../types';
import { applyAxisStyling, getSwappedAxisRole, getSchemaByAxis } from '../utils/utils';
import { createThresholdLayer } from '../style_panel/threshold/threshold_utils';
import { buildThresholdColorEncoding } from '../bar/bar_chart_utils';

const DEFAULT_POINTER_SIZE = 80;
const DEFAULT_STROKE_OPACITY = 0.65;

const hoverParams = [
  {
    name: 'hover',
    select: { type: 'point', on: 'mouseover' },
  },
];

const hoverStateEncoding = {
  opacity: {
    value: DEFAULT_STROKE_OPACITY,
    condition: { param: 'hover', value: 1, empty: false },
  },
  stroke: {
    value: null,
    condition: { param: 'hover', value: 'white', empty: false },
  },
  strokeWidth: {
    value: 0,
    condition: { param: 'hover', value: 2, empty: false },
  },
};

export const createTwoMetricScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: ScatterChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const colorEncodingLayer = buildThresholdColorEncoding(yAxis, styles);

  const markLayer = {
    params: hoverParams,
    mark: {
      type: 'point',
      tooltip: styles?.tooltipOptions?.mode !== 'hidden',
      shape: styles?.exclusive?.pointShape,
      angle: styles?.exclusive?.angle,
      filled: styles?.exclusive?.filled,
      size: DEFAULT_POINTER_SIZE,
      strokeOpacity: DEFAULT_STROKE_OPACITY,
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
      ...hoverStateEncoding,
      color: styles?.useThresholdColor ? colorEncodingLayer : [],
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

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    layer: [markLayer, thresholdLayer].filter(Boolean),
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
  styles: ScatterChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const colorColumn = axisColumnMappings?.color;
  const categoryFields = axisColumnMappings?.color?.column!;
  const categoryNames = axisColumnMappings?.color?.name!;
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);
  const markLayer = {
    params: hoverParams,
    mark: {
      type: 'point',
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
      shape: styles.exclusive?.pointShape,
      angle: styles.exclusive?.angle,
      filled: styles.exclusive?.filled,
      size: DEFAULT_POINTER_SIZE,
      strokeOpacity: DEFAULT_STROKE_OPACITY,
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
        legend: styles?.addLegend
          ? {
              title: categoryNames || 'Metrics',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
      ...hoverStateEncoding,
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

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);

  const baseSpec = {
    $schema: VEGASCHEMA,
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: transformedData },
    layer: [markLayer, thresholdLayer].filter(Boolean),
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
  styles: ScatterChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const colorColumn = axisColumnMappings?.color;
  const categoryFields = axisColumnMappings?.color?.column!;
  const categoryNames = axisColumnMappings?.color?.name!;
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const numericalSize = axisColumnMappings?.size;
  const markLayer = {
    params: hoverParams,
    mark: {
      type: 'point',
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
      shape: styles.exclusive?.pointShape,
      angle: styles.exclusive?.angle,
      filled: styles.exclusive?.filled,
      size: DEFAULT_POINTER_SIZE,
      strokeOpacity: DEFAULT_STROKE_OPACITY,
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
        type: getSchemaByAxis(numericalSize),
        legend: styles?.addLegend
          ? {
              title: numericalSize?.name || 'Metrics',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
      ...hoverStateEncoding,
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

  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);

  const baseSpec = {
    $schema: VEGASCHEMA,
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: transformedData },
    layer: [markLayer, thresholdLayer].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName ||
        `${xAxis?.name} with ${yAxis?.name} by ${categoryNames} (Size shows ${numericalSize?.name})`
      : undefined,
  };
  return baseSpec;
};
