/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole } from '.././types';
import { inferAxesFromColumns } from '../../visualizations/heatmap/heatmap_chart_utils';
import { inferAxesFromColumnsScatter } from '../../visualizations/scatter/scatter_chart_utils';
import {
  ChartStyleControlMap,
  ChartType,
  VisualizationTypeResult,
} from './use_visualization_types';
import { HeatmapChartStyleControls } from '../heatmap/heatmap_vis_config';
import { ScatterChartStyleControls } from '../scatter/scatter_vis_config';

export const inferColumns = (
  type: ChartType,
  visualizationData: VisualizationTypeResult<ChartType> | undefined,
  defaults: ChartStyleControlMap[ChartType]
) => {
  if (!visualizationData) return defaults;

  if (type === 'heatmap') {
    const heatmapDefaults = { ...defaults } as HeatmapChartStyleControls;

    const { x, y } = inferAxesFromColumns(
      visualizationData.numericalColumns,
      visualizationData.categoricalColumns
    );

    const updatedAxes = heatmapDefaults.StandardAxes.map((axis) => {
      if (axis.axisRole === AxisRole.X) {
        return { ...axis, field: x };
      }
      if (axis.axisRole === AxisRole.Y) {
        return { ...axis, field: y };
      }
      return axis;
    });
    return {
      ...heatmapDefaults,
      StandardAxes: updatedAxes,
    };
  }

  if (type === 'scatter') {
    const scatterDefaults = { ...defaults } as ScatterChartStyleControls;
    const { x, y } = inferAxesFromColumnsScatter(
      visualizationData.numericalColumns,
      visualizationData.categoricalColumns
    );
    const updatedAxes = scatterDefaults.StandardAxes.map((axis) => {
      if (axis.axisRole === AxisRole.X) {
        return { ...axis, field: x };
      }
      if (axis.axisRole === AxisRole.Y) {
        return { ...axis, field: y };
      }
      return axis;
    });

    return {
      ...scatterDefaults,
      StandardAxes: updatedAxes,
    };
  }

  return defaults;
};
