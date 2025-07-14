/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings } from '../types';
import { applyAxisStyling, getSchemaFromAxisMapping } from '../utils/utils';
import { createlabelLayer, enhanceStyle, addTransform } from './heatmap_chart_utils';

export const createHeatmapWithBin = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: Partial<HeatmapChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
) => {
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;

  const colorFieldColumn = axisColumnMappings?.color as any;

  const markLayer: any = {
    mark: {
      type: 'rect',
      tooltip: styles?.tooltipOptions?.mode !== 'hidden',
      stroke: 'white',
      strokeWidth: 1,
    },
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaFromAxisMapping(xAxis),
        bin: true,
        axis: applyAxisStyling(xAxis, styles?.grid?.xLines),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaFromAxisMapping(yAxis),
        bin: true,
        axis: applyAxisStyling(yAxis, styles?.grid?.yLines),
      },
      color: {
        field: colorFieldColumn?.column,
        type: getSchemaFromAxisMapping(colorFieldColumn),
        // TODO: a dedicate method to handle scale type is log especially in percentage mode
        bin: !styles.exclusive?.useCustomRanges
          ? { maxbins: Number(styles.exclusive?.maxNumberOfColors) }
          : false,
        scale: {
          type: styles.exclusive?.colorScaleType,
          scheme: styles.exclusive?.colorSchema,
          reverse: styles.exclusive?.reverseSchema,
        },
        legend: styles.addLegend
          ? {
              title: colorFieldColumn?.name || 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
    },
  };

  enhanceStyle(markLayer, styles, transformedData, colorFieldColumn?.column);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    transform: addTransform(styles, colorFieldColumn?.column),
    layer: [
      markLayer,
      createlabelLayer(styles, false, colorFieldColumn?.column, xAxis?.column, yAxis?.column),
    ].filter(Boolean),
  };
  return baseSpec;
};

export const createRegularHeatmap = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: Partial<HeatmapChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
) => {
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;

  const colorFieldColumn = axisColumnMappings?.color!;
  const markLayer: any = {
    mark: {
      type: 'rect',
      tooltip: styles?.tooltipOptions?.mode !== 'hidden',
      stroke: 'white',
      strokeWidth: 1,
    },
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaFromAxisMapping(xAxis),
        axis: applyAxisStyling(xAxis, false),
        // for regular heatmap, both x and y refer to categorical fields, we shall disable grid line for this case
      },
      y: {
        field: yAxis?.column,
        type: getSchemaFromAxisMapping(yAxis),
        axis: applyAxisStyling(yAxis, false),
      },
      color: {
        field: colorFieldColumn?.column,
        type: getSchemaFromAxisMapping(colorFieldColumn),
        // TODO: a dedicate method to handle scale type is log especially in percentage mode
        bin: !styles.exclusive?.useCustomRanges
          ? { maxbins: Number(styles.exclusive?.maxNumberOfColors) }
          : false,
        scale: {
          type: styles.exclusive?.colorScaleType,
          scheme: styles.exclusive?.colorSchema,
          reverse: styles.exclusive?.reverseSchema,
        },
        legend: styles.addLegend
          ? {
              title: colorFieldColumn?.name || 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
    },
  };

  enhanceStyle(markLayer, styles, transformedData, colorFieldColumn?.column);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    transform: addTransform(styles, colorFieldColumn?.column),
    layer: [
      markLayer,
      createlabelLayer(styles, true, colorFieldColumn?.column, xAxis?.column, yAxis?.column),
    ].filter(Boolean),
  };

  return baseSpec;
};
