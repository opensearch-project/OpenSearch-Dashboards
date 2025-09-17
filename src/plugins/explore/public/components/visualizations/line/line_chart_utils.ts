/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyleControls } from './line_vis_config';
import { VisColumn, Positions } from '../types';
import { DEFAULT_OPACITY } from '../constants';

/**
 * Get Vega interpolation from UI lineMode
 * @param lineMode The line mode ('straight', 'smooth', or 'stepped')
 * @returns The corresponding Vega interpolation value
 */
export const getVegaInterpolation = (lineMode: string): string => {
  switch (lineMode) {
    case 'straight':
      return 'linear';
    case 'smooth':
      return 'monotone';
    case 'stepped':
      return 'step-after';
    default:
      return 'monotone';
  }
};

type VegaLiteMarkConfig =
  | {
      type: 'bar';
      opacity: number;
      tooltip: boolean;
    }
  | {
      type: 'area';
      opacity: number;
      tooltip: boolean;
      strokeWidth: number;
      interpolate: string;
    }
  | {
      type: 'point';
      tooltip: boolean;
      size: number;
    }
  | {
      type: 'line';
      tooltip: boolean;
      strokeWidth: number;
      interpolate: string;
      point?: boolean;
    };

/**
 * Build proper Vega-Lite mark configuration
 * @param styles The style options
 * @param markType The mark type ('line' or 'bar')
 * @returns The mark configuration object
 * TODO: refactor this to create chart type specific mark builder instead of having one builder for all
 */
export const buildMarkConfig = (
  styles: Partial<LineChartStyleControls> | undefined,
  markType: 'line' | 'bar' | 'area' = 'line'
): VegaLiteMarkConfig => {
  // Default values - handle undefined styles object
  const lineStyle = styles?.lineStyle ?? 'both';
  const lineWidth = styles?.lineWidth ?? 2;
  const lineMode = styles?.lineMode ?? 'smooth';
  const showTooltip = styles?.tooltipOptions?.mode !== 'hidden';

  if (markType === 'bar') {
    return {
      type: 'bar',
      opacity: DEFAULT_OPACITY,
      tooltip: showTooltip,
    };
  }

  if (markType === 'area') {
    return {
      type: 'area',
      opacity: DEFAULT_OPACITY,
      tooltip: showTooltip,
      strokeWidth: lineWidth,
      interpolate: getVegaInterpolation(lineMode),
    };
  }

  // For line charts - use lineStyle to determine the visualization
  switch (lineStyle) {
    case 'dots':
      // Only show points
      return {
        type: 'point',
        tooltip: showTooltip,
        size: 100,
      };
    case 'line':
      // Only show line
      return {
        type: 'line',
        tooltip: showTooltip,
        strokeWidth: lineWidth,
        interpolate: getVegaInterpolation(lineMode),
      };
    case 'both':
      // Show both line and points
      return {
        type: 'line',
        point: true,
        tooltip: showTooltip,
        strokeWidth: lineWidth,
        interpolate: getVegaInterpolation(lineMode),
      };
    default:
      // Fallback to both if lineStyle is not recognized
      return {
        type: 'line',
        point: true,
        tooltip: showTooltip,
        strokeWidth: lineWidth,
        interpolate: getVegaInterpolation(lineMode),
      };
  }
};

/**
 * Create time marker layer
 * @param styles The style options
 * @returns The time marker layer configuration or null if disabled
 */
export const createTimeMarkerLayer = (styles: Partial<LineChartStyleControls> | undefined): any => {
  if (!styles?.addTimeMarker) {
    return null;
  }

  const showTooltip = styles?.tooltipOptions?.mode !== 'hidden';

  return {
    mark: {
      type: 'rule',
      color: '#FF6B6B',
      strokeWidth: 2,
      strokeDash: [3, 3],
      tooltip: showTooltip,
    },
    encoding: {
      x: {
        datum: { expr: 'now()' },
        type: 'temporal',
      },
      ...(showTooltip && {
        tooltip: {
          value: 'Current Time',
        },
      }),
    },
  };
};

export enum ValueAxisPosition {
  Left = 0,
  Right = 1,
}

/**
 * Apply grid and axis styling
 * @param baseAxis The base axis configuration
 * @param styles The style options
 * @param axisType The axis type ('category' or 'value')
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param axisIndex The position of the value axis; default value axis is at left
 * @returns The styled axis configuration
 */

// TODO move applyAxisStyling out line folder as it is also used in area
export const applyAxisStyling = (
  baseAxis: any,
  styles: Partial<LineChartStyleControls>,
  axisType: 'category' | 'value',
  numericalColumns?: VisColumn[],
  categoricalColumns?: VisColumn[],
  dateColumns?: VisColumn[],
  axisIndex: ValueAxisPosition = ValueAxisPosition.Left
): any => {
  if (!styles) return baseAxis;

  const isRule2 =
    numericalColumns?.length === 2 && dateColumns?.length === 1 && categoricalColumns?.length === 0;

  if (axisType === 'category' && styles.categoryAxes && styles.categoryAxes.length > 0) {
    const categoryAxis = styles.categoryAxes[0];

    // If show is false, hide the entire axis
    if (categoryAxis.show === false) {
      return {
        ...baseAxis,
        title: null,
        labels: false,
        ticks: false,
        domain: false,
        grid: false,
      };
    }

    return {
      ...baseAxis,
      title: categoryAxis.title?.text,
      orient: categoryAxis.position || baseAxis.orient,
      labelAngle: categoryAxis.labels?.rotate || 0,
      labelLimit: categoryAxis.labels?.truncate || 100,
      grid: categoryAxis?.grid?.showLines ?? false, // Explicitly check grid object
      labels: categoryAxis.labels?.show,
      labelOverlap: 'greedy',
    };
  } else if (axisType === 'value') {
    // Make sure we have the correct number of value axes for Rule 2
    if (isRule2 && (!styles.valueAxes || styles.valueAxes.length < 2)) {
      // Return default configuration based on axis index
      if (axisIndex === 0) {
        return {
          ...baseAxis,
          orient: Positions.LEFT,
        };
      } else {
        return {
          ...baseAxis,
          orient: Positions.RIGHT,
        };
      }
    }

    // Use the value axis at the specified index
    if (styles.valueAxes && styles.valueAxes.length > axisIndex) {
      const valueAxis = styles.valueAxes[axisIndex];

      // For Rule 2, ensure correct positioning
      const orient = isRule2
        ? axisIndex === 0
          ? Positions.LEFT
          : Positions.RIGHT
        : valueAxis.position || baseAxis.orient;

      // If show is false, hide the entire axis
      if (valueAxis.show === false) {
        return {
          ...baseAxis,
          title: null,
          labels: false,
          ticks: false,
          domain: false,
          grid: false,
        };
      }

      return {
        ...baseAxis,
        title: valueAxis.title?.text,
        orient,
        labelAngle: valueAxis.labels?.rotate || 0,
        labelLimit: valueAxis.labels?.truncate || 100,
        grid: valueAxis?.grid?.showLines ?? false, // Explicitly check grid object
        labels: valueAxis.labels?.show !== false, // Show labels by default
        labelOverlap: 'greedy',
      };
    }
  }

  return baseAxis;
};
