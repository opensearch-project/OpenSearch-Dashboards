/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as echarts from 'echarts';
import type { LineSeriesOption } from 'echarts';
import { darkMode } from '@osd/ui-shared-deps/theme';
import { getSeriesDisplayName } from '../utils/series';
import { AreaChartStyle, DEFAULT_FILL_OPACITY } from './area_vis_config';

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
import { resolveStackMode } from '../utils/data_transformation';
import {
  DEFAULT_LINE_WIDTH,
  getLineDashType,
  getLineInterpolation,
  getPointSymbol,
  buildValueLabel,
} from '../style_panel/share/index';

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

export const getOpacityGradientBaselineColor = () =>
  darkMode ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)';

export const buildAreaStyle = (styles: AreaChartStyle, seriesColor: string) => {
  const opacity = styles.areaOpacity ?? DEFAULT_FILL_OPACITY;

  const gradientMode = styles.gradientMode ?? 'none';

  if (gradientMode === 'none') {
    return { opacity };
  }

  // The gradient's far end: transparent for `opacity` mode, a lighter hue for `hue` mode.
  const baselineColor =
    gradientMode === 'opacity'
      ? getOpacityGradientBaselineColor()
      : lightenHexColor(seriesColor, HUE_GRADIENT_LIGHTEN_RATIO);

  return {
    opacity,
    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: seriesColor },
      { offset: 1, color: baselineColor },
    ]),
  };
};

export const buildBorderLineStyle = (styles: AreaChartStyle) => ({
  width: styles.lineStyle === 'dots' ? 0 : (styles.lineWidth ?? DEFAULT_LINE_WIDTH),
  type: getLineDashType(styles.lineDashStyle),
});

export const buildBorderInterpolation = (styles: AreaChartStyle) =>
  getLineInterpolation(styles.lineMode ?? 'smooth');

export const buildStackConfig = (styles: AreaChartStyle) =>
  resolveStackMode(styles) === 'none' ? {} : { stack: 'total' };

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
    const borderLineStyle = buildBorderLineStyle(styles);
    const interpolation = buildBorderInterpolation(styles);
    const pointSymbol = getPointSymbol(styles.pointSize, styles.showValues);
    const series = seriesFields?.map((item: string, index: number) => {
      const name = getSeriesDisplayName(item, allColumns);
      const color = getLegendColor(name, palette, sortedNames);
      legendItems.push(createSeriesLegendItem(name, color));

      return {
        name,
        type: 'line',
        ...pointSymbol,
        ...(styles.lineStyle === 'line'
          ? styles.showValues
            ? { showSymbol: true, symbolSize: 0 }
            : { showSymbol: false }
          : {}),
        ...buildValueLabel({
          showValues: styles.showValues,
          valueField: item,
          decimals: styles.decimals,
          unitId: styles.unitId,
          unitSuffix: styles.unitSuffix,
          isPercentage: resolveStackMode(styles) === 'percentage',
          isStack: resolveStackMode(styles) !== 'none',
        }),
        // TODO remove it for connection/disconnection
        connectNulls: true,
        ...stackConfig,
        areaStyle: buildAreaStyle(styles, color),
        lineStyle: borderLineStyle,
        ...interpolation,
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
