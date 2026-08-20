/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarSeriesOption } from 'echarts';
import { TimeUnit } from '../types';
import { formatSeriesValueLabel, generateThresholdLines } from '../utils/utils';
import { BarChartStyle, DEFAULT_BAR_FILL_OPACITY } from './bar_vis_config';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { getSeriesDisplayName } from '../utils/series';
import { getColors } from '../theme/default_colors';
import {
  createSeriesLegendItem,
  getLegendColor,
  getLegendNameDomain,
  LegendItem,
} from '../utils/legend';
import { resolveStackMode } from '../utils/data_transformation';

export const buildStackConfig = (styles: BarChartStyle) =>
  'stackMode' in styles && resolveStackMode(styles) === 'none' ? {} : { stack: 'total' };

export const buildFillOpacity = (styles: BarChartStyle) =>
  'fillOpacity' in styles ? (styles.fillOpacity ?? DEFAULT_BAR_FILL_OPACITY) : undefined;

export const buildBarRadius = ({
  barRadius,
  seriesEncode,
  isStacked,
  isTopSegment,
}: {
  barRadius?: number;
  seriesEncode: 'x' | 'y';
  isStacked: boolean;
  isTopSegment: boolean;
}) => {
  if (!barRadius || barRadius <= 0) return {};
  if (isStacked && !isTopSegment) return {};

  const radius = seriesEncode === 'x' ? [0, barRadius, barRadius, 0] : [barRadius, barRadius, 0, 0];

  return { borderRadius: radius };
};

export const buildValueLabelLayout = (isStacked: boolean) =>
  isStacked ? { hideOverlap: true } : {};

export const buildValueLabel = ({
  styles,
  seriesField,
  headers,
}: {
  styles: BarChartStyle;
  seriesField: string;
  headers?: string[];
}) => {
  if (!styles.showValues) return {};

  const isPercentage = resolveStackMode(styles) === 'percentage';
  const isStacked = resolveStackMode(styles) !== 'none';
  const valueIndex = headers?.indexOf(seriesField) ?? -1;

  return {
    label: {
      show: true,
      position: 'inside' as const,
      formatter: (params: any) => {
        const value =
          Array.isArray(params.value) && valueIndex >= 0 ? params.value[valueIndex] : params.value;
        return formatSeriesValueLabel(value, isPercentage);
      },
    },
    labelLayout: buildValueLabelLayout(isStacked),
  };
};

export const inferTimeIntervals = (data: Array<Record<string, any>>, field: string | undefined) => {
  if (!data || data.length === 0 || !field) {
    return TimeUnit.DATE;
  }

  const timestamps = data
    .map((row) => new Date(row[field]).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  const last = timestamps[timestamps.length - 1];
  const first = timestamps[0];
  const minDiff = last - first;

  const interval = minDiff / 30;

  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;

  if (interval <= second) return TimeUnit.SECOND;
  if (interval <= minute) return TimeUnit.MINUTE;
  if (interval <= hour) return TimeUnit.HOUR;
  if (interval <= day) return TimeUnit.DATE;
  if (interval <= month) return TimeUnit.MONTH;
  return TimeUnit.YEAR;
};

interface Options {
  styles: BarChartStyle;
  categoryField: string;
  seriesFields: string[] | ((headers?: string[]) => string[]);
  categoryEncode: 'x' | 'y';
  seriesEncode: 'x' | 'y';
  allData?: Array<Record<string, any>>;
  colorField?: string;
}

/**
 * Create bar series configuration
 */
export const createBarSeries =
  <T extends BaseChartStyle>(options: Options): PipelineFn<T> =>
  (state) => {
    const {
      styles,
      categoryField,
      categoryEncode = 'x',
      seriesEncode = 'y',
      allData,
      colorField,
    } = options;
    let seriesFields = options.seriesFields;

    const { axisColumnMappings, transformedData = [] } = state;
    const palette = getColors().categories;
    const newState = { ...state };

    if (!Array.isArray(seriesFields)) {
      seriesFields = seriesFields(transformedData[0]);
    }

    const allColumns = Object.values(axisColumnMappings).flat();
    const sortedNames = getLegendNameDomain({
      data: allData,
      nameField: colorField,
      seriesFields,
      columns: allColumns,
    });
    const legendItems: LegendItem[] = [];

    const thresholdLines = generateThresholdLines(options.styles?.thresholdOptions);

    let barWidth: string | undefined;
    if (styles.barSizeMode === 'manual') {
      barWidth = `${(styles.barWidth || 0.7) * 100}%`;
    }
    const stackConfig = buildStackConfig(styles);
    const fillOpacity = buildFillOpacity(styles);
    const isStacked = 'stack' in stackConfig;
    // Series are stacked in order, so assume the last one sits on top of the stack
    const topSegmentIndex = seriesFields.length - 1;
    const headers: string[] | undefined = transformedData[0];

    const series = seriesFields.map((seriesField, index) => {
      const name = getSeriesDisplayName(seriesField, allColumns);
      const color = getLegendColor(name, palette, sortedNames);
      legendItems.push(createSeriesLegendItem(name, color));
      const seriesConfig = {
        type: 'bar',
        emphasis: {
          focus: 'self',
        },
        name,
        encode: {
          [categoryEncode]: categoryField,
          [seriesEncode]: seriesField,
        },
        barWidth,
        ...(index === 0 && thresholdLines),
        itemStyle: {
          color,
          opacity: fillOpacity,
          // apply bar radius
          ...buildBarRadius({
            barRadius: styles?.barRadius,
            seriesEncode,
            isStacked,
            isTopSegment: index === topSegmentIndex,
          }),
          ...(styles?.showBarBorder && {
            borderWidth: styles.barBorderWidth,
            borderColor: styles.barBorderColor,
          }),
        },
        // apply value labels based on showValues
        ...buildValueLabel({
          styles,
          seriesField,
          headers,
        }),
        // Apply stack configuration based on stackMode
        ...stackConfig,
      };

      return seriesConfig as BarSeriesOption;
    }) as BarSeriesOption[];
    newState.series = series;
    newState.legendItems = legendItems;

    return newState;
  };
