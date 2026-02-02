/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineSeriesOption } from 'echarts';
import { TimeUnit, AxisRole } from '../types';
import { getSeriesDisplayName } from '../utils/series';
import { AreaChartStyle } from './area_vis_config';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { generateThresholdLines } from '../utils/utils';
import { DEFAULT_OPACITY } from '../constants';

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

export const transformIntervalsToTickCount = (interval: TimeUnit | undefined) => {
  switch (interval) {
    case TimeUnit.YEAR:
      return 'year';
    case TimeUnit.MONTH:
      return 'month';
    case TimeUnit.DATE:
      return 'day';
    case TimeUnit.HOUR:
      return 'hour';
    case TimeUnit.MINUTE:
      return 'minute';
    case TimeUnit.SECOND:
      return 'second';
    default:
      return 'day';
  }
};

/**
 * Create area series configuration for ECharts
 */
export const createAreaSeries = <T extends BaseChartStyle>({
  styles,
  seriesFields,
  categoryField,
}: {
  styles: AreaChartStyle;
  seriesFields: string[] | ((headers?: string[]) => string[]);
  categoryField: string;
}): PipelineFn<T> => (state) => {
  const { transformedData = [], axisColumnMappings } = state;
  const newState = { ...state };

  if (!Array.isArray(seriesFields)) {
    seriesFields = seriesFields(transformedData[0]);
  }

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);
  const series = seriesFields?.map((item: string, index: number) => {
    const name = getSeriesDisplayName(item, Object.values(axisColumnMappings));

    return {
      name,
      type: 'line',
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
      ...(index === 0 && thresholdLines),
    };
  });

  newState.series = series as LineSeriesOption[];

  return newState;
};

/**
 * Create faceted area series configuration for ECharts
 */
export const createFacetAreaSeries = <T extends BaseChartStyle>({
  styles,
  seriesFields,
  categoryField,
}: {
  styles: AreaChartStyle;
  seriesFields: (headers?: string[]) => string[];
  categoryField: string;
}): PipelineFn<T> => (state) => {
  const { transformedData } = state;
  const newState = { ...state };
  const thresholdLines = generateThresholdLines(styles.thresholdOptions);

  const allSeries = transformedData?.map((seriesData: any[], index: number) => {
    const header = seriesData[0];
    const cateColumns = seriesFields(header);
    return cateColumns.map((item: string, seriesIndex: number) => ({
      name: String(item),
      type: 'line',
      showSymbol: false,
      stack: `Total_${index}`, // Use unique stack name for each facet
      connectNulls: true,
      areaStyle: {
        opacity: styles.areaOpacity || DEFAULT_OPACITY,
      },
      smooth: true,
      encode: {
        x: categoryField,
        y: item,
      },
      datasetIndex: index,
      gridIndex: index,
      xAxisIndex: index,
      yAxisIndex: index,
      emphasis: {
        focus: 'self',
      },
      ...(seriesIndex === 0 && (thresholdLines as any)),
    }));
  });

  newState.series = allSeries?.flat() as LineSeriesOption[];

  return newState;
};

/**
 * Create category-based area series with aggregation
 */
export const createCategoryAreaSeries = <T extends BaseChartStyle>({
  styles,
  categoryField,
  valueField,
}: {
  styles: AreaChartStyle;
  categoryField: string;
  valueField: string;
}): PipelineFn<T> => (state) => {
  const { transformedData, axisColumnMappings } = state;
  const newState = { ...state };

  if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
    newState.series = [];
    return newState;
  }

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);
  const series = [
    {
      type: 'line',
      showSymbol: false,
      name: getSeriesDisplayName(valueField, Object.values(axisColumnMappings)),
      connectNulls: true,
      areaStyle: {
        opacity: styles.areaOpacity || DEFAULT_OPACITY,
      },
      smooth: true,
      encode: {
        x: categoryField,
        y: valueField,
      },
      emphasis: {
        focus: 'self',
      },
      ...thresholdLines,
    },
  ];

  newState.series = series as LineSeriesOption[];
  return newState;
};

/**
 * Create stack area series configuration based on aggregatedData
 */
export const createStackAreaSeries = <T extends BaseChartStyle>(
  styles: AreaChartStyle
): PipelineFn<T> => (state) => {
  const { axisColumnMappings, transformedData: aggregatedData } = state;
  const newState = { ...state };
  const thresholdLines = generateThresholdLines(styles.thresholdOptions);

  if (!axisColumnMappings) {
    throw new Error('axisColumnMappings must be available for createStackAreaSeries');
  }

  if (!aggregatedData || !Array.isArray(aggregatedData) || aggregatedData.length < 2) {
    newState.series = [];
    return newState;
  }

  // Find the x-axis column from axisColumnMappings
  const xAxis = axisColumnMappings[AxisRole.X];

  if (!xAxis?.column) {
    throw new Error('xAxis column must be available for createStackAreaSeries');
  }

  // Get category columns from the first row (header), excluding the x-axis column
  const headerRow = aggregatedData[0] as string[];
  const cateColumns = headerRow.filter((c: string) => c !== xAxis.column);

  if (!cateColumns || cateColumns.length === 0) {
    throw new Error('No category columns found for stacked area series');
  }

  // Create multi-series for each category column
  const newseries = cateColumns.map((categoryName: string, index: number) => ({
    name: String(categoryName),
    type: 'line',
    showSymbol: false,
    stack: 'Total',
    areaStyle: {
      opacity: styles.areaOpacity || DEFAULT_OPACITY,
    },
    smooth: true,
    connectNulls: true,
    encode: {
      x: xAxis.column,
      y: categoryName,
    },
    emphasis: {
      focus: 'self',
    },
    ...(index === 0 && thresholdLines),
  }));

  // Series created successfully
  newState.series = newseries as LineSeriesOption[];

  return newState;
};
