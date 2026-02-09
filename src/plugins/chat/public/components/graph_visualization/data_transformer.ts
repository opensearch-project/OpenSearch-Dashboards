/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SimpleDataPoint,
  PrometheusData,
  NormalizedSeries,
  ChartData,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  ChartError,
  TransformationResult,
  GraphTimeseriesDataArgs,
} from './types';

/**
 * Color palette for chart series
 */
const DEFAULT_SERIES_COLORS = [
  '#006BB4',
  '#017D73',
  '#F5A700',
  '#BD271E',
  '#DD0A73',
  '#8C4B9B',
  '#54B399',
  '#6092C0',
  '#D36086',
  '#9170B8',
];

/**
 * Validates and parses a timestamp to a Date object
 * @param timestamp - The timestamp to parse (string, number, or Date)
 * @returns Parsed Date object or null if invalid
 */
export function parseTimestamp(timestamp: string | number | Date): Date | null {
  if (!timestamp) {
    return null;
  }

  // If already a Date object
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }

  // If it's a number (Unix timestamp)
  if (typeof timestamp === 'number') {
    // Handle both seconds and milliseconds timestamps
    const date = timestamp > 1e10 ? new Date(timestamp) : new Date(timestamp * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  // If it's a string
  if (typeof timestamp === 'string') {
    // Try parsing as ISO string first
    let date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing as Unix timestamp string
    const numericTimestamp = parseFloat(timestamp);
    if (!isNaN(numericTimestamp)) {
      date =
        numericTimestamp > 1e10 ? new Date(numericTimestamp) : new Date(numericTimestamp * 1000);
      return isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

/**
 * Validates and parses a numeric value
 * @param value - The value to parse
 * @returns Parsed number or null if invalid
 */
export function parseValue(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? null : value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) || !isFinite(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Generates a series name from Prometheus metric labels
 * @param metric - The metric labels object
 * @returns Generated series name
 */
export function generateSeriesName(metric: Record<string, string>): string {
  if (!metric || Object.keys(metric).length === 0) {
    return 'Series';
  }

  // Common label priorities for naming
  const priorityLabels = ['__name__', 'job', 'instance', 'service', 'app', 'name'];

  for (const label of priorityLabels) {
    if (metric[label]) {
      return metric[label];
    }
  }

  // If no priority labels found, use the first available label
  const firstKey = Object.keys(metric)[0];
  return metric[firstKey] || 'Series';
}

/**
 * Generates a unique series ID from metric labels
 * @param metric - The metric labels object
 * @param index - Fallback index if no unique ID can be generated
 * @returns Unique series ID
 */
export function generateSeriesId(metric: Record<string, string>, index: number): string {
  if (!metric || Object.keys(metric).length === 0) {
    return `series_${index}`;
  }

  // Create a stable ID from sorted label key-value pairs
  const sortedEntries = Object.entries(metric).sort(([a], [b]) => a.localeCompare(b));
  const idString = sortedEntries.map(([key, value]) => `${key}=${value}`).join(',');

  return idString || `series_${index}`;
}

/**
 * Transforms simple data point arrays to normalized series format
 * @param data - Array of simple data points
 * @param seriesName - Optional name for the series
 * @returns Normalized series array
 */
export function transformSimpleDataPoints(
  data: SimpleDataPoint[],
  seriesName: string = 'Data'
): NormalizedSeries[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const validDataPoints: Array<{ x: Date; y: number }> = [];

  for (const point of data) {
    const timestamp = parseTimestamp(point.timestamp);
    const value = parseValue(point.value);

    if (timestamp && value !== null) {
      validDataPoints.push({ x: timestamp, y: value });
    }
  }

  if (validDataPoints.length === 0) {
    return [];
  }

  // Sort by timestamp
  validDataPoints.sort((a, b) => a.x.getTime() - b.x.getTime());

  return [
    {
      id: 'simple_series_0',
      name: seriesName,
      data: validDataPoints,
      color: DEFAULT_SERIES_COLORS[0],
      visible: true,
    },
  ];
}

/**
 * Transforms Prometheus-style data to normalized series format
 * @param data - Prometheus data structure
 * @returns Normalized series array
 */
export function transformPrometheusData(data: PrometheusData): NormalizedSeries[] {
  if (!data || !Array.isArray(data.result) || data.result.length === 0) {
    return [];
  }

  const series: NormalizedSeries[] = [];

  for (let i = 0; i < data.result.length; i++) {
    const result = data.result[i];

    if (!result || !Array.isArray(result.values)) {
      continue;
    }

    const validDataPoints: Array<{ x: Date; y: number }> = [];

    for (const [timestamp, value] of result.values) {
      const parsedTimestamp = parseTimestamp(timestamp);
      const parsedValue = parseValue(value);

      if (parsedTimestamp && parsedValue !== null) {
        validDataPoints.push({ x: parsedTimestamp, y: parsedValue });
      }
    }

    if (validDataPoints.length === 0) {
      continue;
    }

    // Sort by timestamp
    validDataPoints.sort((a, b) => a.x.getTime() - b.x.getTime());

    const seriesId = generateSeriesId(result.metric, i);
    const seriesName = generateSeriesName(result.metric);
    const seriesColor = DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length];

    series.push({
      id: seriesId,
      name: seriesName,
      data: validDataPoints,
      color: seriesColor,
      visible: true,
    });
  }

  return series;
}

/**
 * Validates input data and determines its format
 * @param data - Input data to validate
 * @returns Object indicating data type and validity
 */
export function validateInputData(
  data: any
): {
  isValid: boolean;
  type: 'simple' | 'prometheus' | 'unknown';
  error?: string;
} {
  if (!data) {
    return { isValid: false, type: 'unknown', error: 'Data is null or undefined' };
  }

  // Check for simple data point array
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { isValid: false, type: 'simple', error: 'Data array is empty' };
    }

    // Check if first element has required properties
    const firstItem = data[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      if ('timestamp' in firstItem && 'value' in firstItem) {
        return { isValid: true, type: 'simple' };
      }
    }

    return {
      isValid: false,
      type: 'unknown',
      error: 'Array elements do not match simple data point format',
    };
  }

  // Check for Prometheus data format
  if (typeof data === 'object' && data !== null) {
    if ('result' in data && Array.isArray(data.result)) {
      if (data.result.length === 0) {
        return { isValid: false, type: 'prometheus', error: 'Prometheus result array is empty' };
      }

      // Check if first result has required structure
      const firstResult = data.result[0];
      if (typeof firstResult === 'object' && firstResult !== null) {
        if (
          'metric' in firstResult &&
          'values' in firstResult &&
          Array.isArray(firstResult.values)
        ) {
          return { isValid: true, type: 'prometheus' };
        }
      }

      return { isValid: false, type: 'unknown', error: 'Prometheus data structure is malformed' };
    }
  }

  return { isValid: false, type: 'unknown', error: 'Data format not recognized' };
}

/**
 * Main transformation function that handles both data formats
 * @param args - Complete graph data arguments
 * @returns Transformation result with chart data or error
 */
export function transformGraphData(args: GraphTimeseriesDataArgs): TransformationResult {
  try {
    // Validate input data
    const validation = validateInputData(args.data);

    if (!validation.isValid) {
      return {
        success: false,
        error: {
          type: 'data_format',
          message: validation.error || 'Invalid data format',
          details: { dataType: validation.type },
        },
      };
    }

    let series: NormalizedSeries[] = [];

    // Transform based on data type
    if (validation.type === 'simple') {
      const seriesName = args.title || args.yAxisLabel || 'Data';
      series = transformSimpleDataPoints(args.data as SimpleDataPoint[], seriesName);
    } else if (validation.type === 'prometheus') {
      series = transformPrometheusData(args.data as PrometheusData);
    }

    // Check if transformation produced any valid series
    if (series.length === 0) {
      return {
        success: false,
        error: {
          type: 'empty_data',
          message: 'No valid data points found after transformation',
          details: { originalDataType: validation.type },
        },
      };
    }

    // Create chart data structure
    const chartData: ChartData = {
      series,
      title: args.title || 'Time Series Chart',
      xAxisLabel: args.xAxisLabel || 'Time',
      yAxisLabel: args.yAxisLabel || 'Value',
    };

    return {
      success: true,
      data: chartData,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'transformation_error',
        message: 'Error occurred during data transformation',
        details: { originalError: error instanceof Error ? error.message : String(error) },
      },
    };
  }
}

/**
 * Utility function to get data statistics for debugging and validation
 * @param series - Array of normalized series
 * @returns Statistics about the data
 */
export function getDataStatistics(
  series: NormalizedSeries[]
): {
  totalSeries: number;
  totalDataPoints: number;
  timeRange: { start: Date | null; end: Date | null };
  valueRange: { min: number | null; max: number | null };
} {
  if (!series || series.length === 0) {
    return {
      totalSeries: 0,
      totalDataPoints: 0,
      timeRange: { start: null, end: null },
      valueRange: { min: null, max: null },
    };
  }

  let totalDataPoints = 0;
  let minTime: Date | null = null;
  let maxTime: Date | null = null;
  let minValue: number | null = null;
  let maxValue: number | null = null;

  for (const serie of series) {
    totalDataPoints += serie.data.length;

    for (const point of serie.data) {
      // Update time range
      if (!minTime || point.x < minTime) {
        minTime = point.x;
      }
      if (!maxTime || point.x > maxTime) {
        maxTime = point.x;
      }

      // Update value range
      if (minValue === null || point.y < minValue) {
        minValue = point.y;
      }
      if (maxValue === null || point.y > maxValue) {
        maxValue = point.y;
      }
    }
  }

  return {
    totalSeries: series.length,
    totalDataPoints,
    timeRange: { start: minTime, end: maxTime },
    valueRange: { min: minValue, max: maxValue },
  };
}
