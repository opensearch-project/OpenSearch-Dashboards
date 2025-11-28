/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyle } from './line_vis_config';
import { VisColumn, Positions, VisFieldType, StandardAxes } from '../types';
import { DEFAULT_OPACITY } from '../constants';
import { AreaChartStyle } from '../area/area_vis_config';

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
  styles: LineChartStyle | AreaChartStyle | undefined,
  markType: 'line' | 'bar' | 'area' = 'line'
): VegaLiteMarkConfig => {
  // Default values - handle undefined styles object
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
      strokeWidth: 2,
      interpolate: getVegaInterpolation('smooth'),
    };
  }

  const lineStyle = (styles as LineChartStyle | undefined)?.lineStyle ?? 'both';
  const lineWidth = (styles as LineChartStyle | undefined)?.lineWidth ?? 2;
  const lineMode = (styles as LineChartStyle | undefined)?.lineMode ?? 'smooth';
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
export const createTimeMarkerLayer = (styles: LineChartStyle | AreaChartStyle | undefined): any => {
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
// TODO: Refactor this function to be more generic
export const applyAxisStyling = (
  baseAxis: any,
  styles: StandardAxes | undefined,
  axisType: 'category' | 'value',
  numericalColumns?: VisColumn[],
  categoricalColumns?: VisColumn[],
  dateColumns?: VisColumn[],
  axisIndex: ValueAxisPosition = ValueAxisPosition.Left
): any => {
  const isRule2 =
    numericalColumns?.length === 2 && dateColumns?.length === 1 && categoricalColumns?.length === 0;

  // Initialize the axis configuration
  const axisConfig = { ...baseAxis };

  if (axisType === 'category' && styles) {
    // If show is false, hide the entire axis
    if (styles.show === false) {
      return {
        ...axisConfig,
        title: null,
        labels: false,
        ticks: false,
        domain: false,
        grid: false,
      };
    }

    // Apply category axis styling
    axisConfig.title = styles.title?.text || axisConfig.title;
    axisConfig.orient = styles.position || axisConfig.orient;
    axisConfig.labelAngle = styles.labels?.rotate || 0;
    axisConfig.labelLimit = styles.labels?.truncate || 100;
    axisConfig.grid = styles?.grid?.showLines ?? false; // Explicitly check grid object
    axisConfig.labels = styles.labels?.show;
    axisConfig.labelOverlap = 'greedy';
    axisConfig.labelFlush = false;

    // Add time format for date schema
    if (dateColumns?.length && dateColumns[0]?.schema === VisFieldType.Date) {
      axisConfig.format = {
        hours: '%H:%M',
        minutes: '%H:%M',
        seconds: '%H:%M:%S',
        milliseconds: '%H:%M:%S.%L',
      };
    }

    return axisConfig;
  } else if (axisType === 'value') {
    // Make sure we have the correct number of value axes for Rule 2
    if (isRule2 && !styles) {
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

    if (styles) {
      // For Rule 2, ensure correct positioning
      const orient = isRule2
        ? axisIndex === 0
          ? Positions.LEFT
          : Positions.RIGHT
        : styles.position || baseAxis.orient;

      // If show is false, hide the entire axis
      if (styles.show === false) {
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
        title: styles.title?.text,
        orient,
        labelAngle: styles.labels?.rotate || 0,
        labelLimit: styles.labels?.truncate || 100,
        grid: styles?.grid?.showLines ?? false, // Explicitly check grid object
        labels: styles.labels?.show !== false, // Show labels by default
        labelOverlap: 'greedy',
      };
    }
  }

  return baseAxis;
};
