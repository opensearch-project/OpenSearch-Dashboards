/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { LineChartStyleControls } from './line_vis_config';
import { ThresholdLineStyle, VisColumn, Positions } from '../types';

/**
 * Get stroke dash array for different line styles
 * @param style The line style ('dashed', 'dot-dashed', or 'full')
 * @returns The stroke dash array or undefined for solid lines
 */
export const getStrokeDash = (style: string): number[] | undefined => {
  switch (style) {
    case ThresholdLineStyle.Dashed:
      return [5, 5];
    case ThresholdLineStyle.DotDashed:
      return [5, 5, 1, 5];
    case ThresholdLineStyle.Full:
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

type VegaLiteMarkConfig =
  | {
      type: 'bar';
      opacity: number;
      tooltip: boolean;
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
 */
export const buildMarkConfig = (
  styles: Partial<LineChartStyleControls> | undefined,
  markType: 'line' | 'bar' = 'line'
): VegaLiteMarkConfig => {
  // Default values - handle undefined styles object
  const lineStyle = styles?.lineStyle ?? 'both';
  const lineWidth = styles?.lineWidth ?? 2;
  const lineMode = styles?.lineMode ?? 'smooth';
  const tooltipMode = styles?.tooltipOptions?.mode ?? 'all';

  // Create tooltip configuration based on options
  const tooltipConfig: any = {
    content: { signal: '' },
    shared: true,
  };

  if (markType === 'bar') {
    return {
      type: 'bar',
      opacity: 0.7,
      tooltip: tooltipMode !== 'hidden' ? tooltipConfig : false,
    };
  }

  // For line charts
  if (lineStyle === 'dots') {
    // Only show points
    return {
      type: 'point',
      tooltip: tooltipMode !== 'hidden' ? tooltipConfig : false,
      size: 100,
    };
  } else if (lineStyle === 'line') {
    // Only show line
    return {
      type: 'line',
      tooltip: tooltipMode !== 'hidden' ? tooltipConfig : false,
      strokeWidth: lineWidth,
      interpolate: getVegaInterpolation(lineMode),
    };
  } else if (lineStyle === 'both') {
    // Show both line and points
    return {
      type: 'line',
      point: true,
      tooltip: tooltipMode !== 'hidden' ? tooltipConfig : false,
      strokeWidth: lineWidth,
      interpolate: getVegaInterpolation(lineMode),
    };
  } else {
    return {
      type: 'point',
      tooltip: tooltipMode !== 'hidden' ? tooltipConfig : false,
      size: 0,
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
      tooltip:
        styles?.tooltipOptions?.mode !== 'hidden'
          ? {
              content: { signal: '' },
              shared: true,
            }
          : false,
    },
    encoding: {
      y: {
        datum: styles.thresholdLine.value,
        type: 'quantitative',
      },
    },
  };

  // Add tooltip content if enabled
  if (styles?.tooltipOptions?.mode !== 'hidden') {
    thresholdLayer.encoding.tooltip = {
      value:
        i18n.translate('explore.vis.thresholdValue', {
          defaultMessage: 'Threshold: ',
        }) + styles.thresholdLine.value,
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
      tooltip:
        styles?.tooltipOptions?.mode !== 'hidden'
          ? {
              content: { signal: '' },
              shared: true,
            }
          : false,
    },
    encoding: {
      x: {
        datum: { expr: 'now()' },
        type: 'temporal',
      },
      ...(styles?.tooltipOptions?.mode !== 'hidden' && {
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
