/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { VisColumn, AxisRole, VEGASCHEMA } from '../types';
import { applyAxisStyling, getAxisByRole } from '../utils/utils';
import { createlabelLayer, enhanceStyle, addTransform } from './heatmap_chart_utils';

export const createHeatmapWithBin = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: Partial<HeatmapChartStyleControls>
) => {
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);

  const colorFieldColumn = numericalColumns.filter(
    (f) => f.column !== xAxis?.field?.default.column && f.column !== yAxis?.field?.default.column
  )[0];

  const markLayer: any = {
    mark: {
      type: 'rect',
      tooltip: styles.addTooltip,
      stroke: 'white',
      strokeWidth: 1,
    },
    encoding: {
      x: {
        field: xAxis?.field?.default.column,
        type: 'quantitative',
        bin: true,
        axis: applyAxisStyling(xAxis),
      },
      y: {
        field: yAxis?.field?.default.column,
        type: 'quantitative',
        bin: true,
        axis: applyAxisStyling(yAxis),
      },
      color: {
        field: colorFieldColumn.column,
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
              title: colorFieldColumn.name || 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
    },
  };

  enhanceStyle(markLayer, styles, transformedData, colorFieldColumn.column);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    transform: addTransform(styles, colorFieldColumn.column),
    layer: [
      markLayer,
      createlabelLayer(
        styles,
        false,
        colorFieldColumn.column,
        xAxis?.field?.default,
        yAxis?.field?.default
      ),
    ].filter(Boolean),
  };
  return baseSpec;
};

export const createRegularHeatmap = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: Partial<HeatmapChartStyleControls>
) => {
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.X);
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], AxisRole.Y);

  const colorFieldColumn = numericalColumns[0];
  const markLayer: any = {
    mark: {
      type: 'rect',
      tooltip: styles.addTooltip,
      stroke: 'white',
      strokeWidth: 1,
    },
    encoding: {
      x: {
        field: xAxis?.field?.default.column,
        type: 'nominal',
        axis: applyAxisStyling(xAxis),
      },
      y: {
        field: yAxis?.field?.default.column,
        type: 'nominal',
        axis: applyAxisStyling(yAxis),
      },
      color: {
        field: colorFieldColumn.column,
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
              title: colorFieldColumn.name || 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
    },
  };

  enhanceStyle(markLayer, styles, transformedData, colorFieldColumn.column);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    transform: addTransform(styles, colorFieldColumn.column),
    layer: [
      markLayer,
      createlabelLayer(
        styles,
        true,
        colorFieldColumn.column,
        xAxis?.field?.default,
        yAxis?.field?.default
      ),
    ].filter(Boolean),
  };

  return baseSpec;
};
