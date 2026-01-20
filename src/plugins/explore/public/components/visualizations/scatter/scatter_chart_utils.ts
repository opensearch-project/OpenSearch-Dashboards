/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterSeriesOption } from 'echarts';
import { getSeriesDisplayName } from '../utils/series';
import { ScatterChartStyle } from './scatter_vis_config';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { generateThresholdLines } from '../utils/utils';

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
    const size = Number(row[sizeFieldIndex]) || 0;

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
  const { transformedData = [], axisColumnMappings, axisConfig } = state;
  const newState = { ...state };

  if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
    throw new Error('transformedData must be an array with data rows');
  }

  const xAxisName = axisConfig?.xAxisStyle?.title?.text || axisConfig?.xAxis?.name || xField;
  const yAxisName = axisConfig?.yAxisStyle?.title?.text || axisConfig?.yAxis?.name || yField;

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);
  const series = [
    {
      type: 'scatter',
      name: getSeriesDisplayName(yField, Object.values(axisColumnMappings)),
      symbolSize: 8,
      symbol: styles.exclusive?.pointShape || 'circle',
      symbolRotate: styles.exclusive?.angle || 0,
      itemStyle: {
        opacity: 0.8,
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

  // Add tooltip configuration for scatter charts
  newState.tooltipConfig = {
    trigger: 'item',
    formatter: (params: any) => {
      if (params.value && Array.isArray(params.value) && params.value.length >= 2) {
        const xValue = params.value[0];
        const yValue = params.value[1];
        return `${xAxisName}: ${xValue}<br/>${yAxisName}: ${yValue}`;
      }
    },
  };

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
  const { transformedData = [], axisColumnMappings, axisConfig } = state;
  const newState = { ...state };

  if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
    throw new Error('transformedData must be an array with data rows');
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
    symbol: styles.exclusive?.pointShape || 'circle',
    symbolRotate: styles.exclusive?.angle || 0,
    encode: {
      x: xField,
      y: category,
    },
    itemStyle: {
      opacity: 0.8,
    },
    emphasis: {
      focus: 'series',
      scale: 1.2,
    },
    ...thresholdLines,
  })) as ScatterSeriesOption[];

  // Setup tooltip configuration
  const xAxisName = axisConfig?.xAxisStyle?.title?.text || axisConfig?.xAxis?.name || xField;
  const yAxisName = axisConfig?.yAxisStyle?.title?.text || axisConfig?.yAxis?.name || yField;
  const colorAxisMapping = Object.values(axisColumnMappings).find(
    (mapping) => mapping.column === colorField
  );
  const colorAxisName = colorAxisMapping?.name || colorField;

  newState.tooltipConfig = {
    trigger: 'item',
    formatter: (params: any) => {
      if (params.value && Array.isArray(params.value) && params.value.length >= 2) {
        const xValue = params.value[0];
        const seriesName = params.seriesName;
        const yValueIndex = pivotHeader.indexOf(String(seriesName));
        const yValue = yValueIndex >= 0 ? params.value[yValueIndex] : null;

        return `${xAxisName}: ${xValue}<br/>${yAxisName}: ${yValue}<br/>${colorAxisName}: ${seriesName}`;
      }
      return `${xAxisName}: ${params.value || 'N/A'}<br/>${yAxisName}: ${params.name || 'N/A'}`;
    },
  };

  // Set the pivot dataset and series
  newState.transformedData = pivotDataset;
  newState.series = series;
  newState.disableDefaultLegend = false;

  return newState;
};

/**
 * Custom spec assembly for category scatter charts with dataset support
 */
export const assembleCategoryScatterSpec = <T extends BaseChartStyle>() => (state: any) => {
  const { styles, axisConfig, series, tooltipConfig, transformedData } = state;

  const spec = {
    title: {
      text: styles.titleOptions?.show ? styles.titleOptions?.titleName : undefined,
    },
    tooltip: tooltipConfig || {
      trigger: 'item',
      show: styles.tooltipOptions?.mode !== 'hidden',
    },
    legend: {
      show: styles.addLegend,
      orient:
        styles.legendPosition === 'left' || styles.legendPosition === 'right'
          ? 'vertical'
          : 'horizontal',
      left:
        styles.legendPosition === 'left'
          ? 'left'
          : styles.legendPosition === 'right'
          ? 'right'
          : 'center',
      top:
        styles.legendPosition === 'top'
          ? 'top'
          : styles.legendPosition === 'bottom'
          ? 'bottom'
          : undefined,
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
    grid: { top: 60, bottom: 60, left: 60, right: 80 },
  };

  return { ...state, spec };
};

/**
 * Custom spec assembly for size scatter charts
 */
export const assembleSizeScatterSpec = <T extends BaseChartStyle>() => (state: any) => {
  const { styles, axisConfig, series, tooltipConfig, visualMap } = state;
  const legendPosition = styles.legendPosition || 'bottom';

  const getGridConfig = () => {
    switch (legendPosition) {
      case 'left':
        return { top: 60, bottom: 60, left: 200, right: 80 };
      case 'right':
        return { top: 60, bottom: 60, left: 60, right: 200 };
      case 'top':
        return { top: 80, bottom: 60, left: 60, right: 80 };
      case 'bottom':
        return { top: 60, bottom: 120, left: 60, right: 80 };
    }
  };

  const spec = {
    title: {
      text: styles.titleOptions?.show ? styles.titleOptions?.titleName : undefined,
    },
    tooltip: tooltipConfig || {
      trigger: 'item',
      show: styles.tooltipOptions?.mode !== 'hidden',
    },
    legend: {
      show: styles.addLegend,
      orient:
        styles.legendPosition === 'left' || styles.legendPosition === 'right'
          ? 'vertical'
          : 'horizontal',
      left:
        styles.legendPosition === 'left'
          ? 'left'
          : styles.legendPosition === 'right'
          ? 'right'
          : 'center',
      top:
        styles.legendPosition === 'top'
          ? 'top'
          : styles.legendPosition === 'bottom'
          ? 'bottom'
          : undefined,
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
    visualMap,
    series,
    // Dynamic grid based on legend positions
    grid: getGridConfig(),
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
  const { transformedData = [], axisColumnMappings, axisConfig } = state;
  const newState = { ...state };

  if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
    throw new Error('transformedData must be an array with data rows');
  }

  // Transform data using multi-series approach
  const { categories, seriesData, sizeRange } = transformToMultiSeriesWithSize(
    transformedData,
    xField,
    yField,
    colorField,
    sizeField
  );

  // Get display names for tooltip
  const xAxisName = axisConfig?.xAxisStyle?.title?.text || axisConfig?.xAxis?.name || xField;
  const yAxisName = axisConfig?.yAxisStyle?.title?.text || axisConfig?.yAxis?.name || yField;
  const colorAxisMapping = Object.values(axisColumnMappings).find(
    (mapping) => mapping.column === colorField
  );
  const sizeAxisMapping = Object.values(axisColumnMappings).find(
    (mapping) => mapping.column === sizeField
  );
  const colorAxisName = colorAxisMapping?.name || colorField;
  const sizeAxisName = sizeAxisMapping?.name || sizeField;

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);

  // Create multiple scatter series, one for each color category
  // Data format: [x, y, size] where size is at dimension 2 for visualMap
  const series = categories.map((category) => ({
    name: String(category),
    type: 'scatter',
    symbol: styles.exclusive?.pointShape || 'circle',
    symbolRotate: styles.exclusive?.angle || 0,
    data: seriesData[category], // [x, y, size] format
    itemStyle: {
      opacity: 0.7,
    },
    emphasis: {
      focus: 'series',
      scale: 1.2,
    },
    ...thresholdLines,
  })) as ScatterSeriesOption[];

  // Setup tooltip configuration
  newState.tooltipConfig = {
    trigger: 'item',
    formatter: (params: any) => {
      if (params.value && Array.isArray(params.value) && params.value.length >= 3) {
        const xValue = params.value[0];
        const yValue = params.value[1];
        const sizeValue = params.value[2];
        const seriesName = params.seriesName;
        return `${xAxisName}: ${xValue}<br/>${yAxisName}: ${yValue}<br/>${colorAxisName}: ${seriesName}<br/>${sizeAxisName}: ${sizeValue}`;
      }
      return `${xAxisName}: ${params.value || 'N/A'}<br/>${yAxisName}: ${params.name || 'N/A'}`;
    },
  };

  // Set series and visualMap
  newState.series = series;

  // Position visualMap according to legendPosition (same as color legend)
  const legendPosition = styles.legendPosition || 'bottom';

  const getVisualMapConfig = () => {
    switch (legendPosition) {
      case 'left':
        return {
          orient: 'vertical',
          left: 'left',
          top: 'top',
        };
      case 'right':
        return {
          orient: 'vertical',
          right: 'right',
          top: 'top',
        };
      case 'top':
        return {
          orient: 'horizontal',
          left: 'center',
          top: '5%',
        };
      case 'bottom':
        return {
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
        };
    }
  };

  newState.visualMap = {
    show: styles.addLegend === true,
    type: 'continuous',
    dimension: 2,
    min: sizeRange.min,
    max: sizeRange.max,
    text: [`${sizeAxisName} Max`, `${sizeAxisName} Min`],
    inRange: {
      symbolSize: [5, 25],
    },
    outOfRange: {
      symbolSize: [5, 25],
      color: ['rgba(255,255,255,0.4)'],
    },
    ...getVisualMapConfig(),
  };

  newState.disableDefaultLegend = false;
  return newState;
};
