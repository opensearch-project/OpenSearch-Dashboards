/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { VisColumn, AxisRole, VEGASCHEMA, AxisColumnMappings } from '../types';
import { applyAxisStyling, getAxisByRole } from '../utils/utils';
import { createlabelLayer, enhanceStyle, addTransform } from './heatmap_chart_utils';

export const createHeatmapWithBin = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: Partial<HeatmapChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
) => {
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);

  const colorFieldColumn = axisColumnMappings?.color as any;
  const xField = xAxis?.field?.default?.column;
  const yField = yAxis?.field?.default?.column;
  const colorField = colorFieldColumn?.column;
  const xName = xAxis?.title?.text || xAxis?.field?.default?.name;
  const yName = yAxis?.title?.text || yAxis?.field?.default?.name || 'Y-Axis';
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
        field: xField,
        type: 'quantitative',
        bin: true,
        axis: applyAxisStyling(xAxis, styles?.grid?.xLines),
      },
      y: {
        field: yField,
        type: 'quantitative',
        bin: true,
        axis: applyAxisStyling(yAxis, styles?.grid?.yLines),
      },
      color: {
        field: colorField,
        type: 'quantitative',
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
          { field: xField, type: 'quantitative', title: xName },
          { field: yField, type: 'quantitative', title: yName },
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
    layer: [
      markLayer,
      createlabelLayer(styles, false, colorField, xAxis?.field?.default, yAxis?.field?.default),
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
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);

  const colorFieldColumn = axisColumnMappings?.color!;
  const xField = xAxis?.field?.default?.column;
  const yField = yAxis?.field?.default?.column;
  const colorField = colorFieldColumn?.column;
  const xName = xAxis?.title?.text || xAxis?.field?.default?.name;
  const yName = yAxis?.title?.text || yAxis?.field?.default?.name;
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
        field: xField,
        type: 'nominal',
        axis: applyAxisStyling(xAxis, false),
        // for regular heatmap, both x and y refer to categorical fields, we shall disable grid line for this case
      },
      y: {
        field: yField,
        type: 'nominal',
        axis: applyAxisStyling(yAxis, false),
      },
      color: {
        field: colorField,
        type: 'quantitative',
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
          { field: xField, type: 'nominal', title: xName },
          { field: yField, type: 'nominal', title: yName },
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
    layer: [
      markLayer,
      createlabelLayer(styles, true, colorField, xAxis?.field?.default, yAxis?.field?.default),
    ].filter(Boolean),
  };

  return baseSpec;
};
