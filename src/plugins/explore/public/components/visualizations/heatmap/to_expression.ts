/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { VisColumn, ScaleType } from '../types';
import { applyAxisStyling, getAxisByRole } from '../utils/utils';
import { createlabelLayer, enhanceStyle, addTransform } from './heatmap_chart_utils';

export const createHeatmapWithBin = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: Partial<HeatmapChartStyleControls>
) => {
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], 'x');
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], 'y');

  const numericalColor = numericalColumns?.filter(
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
        field: numericalColor.column,
        type: 'quantitative',
        bin:
          !styles.exclusive?.useCustomRanges && styles.exclusive?.colorScaleType !== ScaleType.LOG
            ? { maxbins: Number(styles.exclusive?.maxNumberOfColors) }
            : false,
        scale: {
          type: styles.exclusive?.colorScaleType,
          scheme: styles.exclusive?.colorSchema,
          reverse: styles.exclusive?.reverseSchema,
        },
        legend: styles.addLegend
          ? {
              title: numericalColor.name || 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
    },
  };

  enhanceStyle(markLayer, styles, transformedData, numericalColor.column);

  const baseSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: transformedData },
    transform: addTransform(styles, numericalColor.column),
    layer: [
      markLayer,
      createlabelLayer(
        styles,
        false,
        xAxis?.field?.default,
        yAxis?.field?.default,
        numericalColor.column
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
  const xAxis = getAxisByRole(styles?.StandardAxes ?? [], 'x');
  const yAxis = getAxisByRole(styles?.StandardAxes ?? [], 'y');

  const numericalColor = numericalColumns![0];
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
        field: numericalColor.column,
        type: 'quantitative',
        // log doesn't support bin, delete log or disable bin when scale type is log?
        bin:
          !styles.exclusive?.useCustomRanges && styles.exclusive?.colorScaleType !== ScaleType.LOG
            ? { maxbins: Number(styles.exclusive?.maxNumberOfColors) }
            : false,
        scale: {
          type: styles.exclusive?.colorScaleType,
          scheme: styles.exclusive?.colorSchema,
          reverse: styles.exclusive?.reverseSchema,
        },
        legend: styles.addLegend
          ? {
              title: numericalColor.name || 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
    },
  };

  enhanceStyle(markLayer, styles, transformedData, numericalColor.column);

  const baseSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: transformedData },
    transform: addTransform(styles, numericalColor.column),
    layer: [
      markLayer,
      createlabelLayer(
        styles,
        true,
        xAxis?.field?.default,
        yAxis?.field?.default,
        numericalColor.column
      ),
    ].filter(Boolean),
  };

  return baseSpec;
};
