/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StandardAxes,
  VisFieldType,
  VisColumn,
  TimeUnit,
  AggregationType,
  AxisRole,
} from '../types';
import { applyAxisStyling, getSchemaByAxis } from '../utils/utils';
import { getSeriesDisplayName } from '../utils/series';
import { AreaChartStyle } from './area_vis_config';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';

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

export const buildEncoding = (
  axis: VisColumn | undefined,
  axisStyle: StandardAxes | undefined,
  interval: TimeUnit | undefined,
  aggregationType?: AggregationType | undefined
) => {
  const defaultAxisTitle = '';
  const encoding: any = {
    field: axis?.column,
    type: getSchemaByAxis(axis),
    axis: applyAxisStyling({ axis, axisStyle, defaultAxisTitle }),
  };

  if (axis?.schema === VisFieldType.Date && interval) {
    encoding.timeUnit = interval;
    encoding.axis.tickCount = transformIntervalsToTickCount(interval);
  }

  if (axis?.schema === VisFieldType.Numerical && aggregationType) {
    encoding.aggregate = aggregationType;
  }

  return encoding;
};

export const buildTooltipEncoding = (
  axis: VisColumn | undefined,
  axisStyle: StandardAxes | undefined,
  interval: TimeUnit | undefined,
  aggregationType?: AggregationType | undefined
) => {
  const encoding: any = {
    field: axis?.column,
    type: getSchemaByAxis(axis),
    title: axisStyle?.title?.text || axis?.name,
  };

  if (axis?.schema === VisFieldType.Date && interval) {
    encoding.timeUnit = interval;
  }

  if (axis?.schema === VisFieldType.Numerical && aggregationType) {
    encoding.aggregate = aggregationType;
    encoding.title = axisStyle?.title?.text || `${axis?.name}(${aggregationType})`;
  }
  return encoding;
};

export const buildThresholdColorEncoding = (
  numericalField: VisColumn | undefined,
  styleOptions: Partial<AreaChartStyle>
) => {
  // support old thresholdLines config to be compatible with new thresholds

  const activeThresholds = styleOptions?.thresholdOptions?.thresholds ?? [];

  const thresholdWithBase = [
    { value: 0, color: styleOptions?.thresholdOptions?.baseColor ?? getColors().statusGreen },
    ...activeThresholds,
  ];

  const colorDomain = thresholdWithBase.reduce<number[]>((acc, val) => [...acc, val.value], []);

  const colorRange = thresholdWithBase.reduce<string[]>((acc, val) => [...acc, val.color], []);

  // exclusive for single numerical bucket area
  if (!numericalField)
    return {
      aggregate: AggregationType.COUNT,
      type: 'quantitative',
      scale: {
        type: 'threshold',
        domain: colorDomain,
        // require one more color for values below the first threshold(base)
        range: [DEFAULT_GREY, ...colorRange],
      },
      legend: styleOptions.addLegend
        ? {
            orient: styleOptions.legendPosition?.toLowerCase() || 'right',
            title: 'Thresholds',
          }
        : null,
    };

  const colorLayer = {
    field: numericalField?.column,
    type: 'quantitative',
    scale: {
      type: 'threshold',
      domain: colorDomain,
      range: [DEFAULT_GREY, ...colorRange],
    },
    legend: styleOptions.addLegend
      ? {
          orient: styleOptions.legendPosition?.toLowerCase() || 'right',
          title: 'Thresholds',
        }
      : null,
  };

  return colorLayer;
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

  const series = seriesFields?.map((item: string) => {
    const name = getSeriesDisplayName(item, Object.values(axisColumnMappings));

    return {
      name,
      type: 'line' as const,
      connectNulls: true,
      areaStyle: {
        opacity: styles.areaOpacity || 0.3,
      },
      smooth: true,
      encode: {
        x: categoryField,
        y: item,
      },
      emphasis: {
        focus: 'self' as const,
      },
    };
  });

  newState.series = series;

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

  const allSeries = transformedData?.map((seriesData: any[], index: number) => {
    const header = seriesData[0];
    const cateColumns = seriesFields(header);
    return cateColumns.map((item: string) => ({
      name: String(item),
      type: 'line' as const,
      stack: `Total_${index}` as const, // Use unique stack name for each facet
      connectNulls: true,
      areaStyle: {
        opacity: styles.areaOpacity || 0.3,
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
        focus: 'self' as const,
      },
    }));
  });

  newState.series = allSeries?.flat();

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
    throw new Error('transformedData must be an array with data rows');
  }

  // Data is already aggregated, just use it directly
  (newState as any).dataset = [
    {
      source: transformedData,
    },
  ];

  const series = [
    {
      type: 'line' as const,
      name: getSeriesDisplayName(valueField, Object.values(axisColumnMappings)),
      connectNulls: true,
      areaStyle: {
        opacity: styles.areaOpacity || 0.3,
      },
      smooth: true,
      encode: {
        x: categoryField,
        y: valueField,
      },
      emphasis: {
        focus: 'self' as const,
      },
    },
  ];

  newState.series = series;
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
  newState.series = [];
  delete newState.spec;

  if (!axisColumnMappings) {
    throw new Error('axisColumnMappings must be available for createStackAreaSeries');
  }

  if (!aggregatedData) {
    throw new Error('aggregatedData must be available for createStackAreaSeries');
  }

  // Check if aggregatedData is in the expected 2D array format
  if (!Array.isArray(aggregatedData) || aggregatedData.length < 2) {
    throw new Error('aggregatedData must be a 2D array with header and data rows');
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
  const newseries = cateColumns.map((categoryName: string) => ({
    name: String(categoryName),
    type: 'line' as const,
    stack: 'Total' as const,
    areaStyle: {
      opacity: styles.areaOpacity || 0.3,
    },
    smooth: true,
    connectNulls: true,
    encode: {
      x: xAxis.column,
      y: categoryName,
    },
    emphasis: {
      focus: 'self' as const,
    },
  }));

  // Series created successfully
  newState.series = newseries;

  return newState;
};
