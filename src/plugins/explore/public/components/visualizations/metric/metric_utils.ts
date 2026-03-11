/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineSeriesOption } from 'echarts';
import { BaseChartStyle, EChartsSpecState, PipelineFn } from '../utils/echarts_spec';
import { getSeriesDisplayName } from '../utils/series';
import { MetricChartStyle } from './metric_vis_config';
import { getColors } from '../theme/default_colors';
import { calculateValue } from '../utils/calculation';

export const createMetricChartSeries = ({
  seriesFields,
  dateField,
  styles,
}: {
  seriesFields: string[];
  styles: MetricChartStyle;
  dateField: string;
}): PipelineFn => (state) => {
  const { transformedData = [], axisColumnMappings } = state;
  const newState = { ...state };
  const colorPalette = getColors();

  const series: LineSeriesOption[] = [];
  seriesFields.forEach((item: string) => {
    if (!transformedData.length || !Array.isArray(transformedData[0])) {
      // No dataset/header row available; keep rendering stable.
      return;
    }

    const headers = transformedData[0] ?? [];
    const dataColumnIndex = headers.indexOf(item);
    const numericalValues: unknown[] = [];
    transformedData.forEach((d, i) => {
      if (i >= 1) {
        numericalValues.push(d[dataColumnIndex]);
      }
    });

    let sparklineColor: string;
    if (styles.colorMode === 'background_solid' || styles.colorMode === 'background_gradient') {
      sparklineColor = 'rgba(255, 255, 255, 0.7)';
    } else {
      if (
        styles.useThresholdColor &&
        (styles.colorMode === 'value' || styles.colorMode === 'none')
      ) {
        const calculatedValue = calculateValue(numericalValues, styles.valueCalculation);
        const thresholds = styles.thresholdOptions?.thresholds ?? [];
        let thresholdColor = styles.thresholdOptions?.baseColor ?? colorPalette.statusGreen;

        if (calculatedValue !== undefined) {
          for (let i = 0; i < thresholds.length; i++) {
            const { value, color } = thresholds[i];
            if (calculatedValue >= value) thresholdColor = color;
          }
        }
        sparklineColor = thresholdColor;
      } else {
        sparklineColor = colorPalette.categories[0];
      }
    }

    const seriesDisplayName = getSeriesDisplayName(item, Object.values(axisColumnMappings));

    series.push({
      name: seriesDisplayName,
      type: 'line' as const,
      z: 1,
      encode: {
        x: dateField,
        y: item,
      },
      symbol: 'none',
      areaStyle: {
        color: sparklineColor,
        opacity: 0.5,
      },
      lineStyle: {
        width: 1,
        color: sparklineColor,
      },
    });
  });

  newState.series = series;
  return newState;
};

export const assembleForMetric = <T extends BaseChartStyle>(state: EChartsSpecState<T>) => {
  // Metric sparkline doesn't have x/y axis
  const xAxis = Array.isArray(state.spec?.xAxis)
    ? state.spec.xAxis.map((a) => ({ ...a, show: false, silent: true }))
    : { ...state.spec?.xAxis, show: false, silent: true };
  const yAxis = Array.isArray(state.spec?.yAxis)
    ? state.spec.yAxis.map((a) => ({ ...a, show: false, silent: true }))
    : { ...state.spec?.yAxis, show: false, silent: true };

  const spec = {
    ...state.spec,
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    xAxis,
    yAxis,
    tooltip: {
      ...state.spec?.tooltip,
      show: false,
    },
    legend: {
      ...state.spec?.legend,
      show: false,
    },
  };
  return { ...state, spec };
};

/**
 * Options for constraining font size based on container width and text length
 */
export interface ConstrainFontSizeOptions {
  /** Width of the container in pixels */
  containerWidth: number;
  /** Text content to display */
  text: string;
  /** Desired font size in pixels */
  fontSize: number;
  /** Minimum allowed font size (default: 10) */
  minSize?: number;
  /** Maximum allowed font size (default: 100) */
  maxSize?: number;
  /** Percentage of width reserved for padding (default: 0.15) */
  paddingRatio?: number;
  /** Average character width relative to font size (default: 0.6) */
  charWidthRatio?: number;
}

/**
 * Constrains a font size based on container width and text length to prevent overflow.
 *
 * This utility calculates the maximum font size that allows the text to fit within
 * the container width, considering padding and average character width. It then
 * returns the smaller of the desired font size and the width-constrained size,
 * ensuring the result stays within the specified min/max bounds.
 *
 * @param options - Configuration options for font size constraint
 * @returns The constrained font size in pixels
 *
 * @example
 * ```typescript
 * const fontSize = constrainFontSizeByWidth({
 *   containerWidth: 300,
 *   text: "Hello World",
 *   fontSize: 48,
 *   minSize: 12,
 *   maxSize: 60,
 * });
 * // Returns a font size that fits "Hello World" in 300px width
 * ```
 */
export function constrainFontSizeByWidth(options: ConstrainFontSizeOptions): number {
  const {
    containerWidth,
    text,
    fontSize,
    minSize = 10,
    maxSize = 100,
    paddingRatio = 0.15,
    charWidthRatio = 0.6,
  } = options;

  // If no text or invalid width, return the desired size within bounds
  if (text.length === 0 || containerWidth <= 0) {
    return Math.max(minSize, Math.min(maxSize, fontSize));
  }

  // Calculate available width after padding
  const availableWidth = containerWidth * (1 - paddingRatio);

  // Calculate maximum font size that fits the text within available width
  const maxSizeByWidth = availableWidth / (text.length * charWidthRatio);

  // Use the smaller of desired size and width-constrained size
  let constrainedSize = Math.min(fontSize, maxSizeByWidth);

  // Apply min/max bounds
  constrainedSize = Math.max(minSize, Math.min(maxSize, constrainedSize));

  return constrainedSize;
}
