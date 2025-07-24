/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings } from '../types';
import { applyAxisStyling, getSwappedAxisRole, getSchemaByAxis } from '../utils/utils';
import { createlabelLayer, enhanceStyle, addTransform } from './heatmap_chart_utils';

export const createHeatmapWithBin = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: Partial<HeatmapChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
) => {
  const [xAxis, yAxis] = getSwappedAxisRole(styles, axisColumnMappings);

  const colorFieldColumn = axisColumnMappings?.color as any;
  const colorField = colorFieldColumn?.column;
  const colorName = colorFieldColumn?.name;

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
        type: getSchemaByAxis(xAxis),
        bin: true,
        axis: applyAxisStyling(xAxis),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        bin: true,
        axis: applyAxisStyling(yAxis),
      },
      color: {
        field: colorField,
        type: getSchemaByAxis(colorFieldColumn),
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
              title: colorName || 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxis?.styles?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxis?.styles?.title?.text || yAxis?.name,
          },
          { field: colorField, type: 'quantitative', title: colorName },
        ],
      }),
    },
  };

  enhanceStyle(markLayer, styles, transformedData, colorField);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    transform: addTransform(styles, colorField),
    layer: [markLayer, createlabelLayer(styles, false, colorField, xAxis, yAxis)].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${colorName} by ${xAxis?.name} and ${yAxis?.name}`
      : undefined,
  };
  return baseSpec;
};

export const createRegularHeatmap = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: Partial<HeatmapChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
) => {
  const [xAxis, yAxis] = getSwappedAxisRole(styles, axisColumnMappings);

  const colorFieldColumn = axisColumnMappings?.color!;
  const colorField = colorFieldColumn?.column;
  const colorName = colorFieldColumn?.name;

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
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling(xAxis, true),
        // for regular heatmap, both x and y refer to categorical fields, we shall disable grid line for this case
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling(yAxis, true),
      },
      color: {
        field: colorField,
        type: getSchemaByAxis(colorFieldColumn),
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
              title: colorName || 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxis?.styles?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxis?.styles?.title?.text || yAxis?.name,
          },
          { field: colorField, type: 'quantitative', title: colorName },
        ],
      }),
    },
  };

  enhanceStyle(markLayer, styles, transformedData, colorField);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    transform: addTransform(styles, colorField),
    layer: [markLayer, createlabelLayer(styles, true, colorField, xAxis, yAxis)].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${colorName} by ${xAxis?.name} and ${yAxis?.name}`
      : undefined,
  };

  return baseSpec;
};
