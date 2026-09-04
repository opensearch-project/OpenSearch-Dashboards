/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterSeriesOption } from 'echarts';
import { getSeriesDisplayName } from '../utils/series';
import { ScatterChartStyle } from './scatter_vis_config';
import {
  BaseChartStyle,
  EChartsSpecState,
  PipelineFn,
  buildThresholds,
} from '../utils/echarts_spec';
import { generateThresholdLines } from '../utils/utils';
import { normalizeEmptyValue } from '../utils/data_transformation';
import { getColors } from '../theme/default_colors';
import { PointShape, Positions, DataRange } from '../types';
import { DEFAULT_GRID } from '../constants';
import {
  createSeriesLegendItem,
  getLegendColor,
  getLegendNameDomain,
  LegendItem,
} from '../utils/legend';

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
 * Collects [x, y, size] points in one pass, grouped by color category when `colorField` is given
 */
const buildPointSize = (
  transformedData: any[][],
  xField: string,
  yField: string,
  sizeField: string,
  colorField?: string
): {
  categories: string[];
  groups: Record<string, any[][]>;
  points: any[][];
  sizeRange: { min: number; max: number };
} => {
  if (!transformedData || transformedData.length < 2) {
    throw new Error('transformedData must have at least header and one data row');
  }

  const headerRow = transformedData[0] as string[];
  const dataRows = transformedData.slice(1);

  const hasColor = colorField !== undefined;
  const xFieldIndex = headerRow.indexOf(xField);
  const yFieldIndex = headerRow.indexOf(yField);
  const sizeFieldIndex = headerRow.indexOf(sizeField);
  const colorFieldIndex = hasColor ? headerRow.indexOf(colorField) : -1;

  if (
    xFieldIndex === -1 ||
    yFieldIndex === -1 ||
    sizeFieldIndex === -1 ||
    (hasColor && colorFieldIndex === -1)
  ) {
    throw new Error(
      `Cannot find field indices: x=${xFieldIndex}, y=${yFieldIndex}, ` +
        (hasColor ? `color=${colorFieldIndex}, ` : '') +
        `size=${sizeFieldIndex}`
    );
  }

  const categories = hasColor
    ? [...new Set(dataRows.map((row) => normalizeEmptyValue(row[colorFieldIndex])))]
    : [];

  const groups: Record<string, any[][]> = {};
  categories.forEach((key) => {
    groups[key] = [];
  });

  const points: any[][] = [];

  let minSize = Infinity;
  let maxSize = -Infinity;

  dataRows.forEach((row) => {
    const x = row[xFieldIndex];
    const y = row[yFieldIndex];
    const size = Number(row[sizeFieldIndex]);
    if (isNaN(size)) return;
    // Track size range
    minSize = Math.min(minSize, size);
    maxSize = Math.max(maxSize, size);

    if (hasColor) {
      groups[normalizeEmptyValue(row[colorFieldIndex])].push([x, y, size]);
    } else {
      points.push([x, y, size]);
    }
  });

  // Handle case where no valid data points were found
  if (minSize === Infinity || maxSize === -Infinity) {
    minSize = 0;
    maxSize = 0;
  }

  return { categories, groups, points, sizeRange: { min: minSize, max: maxSize } };
};

// for scatter charts with both color and size encoding
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
  const { categories, groups, sizeRange } = buildPointSize(
    transformedData,
    xField,
    yField,
    sizeField,
    colorField
  );
  return { categories, seriesData: groups, sizeRange };
};

// for scatter charts with size encoding but no color encoding
export const transformWithSize = (
  transformedData: any[][],
  xField: string,
  yField: string,
  sizeField: string
): {
  seriesData: any[][];
  sizeRange: { min: number; max: number };
} => {
  const { points, sizeRange } = buildPointSize(transformedData, xField, yField, sizeField);
  return { seriesData: points, sizeRange };
};

/**
 * Create basic scatter series configuration for ECharts
 */
export const createScatterSeries =
  <T extends BaseChartStyle>({
    styles,
    xField,
    yField,
  }: {
    styles: ScatterChartStyle;
    xField: string;
    yField: string;
  }): PipelineFn<T> =>
  (state) => {
    const { transformedData = [], axisColumnMappings, dataRange } = state;
    const newState = { ...state };

    if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
      newState.series = [];
      newState.legendItems = [];
      return newState;
    }

    const thresholdLines = generateThresholdLines(styles.thresholdOptions, dataRange);
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
    newState.legendItems = [];
    return newState;
  };

/**
 * Create category scatter series with multiple series (one per category)
 * Expects data already in pivot format: ['x', 'A', 'B', 'C', ...] from the universal pivot function
 */
export const createCategoryScatterSeries =
  <T extends BaseChartStyle>({
    styles,
    xField,
    yField,
    colorField,
    allData,
  }: {
    styles: ScatterChartStyle;
    xField: string;
    yField: string;
    colorField: string;
    allData?: Array<Record<string, any>>;
  }): PipelineFn<T> =>
  (state) => {
    const { transformedData = [], dataRange } = state;
    const newState = { ...state };

    if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
      newState.series = [];
      newState.legendItems = [];
      return newState;
    }

    // Data is already in pivot format from the pipe: ['x', 'A', 'B', 'C', ...]
    const pivotDataset = transformedData;
    const pivotHeader = pivotDataset[0] as string[];

    // Extract categories (skip the first column which is xField)
    const categories = pivotHeader.slice(1);

    const thresholdLines = generateThresholdLines(styles.thresholdOptions, dataRange);
    const palette = getColors().categories;
    const sortedCategories = getLegendNameDomain({
      data: allData,
      nameField: colorField,
      seriesFields: categories.map(String),
      columns: [],
    });
    const legendItems: LegendItem[] = [];

    // Create multiple scatter series
    const series = categories.map((category) => {
      const name = normalizeEmptyValue(category);
      const color = getLegendColor(name, palette, sortedCategories);
      legendItems.push(createSeriesLegendItem(name, color));
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
              color,
            }
          : {
              opacity: 0.8,
              color: 'transparent',
              borderColor: color,
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
    newState.legendItems = legendItems;

    return newState;
  };

const getSizeVisualMapPosition = (
  legendPosition?: Positions | string
): { orient: 'horizontal' | 'vertical'; [position: string]: string } => {
  switch (legendPosition || 'bottom') {
    case 'right':
      return { orient: 'horizontal', bottom: 'bottom', left: 'middle' };
    case 'left':
    case 'top':
    case 'bottom':
    default:
      return { orient: 'vertical', right: 'right', top: 'middle' };
  }
};

const buildSizeVisualMap = (
  styles: ScatterChartStyle,
  sizeRange: { min: number; max: number }
) => ({
  show: styles.addLegend === true,
  type: 'continuous',
  dimension: 2, // data type is [x, y, size] format
  min: sizeRange.min,
  max: sizeRange.max,
  itemWidth: 15,
  inRange: {
    symbolSize: [5, 25],
  },
  outOfRange: {
    symbolSize: [5, 25],
    color: ['rgba(255,255,255,0.4)'],
  },
  ...getSizeVisualMapPosition(styles.legendPosition),
});

// for size-only scatter, build a second threshold visualMap alongside the size one
const buildThresholdColorVisualMap = (styles: ScatterChartStyle, dataRange?: DataRange) => {
  if (!styles.useThresholdColor) return undefined;

  const pieces = buildThresholds(styles, dataRange);
  if (pieces.length === 0) return undefined;

  return {
    type: 'piecewise',
    show: false,
    seriesIndex: 0,
    dimension: 1, // [x, y, size]
    pieces,
  };
};

const buildSizeVisualMaps = (
  styles: ScatterChartStyle,
  sizeRange: { min: number; max: number },
  allowThresholdColor: boolean,
  dataRange?: DataRange
) => {
  const sizeVisualMap = buildSizeVisualMap(styles, sizeRange);
  const thresholdColorVisualMap = allowThresholdColor
    ? buildThresholdColorVisualMap(styles, dataRange)
    : undefined;

  return thresholdColorVisualMap ? [sizeVisualMap, thresholdColorVisualMap] : [sizeVisualMap];
};

const buildSizeSeriesBase = (styles: ScatterChartStyle, dataRange?: DataRange) => ({
  type: 'scatter',
  symbol: mapPointShapeToEChartsSymbol(styles.exclusive?.pointShape),
  symbolRotate: styles.exclusive?.angle || 0,
  ...generateThresholdLines(styles.thresholdOptions, dataRange),
});

/**
 * Create scatter series with size encoding, and optionally color encoding.
 */
export const createSizeScatterSeries =
  <T extends BaseChartStyle>({
    styles,
    xField,
    yField,
    colorField,
    sizeField,
    allData,
  }: {
    styles: ScatterChartStyle;
    xField: string;
    yField: string;
    colorField?: string;
    sizeField: string;
    allData?: Array<Record<string, any>>;
  }): PipelineFn<T> =>
  (state) => {
    const { transformedData = [], axisColumnMappings, dataRange } = state;
    const newState = { ...state };

    if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
      newState.series = [];
      newState.legendItems = [];
      return newState;
    }

    if (colorField === undefined) {
      const { seriesData, sizeRange } = transformWithSize(
        transformedData,
        xField,
        yField,
        sizeField
      );

      newState.series = [
        {
          ...buildSizeSeriesBase(styles, dataRange),
          name: getSeriesDisplayName(yField, Object.values(axisColumnMappings).flat()),
          data: seriesData,
          itemStyle: styles.exclusive?.filled
            ? {
                opacity: 0.7,
              }
            : {
                opacity: 0.7,
                color: 'transparent',
                borderColor: getColors().categories[0],
                borderWidth: 2,
              },
          emphasis: {
            focus: 'self',
            scale: 1.2,
          },
        },
      ] as ScatterSeriesOption[];

      newState.visualMap = buildSizeVisualMaps(styles, sizeRange, true, dataRange);
      newState.legendItems = [];

      return newState;
    }

    // Transform data using multi-series approach
    const { categories, seriesData, sizeRange } = transformToMultiSeriesWithSize(
      transformedData,
      xField,
      yField,
      colorField,
      sizeField
    );

    const palette = getColors().categories;
    const sortedCategories = getLegendNameDomain({
      data: allData,
      nameField: colorField,
      seriesFields: categories.map(String),
      columns: [],
    });
    const legendItems: LegendItem[] = [];

    // Data format: [x, y, size] where size is at dimension 2 for visualMap
    const series = categories.map((category) => {
      const name = normalizeEmptyValue(category);
      const color = getLegendColor(name, palette, sortedCategories);
      legendItems.push(createSeriesLegendItem(name, color));
      return {
        ...buildSizeSeriesBase(styles, dataRange),
        name,
        data: seriesData[category],
        itemStyle: styles.exclusive?.filled
          ? {
              opacity: 0.7,
              color,
            }
          : {
              opacity: 0.7,
              color: 'transparent',
              borderColor: color,
              borderWidth: 2,
            },
        emphasis: {
          focus: 'series',
          scale: 1.2,
        },
      };
    }) as ScatterSeriesOption[];

    newState.series = series;
    newState.legendItems = legendItems;
    newState.visualMap = buildSizeVisualMaps(styles, sizeRange, false);

    return newState;
  };

export const assembleScatterSpec = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const grid = { ...DEFAULT_GRID };
  const { visualMap, spec } = state;

  // visualMap is an array when threshold color is on
  const visualMaps = visualMap ? (Array.isArray(visualMap) ? visualMap : [visualMap]) : [];
  visualMaps.forEach((vm) => {
    if (vm.bottom === 'bottom') {
      grid.bottom = 70;
    }
    if (vm.right === 'right') {
      grid.right = 50;
    }
  });

  return { ...state, spec: { ...spec, grid } };
};
