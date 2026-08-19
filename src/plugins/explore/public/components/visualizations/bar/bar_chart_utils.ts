/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarSeriesOption } from 'echarts';
import { TimeUnit } from '../types';
import { generateThresholdLines } from '../utils/utils';
import { BarChartStyle } from './bar_vis_config';
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
import { DEFAULT_BAR_FILL_OPACITY } from '../style_panel/share';

export const buildStackConfig = (styles: BarChartStyle) =>
  'stackMode' in styles && resolveStackMode(styles) === 'none' ? {} : { stack: 'total' };

export const buildFillOpacity = (styles: BarChartStyle) =>
  'fillOpacity' in styles ? (styles.fillOpacity ?? DEFAULT_BAR_FILL_OPACITY) / 100 : undefined;

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
          ...(styles?.showBarBorder && {
            borderWidth: styles.barBorderWidth,
            borderColor: styles.barBorderColor,
          }),
        },
        // Apply stack configuration based on stackMode
        ...stackConfig,
      };

      return seriesConfig as BarSeriesOption;
    }) as BarSeriesOption[];
    newState.series = series;
    newState.legendItems = legendItems;

    return newState;
  };
