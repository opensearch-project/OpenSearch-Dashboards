/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterSeriesOption } from 'echarts';
import { getSeriesDisplayName } from '../utils/series';
import { ScatterChartStyle } from './scatter_vis_config';
import { BaseChartStyle, EChartsSpecState, PipelineFn } from '../utils/echarts_spec';
import { generateThresholdLines } from '../utils/utils';
import { normalizeEmptyValue } from '../utils/data_transformation';
import { getColors } from '../theme/default_colors';
import { PointShape } from '../types';
import { DEFAULT_GRID } from '../constants';

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

  const categories = [...new Set(dataRows.map((row) => normalizeEmptyValue(row[colorFieldIndex])))];
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
    const category = normalizeEmptyValue(row[colorFieldIndex]);
    const size = Number(row[sizeFieldIndex]);
    if (isNaN(size)) return;
    // Track size range
    minSize = Math.min(minSize, size);
    maxSize = Math.max(maxSize, size);

    // Add point to corresponding category
    seriesData[category].push([x, y, size]);
  });

  // Handle case where no valid data points were found
  if (minSize === Infinity || maxSize === -Infinity) {
    minSize = 0;
    maxSize = 0;
  }

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
      name: getSeriesDisplayName(yField, Object.values(axisColumnMappings).flat()),
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
  const palette = getColors().categories;
  const sortedCategories = [...categories].map(String).sort();

  // Create multiple scatter series
  const series = categories.map((category) => {
    const name = String(category);
    const colorIndex = sortedCategories.indexOf(name);
    return {
      name,
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
            color: palette[colorIndex % palette.length],
          }
        : {
            opacity: 0.8,
            color: 'transparent',
            borderColor: palette[colorIndex % palette.length],
            borderWidth: 2,
          },
      emphasis: {
        focus: 'series',
        scale: 1.2,
      },
      ...thresholdLines,
    };
  }) as ScatterSeriesOption[];

  // Set the pivot dataset and series
  newState.transformedData = pivotDataset;
  newState.series = series;

  return newState;
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
  const { transformedData = [] } = state;
  const newState = { ...state };

  if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
    newState.series = [];
    return newState;
  }

  const headers = transformedData[0] ?? [];

  // Transform data using multi-series approach
  const { categories, seriesData, sizeRange } = transformToMultiSeriesWithSize(
    transformedData,
    xField,
    yField,
    colorField,
    sizeField
  );

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);
  const palette = getColors().categories;
  const sortedCategories = [...categories].map(String).sort();

  // Create multiple scatter series, one for each color category
  // Data format: [x, y, size] where size is at dimension 2 for visualMap
  const series = categories.map((category) => {
    const name = String(category);
    const colorIndex = sortedCategories.indexOf(name);
    return {
      name,
      type: 'scatter',
      symbol: mapPointShapeToEChartsSymbol(styles.exclusive?.pointShape),
      symbolRotate: styles.exclusive?.angle || 0,
      data: seriesData[category], // [x, y, size] format
      itemStyle: styles.exclusive?.filled
        ? {
            opacity: 0.7,
            color: palette[colorIndex % palette.length],
          }
        : {
            opacity: 0.7,
            color: 'transparent',
            borderColor: palette[colorIndex % palette.length],
            borderWidth: 2,
          },
      emphasis: {
        focus: 'series',
        scale: 1.2,
      },
      ...thresholdLines,
    };
  }) as ScatterSeriesOption[];

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
    dimension: 2, // data type is [x, y, size] format
    min: sizeRange.min,
    max: sizeRange.max,
    itemWidth: 15,
    // itemHeight: 120,
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

export const assembleScatterSpec = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const grid = { ...DEFAULT_GRID };
  const { visualMap, spec } = state;
  if (visualMap && !Array.isArray(visualMap)) {
    if (visualMap.bottom === 'bottom') {
      grid.bottom = 70;
    }
    if (visualMap.right === 'right') {
      grid.right = 50;
    }
  }

  return { ...state, spec: { ...spec, grid } };
};
