/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterSeriesOption } from 'echarts';
import { getSeriesDisplayName } from '../utils/series';
import { ScatterChartStyle } from './scatter_vis_config';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { generateThresholdLines } from '../utils/utils';
import { PointShape } from '../types';

/**
 * Maps PointShape enum values to ECharts symbol types
 */
const mapPointShapeToEChartsSymbol = (pointShape?: PointShape): string => {
  switch (pointShape) {
    case PointShape.CIRCLE:
      return 'circle';
    case PointShape.SQUARE:
      return 'rect';
    case PointShape.CROSS:
      // use custom SVG path
      return 'path://M12,2 L12,10 L20,10 L20,14 L12,14 L12,22 L8,22 L8,14 L0,14 L0,10 L8,10 L8,2 Z';
    case PointShape.DIAMOND:
      return 'diamond';
    default:
      return 'circle';
  }
};

/**
 * Transforms data for scatter charts with both color and size encoding
 * Groups data by color category while preserving size information for each point
 */
export const transformToMultiSeriesWithSize = (
  transformedData: any[][],
  xField: string,
  yField: string,
  colorField: string,
  sizeField: string
): {
  categories: string[];
  seriesData: Record<string, any[][]>;
  sizeRange: { min: number; max: number };
} => {
  if (!transformedData || transformedData.length < 2) {
    throw new Error('transformedData must have at least header and one data row');
  }

  const headerRow = transformedData[0] as string[];
  const dataRows = transformedData.slice(1);

  const xFieldIndex = headerRow.indexOf(xField);
  const yFieldIndex = headerRow.indexOf(yField);
  const colorFieldIndex = headerRow.indexOf(colorField);
  const sizeFieldIndex = headerRow.indexOf(sizeField);

  if (xFieldIndex === -1 || yFieldIndex === -1 || colorFieldIndex === -1 || sizeFieldIndex === -1) {
    throw new Error(
      `Cannot find field indices: x=${xFieldIndex}, y=${yFieldIndex}, color=${colorFieldIndex}, size=${sizeFieldIndex}`
    );
  }

  const categories = [
    ...new Set(dataRows.map((row) => String(row[colorFieldIndex] || 'undefined'))),
  ];
  const seriesData: Record<string, any[][]> = {};
  let minSize = Infinity;
  let maxSize = -Infinity;

  // Initialize arrays for each category
  categories.forEach((category) => {
    seriesData[String(category)] = [];
  });

  // Group data points by color category
  dataRows.forEach((row) => {
    const x = row[xFieldIndex];
    const y = row[yFieldIndex];
    const category = String(row[colorFieldIndex] || 'undefined');
    const size = Number(row[sizeFieldIndex]);
    if (isNaN(size) || size <= 0) return;
    // Track size range
    minSize = Math.min(minSize, size);
    maxSize = Math.max(maxSize, size);

    // Add point to corresponding category
    seriesData[category].push([x, y, size]);
  });

  return {
    categories,
    seriesData,
    sizeRange: { min: minSize, max: maxSize },
  };
};

/**
 * Create basic scatter series configuration for ECharts
 */
export const createScatterSeries = <T extends BaseChartStyle>({
  styles,
  xField,
  yField,
}: {
  styles: ScatterChartStyle;
  xField: string;
  yField: string;
}): PipelineFn<T> => (state) => {
  const { transformedData = [], axisColumnMappings } = state;
  const newState = { ...state };

  if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
    newState.series = [];
    return newState;
  }

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);
  const series = [
    {
      type: 'scatter',
      name: getSeriesDisplayName(yField, Object.values(axisColumnMappings)),
      symbolSize: 8,
      symbol: mapPointShapeToEChartsSymbol(styles.exclusive?.pointShape),
      symbolRotate: styles.exclusive?.angle || 0,
      itemStyle: styles.exclusive?.filled
        ? {
            opacity: 0.8,
          }
        : {
            opacity: 0.8,
            color: 'transparent',
            borderColor: 'auto',
            borderWidth: 2,
          },
      encode: {
        x: xField,
        y: yField,
      },
      emphasis: {
        focus: 'self',
        scale: 1.2,
      },
      ...thresholdLines,
    },
  ] as ScatterSeriesOption[];

  newState.series = series;
  return newState;
};

/**
 * Create category scatter series with multiple series (one per category)
 * Expects data already in pivot format: ['x', 'A', 'B', 'C', ...] from the universal pivot function
 */
export const createCategoryScatterSeries = <T extends BaseChartStyle>({
  styles,
  xField,
  yField,
  colorField,
}: {
  styles: ScatterChartStyle;
  xField: string;
  yField: string;
  colorField: string;
}): PipelineFn<T> => (state) => {
  const { transformedData = [] } = state;
  const newState = { ...state };

  if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
    newState.series = [];
    return newState;
  }

  // Data is already in pivot format from the pipe: ['x', 'A', 'B', 'C', ...]
  const pivotDataset = transformedData;
  const pivotHeader = pivotDataset[0] as string[];

  // Extract categories (skip the first column which is xField)
  const categories = pivotHeader.slice(1);

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);

  // Create multiple scatter series
  const series = categories.map((category) => ({
    name: String(category),
    type: 'scatter',
    symbolSize: 8,
    symbol: mapPointShapeToEChartsSymbol(styles.exclusive?.pointShape),
    symbolRotate: styles.exclusive?.angle || 0,
    encode: {
      x: xField,
      y: category,
    },
    itemStyle: styles.exclusive?.filled
      ? {
          opacity: 0.8,
        }
      : {
          opacity: 0.8,
          color: 'transparent',
          borderColor: 'auto',
          borderWidth: 2,
        },
    emphasis: {
      focus: 'series',
      scale: 1.2,
    },
    ...thresholdLines,
  })) as ScatterSeriesOption[];

  // Set the pivot dataset and series
  newState.transformedData = pivotDataset;
  newState.series = series;

  return newState;
};

/**
 * Custom spec assembly for category scatter charts with dataset support
 */
export const assembleCategoryScatterSpec = <T extends BaseChartStyle>() => (state: any) => {
  const { styles, axisConfig, series, transformedData } = state;

  const spec = {
    title: {
      text: styles.titleOptions?.show ? styles.titleOptions?.titleName : undefined,
    },
    tooltip: {
      trigger: 'item',
      show: styles.tooltipOptions?.mode !== 'hidden',
    },
    legend: {
      show: styles.addLegend,
    },
    xAxis: {
      type: 'value',
      name: axisConfig?.xAxisStyle?.title?.text || axisConfig?.xAxis?.name,
      nameLocation: 'middle',
      nameGap: 35,
    },
    yAxis: {
      type: 'value',
      name: axisConfig?.yAxisStyle?.title?.text || axisConfig?.yAxis?.name,
      nameLocation: 'middle',
      nameGap: 50,
    },
    // Use dataset for pivot data format
    dataset: {
      source: transformedData,
    },
    series,
  };

  return { ...state, spec };
};

/**
 * Create scatter series with both color and size encoding
 */
export const createSizeScatterSeries = <T extends BaseChartStyle>({
  styles,
  xField,
  yField,
  colorField,
  sizeField,
}: {
  styles: ScatterChartStyle;
  xField: string;
  yField: string;
  colorField: string;
  sizeField: string;
}): PipelineFn<T> => (state) => {
  const { transformedData = [], axisColumnMappings } = state;
  const newState = { ...state };

  if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
    newState.series = [];
    // Set default visualMap for empty data
    newState.visualMap = {
      show: false,
      type: 'continuous',
      dimension: 2,
      min: 0,
      max: 10,
      text: ['Max', 'Min'],
      inRange: {
        symbolSize: [5, 25],
      },
    };
    return newState;
  }

  const headers = transformedData[0] ?? [];
  const sizeDimension = headers.indexOf(sizeField);

  // Transform data using multi-series approach
  const { categories, seriesData, sizeRange } = transformToMultiSeriesWithSize(
    transformedData,
    xField,
    yField,
    colorField,
    sizeField
  );

  const sizeAxisMapping = Object.values(axisColumnMappings).find(
    (mapping) => mapping.column === sizeField
  );
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const sizeAxisName = sizeAxisMapping?.name || sizeField;
  const thresholdLines = generateThresholdLines(styles.thresholdOptions);

  // Create multiple scatter series, one for each color category
  // Data format: [x, y, size] where size is at dimension 2 for visualMap
  const series = categories.map((category) => ({
    name: String(category),
    type: 'scatter',
    symbol: mapPointShapeToEChartsSymbol(styles.exclusive?.pointShape),
    symbolRotate: styles.exclusive?.angle || 0,
    data: seriesData[category], // [x, y, size] format
    itemStyle: styles.exclusive?.filled
      ? {
          opacity: 0.7,
        }
      : {
          opacity: 0.7,
          color: 'transparent',
          borderColor: 'auto',
          borderWidth: 2,
        },
    emphasis: {
      focus: 'series',
      scale: 1.2,
    },
    ...thresholdLines,
  })) as ScatterSeriesOption[];

  // Set series and visualMap
  newState.series = series;

  // Position visualMap according to legendPosition (same as color legend)
  const legendPosition = styles.legendPosition || 'bottom';

  const getVisualMapConfig = () => {
    switch (legendPosition) {
      case 'left':
      case 'top':
      case 'bottom':
        return {
          orient: 'vertical',
          right: 'right',
          top: 'middle',
        };
      case 'right':
        return {
          orient: 'horizontal',
          bottom: 'bottom',
          left: 'middle',
        };
    }
  };

  // @ts-expect-error TS2322 TODO(ts-error): fixme
  newState.visualMap = {
    show: styles.addLegend === true,
    type: 'continuous',
    dimension: sizeDimension,
    min: sizeRange.min,
    max: sizeRange.max,
    // text: [`${sizeAxisName} Max`, `${sizeAxisName} Min`],
    inRange: {
      symbolSize: [5, 25],
    },
    outOfRange: {
      symbolSize: [5, 25],
      color: ['rgba(255,255,255,0.4)'],
    },
    ...getVisualMapConfig(),
  };

  return newState;
};
