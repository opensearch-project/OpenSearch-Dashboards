/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as echarts from 'echarts';
import type { LineSeriesOption } from 'echarts';
import { getSeriesDisplayName } from '../utils/series';
import { AreaChartStyle, DEFAULT_FILL_OPACITY, StackMode } from './area_vis_config';
import { DisableMode } from '../types';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { composeMarkLine } from '../utils/utils';
import { getColors } from '../theme/default_colors';
import {
  createSeriesLegendItem,
  getLegendColor,
  getLegendNameDomain,
  LegendItem,
} from '../utils/legend';
import { hexToRgb, rgbToHex } from '../theme/color_utils';
import { resolveConnectMode } from '../utils/data_transformation';

/**
 * Helper function to convert null values to 0 for stacked area charts
 * @param data - Array of data objects
 * @param excludeFields - Fields to exclude from null replacement (e.g., time fields, category fields)
 * @returns Array with null values replaced by 0
 */
export const replaceNullWithZero = (
  data: Array<Record<string, any>>,
  excludeFields: string[] = []
): Array<Record<string, any>> => {
  return data.map((row) => {
    const newRow = { ...row };
    Object.keys(newRow).forEach((key) => {
      if (!excludeFields.includes(key) && (newRow[key] === null || newRow[key] === undefined)) {
        newRow[key] = 0;
      }
    });
    return newRow;
  });
};

// How far the `hue` gradient lightens the series color toward white at the baseline.
const HUE_GRADIENT_LIGHTEN_RATIO = 0.55;

//  Lightens a hex color by blending it toward white.
export const lightenHexColor = (hexColor: string, ratio: number): string => {
  const { r, g, b } = hexToRgb(hexColor);
  const blend = (channel: number) => Math.round(channel + (255 - channel) * ratio);
  return rgbToHex(blend(r), blend(g), blend(b));
};

export const buildAreaStyle = (styles: AreaChartStyle, seriesColor: string) => {
  const opacity = (styles.areaOpacity ?? DEFAULT_FILL_OPACITY) / 100;

  const gradientMode = styles.gradientMode ?? 'none';

  if (gradientMode === 'none') {
    return { opacity };
  }

  // The gradient's far end: transparent for `opacity` mode, a lighter hue for `hue` mode.
  const baselineColor =
    gradientMode === 'opacity'
      ? 'rgba(0, 0, 0, 0)'
      : lightenHexColor(seriesColor, HUE_GRADIENT_LIGHTEN_RATIO);

  return {
    opacity,
    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: seriesColor },
      { offset: 1, color: baselineColor },
    ]),
  };
};

/**
 * ECharts connectNulls only maps always mode.
 */
export const buildConnectNulls = (styles: AreaChartStyle): boolean =>
  resolveConnectMode(styles) === DisableMode.Always;

// ECharts groups series that share this id into a single stack.
export const AREA_STACK_ID = 'total';

export const resolveStackMode = (styles: AreaChartStyle): StackMode => styles.stackMode ?? 'none';

export const buildStackConfig = (styles: AreaChartStyle) =>
  resolveStackMode(styles) === 'none' ? {} : { stack: AREA_STACK_ID };

/**
 * stacked and normalized so each data point sums to 100%
 * @param excludeFields Fields that are not series values (e.g. the x-axis column).
 */
export const normalizeToPercentage =
  ({ excludeFields = [] }: { excludeFields?: string[] }) =>
  (data: Array<Record<string, any>>): Array<Record<string, any>> => {
    return data.map((row) => {
      const seriesFields = Object.keys(row).filter((key) => !excludeFields.includes(key));

      // The row total sums absolute values rather than signed ones.
      // each value lands within +/-100% while ensure row stays readable
      // ({a: 100, b: -30} -> 77% / -23%).
      const total = seriesFields.reduce((sum, field) => {
        const value = Number(row[field]);
        return Number.isFinite(value) ? sum + Math.abs(value) : sum;
      }, 0);

      const newRow = { ...row };
      seriesFields.forEach((field) => {
        const value = Number(newRow[field]);
        if (newRow[field] === null || newRow[field] === undefined || !Number.isFinite(value)) {
          return;
        }
        newRow[field] = total === 0 ? 0 : (value / total) * 100;
      });
      return newRow;
    });
  };

export const transformStackPercentage =
  (styles: AreaChartStyle, options: { excludeFields?: string[] }) =>
  (data: Array<Record<string, any>>): Array<Record<string, any>> =>
    resolveStackMode(styles) === 'percentage' ? normalizeToPercentage(options)(data) : data;

/**
 * apply percentage range to axis and labels it with `%` when stacking to 100%
 */
export const applyPercentageAxis =
  <T extends BaseChartStyle>(styles: AreaChartStyle): PipelineFn<T> =>
  (state) => {
    if (resolveStackMode(styles) !== 'percentage') return state;

    const { transformedData = [] } = state;
    const [, ...rows] = transformedData;

    const hasNegativeValue = rows.some((row: any[]) =>
      row.some((data) => typeof data === 'number' && data < 0)
    );

    const toPercentageAxis = (axisConfig: any) => ({
      ...axisConfig,
      min: hasNegativeValue ? -100 : 0,
      max: 100,
      axisLabel: { ...axisConfig?.axisLabel, formatter: '{value}%' },
    });

    const { yAxisConfig } = state;
    return {
      ...state,
      yAxisConfig: Array.isArray(yAxisConfig)
        ? yAxisConfig.map(toPercentageAxis)
        : toPercentageAxis(yAxisConfig),
    };
  };

/**
 * Create area series configuration for ECharts
 */
export const createAreaSeries =
  <T extends BaseChartStyle>({
    styles,
    seriesFields,
    categoryField,
    allData,
    colorField,
    addTimeMarker = true,
  }: {
    styles: AreaChartStyle;
    seriesFields: string[] | ((headers?: string[]) => string[]);
    categoryField: string;
    allData?: Array<Record<string, any>>;
    colorField?: string;
    addTimeMarker?: boolean;
  }): PipelineFn<T> =>
  (state) => {
    const { transformedData = [], axisColumnMappings, xAxisConfig } = state;
    const palette = getColors().categories;
    const newState = { ...state };
    const usedTimeMarker = addTimeMarker && styles.addTimeMarker;

    if (!Array.isArray(seriesFields)) {
      seriesFields = seriesFields(transformedData[0]);
    }

    if (usedTimeMarker) {
      // manually extend xAxis range
      const newXAxisConfig = { ...xAxisConfig };
      newXAxisConfig.max = new Date();
      newState.xAxisConfig = newXAxisConfig;
    }

    const allColumns = Object.values(axisColumnMappings).flat();
    const sortedNames = getLegendNameDomain({
      data: allData,
      nameField: colorField,
      seriesFields,
      columns: allColumns,
    });

    const legendItems: LegendItem[] = [];
    const markLines = composeMarkLine(styles.thresholdOptions, usedTimeMarker);
    const stackConfig = buildStackConfig(styles);
    const connectNulls = buildConnectNulls(styles);
    const series = seriesFields?.map((item: string, index: number) => {
      const name = getSeriesDisplayName(item, allColumns);
      const color = getLegendColor(name, palette, sortedNames);
      legendItems.push(createSeriesLegendItem(name, color));

      return {
        name,
        type: 'line',
        showSymbol: false,
        connectNulls,
        ...stackConfig,
        areaStyle: buildAreaStyle(styles, color),
        smooth: true,
        encode: {
          x: categoryField,
          y: item,
        },
        emphasis: {
          focus: 'self',
        },
        itemStyle: {
          color,
        },
        ...(index === 0 && markLines),
      };
    });

    newState.series = series as LineSeriesOption[];
    newState.legendItems = legendItems;

    return newState;
  };
