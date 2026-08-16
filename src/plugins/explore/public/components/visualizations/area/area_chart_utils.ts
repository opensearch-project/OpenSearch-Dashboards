/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineSeriesOption } from 'echarts';
import { getSeriesDisplayName } from '../utils/series';
import { AreaChartStyle } from './area_vis_config';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { generateThresholdLines } from '../utils/utils';
import { getColors } from '../theme/default_colors';
import { DEFAULT_OPACITY } from '../constants';
import {
  createSeriesLegendItem,
  getLegendColor,
  getLegendNameDomain,
  LegendItem,
} from '../utils/legend';
import { resolveStackMode } from '../utils/data_transformation';

export const buildStackConfig = (styles: AreaChartStyle) =>
  resolveStackMode(styles) === 'none' ? {} : { stack: 'total' };

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
  }: {
    styles: AreaChartStyle;
    seriesFields: string[] | ((headers?: string[]) => string[]);
    categoryField: string;
    allData?: Array<Record<string, any>>;
    colorField?: string;
  }): PipelineFn<T> =>
  (state) => {
    const { transformedData = [], axisColumnMappings } = state;
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

    const thresholdLines = generateThresholdLines(styles.thresholdOptions);
    const legendItems: LegendItem[] = [];
    const stackConfig = buildStackConfig(styles);
    const series = seriesFields?.map((item: string, index: number) => {
      const name = getSeriesDisplayName(item, allColumns);
      const color = getLegendColor(name, palette, sortedNames);
      legendItems.push(createSeriesLegendItem(name, color));

      return {
        name,
        type: 'line',
        ...stackConfig,
        showSymbol: false,
        connectNulls: true,
        areaStyle: {
          opacity: styles.areaOpacity || DEFAULT_OPACITY,
        },
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
        ...(index === 0 && thresholdLines),
      };
    });

    newState.series = series as LineSeriesOption[];
    newState.legendItems = legendItems;

    return newState;
  };
