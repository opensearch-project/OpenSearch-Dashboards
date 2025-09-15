/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';

import {
  Positions,
  ThresholdLines,
  ThresholdLineStyle,
  TooltipOptions,
  VisFieldType,
  AxisRole,
  StandardAxes,
  TitleOptions,
  AggregationType,
  BucketOptions,
  TimeUnit,
} from '../types';
import { BarVisStyleControls, BarVisStyleControlsProps } from './bar_vis_options';
import { AXIS_LABEL_MAX_LENGTH } from '../constants';

export interface BarChartStyleControls {
  // Basic controls
  addLegend: boolean;
  legendPosition: Positions;
  legendShape?: 'circle' | 'square';
  tooltipOptions: TooltipOptions;

  // Bar specific controls
  barSizeMode: 'auto' | 'manual';
  barWidth: number;
  barPadding: number;
  showBarBorder: boolean;
  barBorderWidth: number;
  barBorderColor: string;

  // Threshold and grid
  thresholdLines: ThresholdLines;
  // Axes configuration
  standardAxes: StandardAxes[];

  switchAxes: boolean;

  titleOptions: TitleOptions;

  // histogram bucket config
  bucket?: BucketOptions;
}

export const defaultBarChartStyles: BarChartStyleControls = {
  // Basic controls
  switchAxes: false,
  addLegend: true,
  legendPosition: Positions.RIGHT,
  tooltipOptions: {
    mode: 'all',
  },

  // Bar specific controls
  barSizeMode: 'auto',
  barWidth: 0.7,
  barPadding: 0.1,
  showBarBorder: false,
  barBorderWidth: 1,
  barBorderColor: '#000000',

  // Threshold and grid
  thresholdLines: [
    {
      id: '1',
      color: '#E7664C',
      show: false,
      style: ThresholdLineStyle.Full,
      value: 10,
      width: 1,
      name: '',
    },
  ],

  standardAxes: [
    {
      id: 'Axis-1',
      position: Positions.BOTTOM,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: AXIS_LABEL_MAX_LENGTH,
      },
      title: {
        text: '',
      },
      grid: {
        showLines: false,
      },
      axisRole: AxisRole.X,
    },
    {
      id: 'Axis-2',
      position: Positions.LEFT,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: AXIS_LABEL_MAX_LENGTH,
      },
      title: {
        text: '',
      },
      grid: {
        showLines: true,
      },
      axisRole: AxisRole.Y,
    },
  ],
  titleOptions: {
    show: false,
    titleName: '',
  },
  bucket: {
    aggregationType: AggregationType.SUM,
    bucketTimeUnit: TimeUnit.AUTO,
  },
};

export const createBarConfig = (): VisualizationType<'bar'> => ({
  name: 'bar',
  type: 'bar',
  ui: {
    style: {
      defaults: defaultBarChartStyles,
      render: (props) =>
        React.createElement(BarVisStyleControls, props as BarVisStyleControlsProps),
    },
    availableMappings: [
      {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Categorical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Date, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
      },
    ],
  },
});
