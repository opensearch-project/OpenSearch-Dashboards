/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyleControls } from './line_vis_config';
import { VisColumn } from '../types';

/**
 * Get stroke dash array for different line styles
 * @param style The line style ('dashed', 'dot-dashed', or 'full')
 * @returns The stroke dash array or undefined for solid lines
 */
export const getStrokeDash = (style: string): number[] | undefined => {
  switch (style) {
    case 'dashed':
      return [5, 5];
    case 'dot-dashed':
      return [5, 5, 1, 5];
    case 'full':
    default:
      return undefined;
  }
};

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

/**
 * Build proper Vega-Lite mark configuration
 * @param styles The style options
 * @param markType The mark type ('line' or 'bar')
 * @returns The mark configuration object
 */
export const buildMarkConfig = (
  styles: Partial<LineChartStyleControls> | undefined,
  markType: 'line' | 'bar' = 'line'
): any => {
  // Default values - handle undefined styles object
  const showLine = styles?.showLine !== false;
  const showDots = styles?.showDots !== false;
  const lineWidth = styles?.lineWidth ?? 2;
  const lineMode = styles?.lineMode ?? 'smooth';
  const addTooltip = styles?.addTooltip !== false;

  if (markType === 'bar') {
    return {
      type: 'bar',
      opacity: 0.7,
      tooltip: addTooltip,
    };
  }

  // For line charts
  if (!showLine && showDots) {
    // Only show points
    return {
      type: 'point',
      tooltip: addTooltip,
      size: 100,
    };
  } else if (showLine && !showDots) {
    // Only show line
    return {
      type: 'line',
      tooltip: addTooltip,
      strokeWidth: lineWidth,
      interpolate: getVegaInterpolation(lineMode),
    };
  } else if (showLine && showDots) {
    // Show both line and points
    return {
      type: 'line',
      point: true,
      tooltip: addTooltip,
      strokeWidth: lineWidth,
      interpolate: getVegaInterpolation(lineMode),
    };
  } else {
    // Neither line nor dots - fallback to points
    return {
      type: 'point',
      tooltip: addTooltip,
      size: 0, // Make points invisible
    };
  }
};

/**
 * Create threshold line layer
 * @param styles The style options
 * @returns The threshold layer configuration or null if disabled
 */
export const createThresholdLayer = (styles: Partial<LineChartStyleControls> | undefined): any => {
  if (!styles?.thresholdLine?.show) {
    return null;
  }

  const thresholdLayer: any = {
    mark: {
      type: 'rule',
      color: styles.thresholdLine.color,
      strokeWidth: styles.thresholdLine.width,
      strokeDash: getStrokeDash(styles.thresholdLine.style),
      tooltip: styles.addTooltip !== false,
    },
    encoding: {
      y: {
        datum: styles.thresholdLine.value,
        type: 'quantitative',
      },
    },
  };

  // Add tooltip content if enabled
  if (styles.addTooltip !== false) {
    thresholdLayer.encoding.tooltip = {
      value: `Threshold: ${styles.thresholdLine.value}`,
    };
  }

  return thresholdLayer;
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

  return {
    mark: {
      type: 'rule',
      color: '#FF6B6B',
      strokeWidth: 2,
      strokeDash: [3, 3],
      tooltip: styles.addTooltip !== false,
    },
    encoding: {
      x: {
        datum: { expr: 'now()' },
        type: 'temporal',
      },
      ...(styles.addTooltip !== false && {
        tooltip: {
          value: 'Current Time',
        },
      }),
    },
  };
};

/**
 * Apply grid and axis styling
 * @param axis The base axis configuration
 * @param styles The style options
 * @param axisType The axis type ('category' or 'value')
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param axisIndex The index of the value axis (0 for left, 1 for right)
 * @returns The styled axis configuration
 */
export const applyAxisStyling = (
  baseAxis: any,
  styles: Partial<LineChartStyleControls>,
  axisType: 'category' | 'value',
  numericalColumns?: VisColumn[],
  categoricalColumns?: VisColumn[],
  dateColumns?: VisColumn[],
  axisIndex: number = 0 // Add axis index parameter with default value
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
      title: categoryAxis.title?.text || baseAxis.title,
      orient: categoryAxis.position || baseAxis.orient,
      labelAngle: categoryAxis.labels?.rotate || 0,
      labelLimit: categoryAxis.labels?.truncate || 100,
      grid: styles.grid?.categoryLines !== false, // Show grid lines by default
      labels: categoryAxis.labels?.show,
    };
  } else if (axisType === 'value') {
    // Make sure we have the correct number of value axes for Rule 2
    if (isRule2 && (!styles.valueAxes || styles.valueAxes.length < 2)) {
      // Return default configuration based on axis index
      if (axisIndex === 0) {
        return {
          ...baseAxis,
          orient: 'left',
        };
      } else {
        return {
          ...baseAxis,
          orient: 'right',
        };
      }
    }

    // Use the value axis at the specified index
    if (styles.valueAxes && styles.valueAxes.length > axisIndex) {
      const valueAxis = styles.valueAxes[axisIndex];

      // For Rule 2, ensure correct positioning
      const orient = isRule2
        ? axisIndex === 0
          ? 'left'
          : 'right'
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
        title: valueAxis.title?.text || baseAxis.title,
        orient,
        labelAngle: valueAxis.labels?.rotate || 0,
        labelLimit: valueAxis.labels?.truncate || 100,
        grid: styles.grid?.valueLines !== false, // Show grid lines by default
        labels: valueAxis.labels?.show !== false, // Show labels by default
      };
    }
  }

  return baseAxis;
};
