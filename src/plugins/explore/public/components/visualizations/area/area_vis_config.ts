/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaVisStyleControls } from './area_vis_options';
import { VisualizationType } from '../utils/use_visualization_types';
import {
  CategoryAxis,
  ThresholdLines,
  ThresholdMode,
  ValueAxis,
  Positions,
  TooltipOptions,
  AxisRole,
  VisFieldType,
  TitleOptions,
  ThresholdOptions,
  StandardAxes,
} from '../types';
import { getColors } from '../theme/default_colors';

// Complete area chart style controls interface
export interface AreaChartStyleOptions {
  // Basic controls
  addLegend?: boolean;
  legendPosition?: Positions;
  // @deprecated - removed this once migrated to echarts
  legendTitle?: string;
  addTimeMarker?: boolean;
  areaOpacity?: number;
  tooltipOptions?: TooltipOptions;

  /**
   * @deprecated - use thresholdOptions instead
   */
  thresholdLines?: ThresholdLines;

  // Axes configuration
  /**
   * @deprecated - use standardAxes instead
   */
  categoryAxes?: CategoryAxis[];
  /**
   * @deprecated - use standardAxes instead
   */
  valueAxes?: ValueAxis[];

  standardAxes?: StandardAxes[];

  titleOptions?: TitleOptions;

  thresholdOptions?: ThresholdOptions;
  showFullTimeRange?: boolean;
}

export type AreaChartStyle = Required<
  Omit<
    AreaChartStyleOptions,
    'areaOpacity' | 'thresholdLines' | 'legendTitle' | 'categoryAxes' | 'valueAxes'
  >
> &
  Pick<AreaChartStyleOptions, 'areaOpacity' | 'legendTitle'>;

const defaultAreaChartStyles: AreaChartStyle = {
  // Basic controls
  addLegend: true,
  legendTitle: '',
  legendPosition: Positions.BOTTOM,
  addTimeMarker: false,
  tooltipOptions: {
    mode: 'all',
  },

  // Threshold options
  thresholdOptions: {
    baseColor: getColors().statusGreen,
    thresholds: [],
    thresholdStyle: ThresholdMode.Off,
  },

  standardAxes: [],

  titleOptions: {
    show: false,
    titleName: '',
  },

  showFullTimeRange: false,
};

export const createAreaConfig = (): VisualizationType<'area'> => ({
  name: 'area',
  type: 'area',
  ui: {
    style: {
      defaults: defaultAreaChartStyles,
      render: (props) => React.createElement(AreaVisStyleControls, props),
    },
    availableMappings: [
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Numerical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Numerical, index: 1 },
        [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Numerical, index: 1 },
      },
    ],
  },
});
