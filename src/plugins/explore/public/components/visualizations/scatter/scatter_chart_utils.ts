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
 * Create category scatter series with color encoding
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

  const xAxisName = axisConfig?.xAxisStyle?.title?.text || axisConfig?.xAxis?.name || xField;
  const yAxisName = axisConfig?.yAxisStyle?.title?.text || axisConfig?.yAxis?.name || yField;
  const colorAxisMapping = Object.values(axisColumnMappings).find(
    (mapping) => mapping.column === colorField
  );
  const colorAxisName = colorAxisMapping?.name || colorField;

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);

  // Data is in 2D array format: first row is header, rest are data rows
  const headerRow = transformedData[0] as string[];
  const dataRows = transformedData.slice(1);

  // Get field indices from header
  const xFieldIndex = headerRow.indexOf(xField);
  const yFieldIndex = headerRow.indexOf(yField);
  const colorFieldIndex = headerRow.indexOf(colorField);

  if (xFieldIndex === -1 || yFieldIndex === -1 || colorFieldIndex === -1) {
    throw new Error(
      `Cannot find field indices: x=${xFieldIndex}, y=${yFieldIndex}, color=${colorFieldIndex}`
    );
  }

  // Get unique categories from the data
  const categories = [
    ...new Set(dataRows.map((row) => String(row[colorFieldIndex] || 'undefined'))),
  ];

  // Create single series using data format
  const series = [
    {
      type: 'scatter',
      symbolSize: 8,
      symbol: styles.exclusive?.pointShape || 'circle',
      symbolRotate: styles.exclusive?.angle || 0,
      data: dataRows.map((row) => [row[xFieldIndex], row[yFieldIndex], row[colorFieldIndex]]),
      itemStyle: {
        opacity: 0.8,
      },
      emphasis: {
        focus: 'self',
        scale: 1.2,
      },
      ...thresholdLines,
    },
  ] as any[];

  const legendPosition = styles.legendPosition || 'bottom';
  newState.visualMap = {
    show: styles.addLegend === true,
    type: 'piecewise',
    categories,
    dimension: 2,
    inRange: {
      color:
        categories.length <= 10
          ? [
              '#5470c6',
              '#91cc75',
              '#fac858',
              '#ee6666',
              '#73c0de',
              '#3ba272',
              '#fc8452',
              '#9a60b4',
              '#ea7ccc',
              '#c2c2c2',
            ].slice(0, categories.length)
          : undefined,
    },
    textStyle: {
      color: '#333',
    },
    // Position visualMap according to legendPosition
    orient: legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal',
    left: legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center',
    top: legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? 'bottom' : 'center',
    bottom: legendPosition === 'bottom' ? 20 : undefined,
    right: legendPosition === 'right' ? 20 : undefined,
  };

  // Add tooltip configuration for colored scatter charts
  newState.tooltipConfig = {
    trigger: 'item',
    formatter: (params: any) => {
      if (params.value && Array.isArray(params.value) && params.value.length >= 3) {
        const xValue = params.value[0];
        const yValue = params.value[1];
        const colorValue = params.value[2];
        return `${xAxisName}: ${xValue}<br/>${yAxisName}: ${yValue}<br/>${colorAxisName}: ${colorValue}`;
      }

      return `${xAxisName}: ${params.value || 'N/A'}<br/>${yAxisName}: ${params.name || 'N/A'}`;
    },
  };

  // Set flags for category scatter
  newState.useDataInsteadOfDataset = true;
  newState.disableDefaultLegend = true; // Use visualMap instead of default legend
  newState.series = series;
  return newState;
};

/**
 * Custom spec assembly for category scatter charts (no dataset)
 */
export const assembleCategoryScatterSpec = <T extends BaseChartStyle>() => (state: any) => {
  const { styles, axisConfig, series, tooltipConfig } = state;

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
    series,
    grid: { top: 60, bottom: 60, left: 60, right: 80 },
  };

  return { ...state, spec };
};

/**
 * Custom spec assembly for size scatter charts with dynamic grid for legend positioning
 */
export const assembleSizeScatterSpec = <T extends BaseChartStyle>() => (state: any) => {
  const { styles, axisConfig, series, tooltipConfig, visualMap } = state;
  const legendPosition = styles.legendPosition || 'bottom';

  const getGridConfig = () => {
    switch (legendPosition) {
      case 'left':
        return { top: 60, bottom: 60, left: 220, right: 80 };
      case 'right':
        return { top: 60, bottom: 60, left: 60, right: 220 };
      case 'top':
        return { top: 80, bottom: 60, left: 60, right: 80 };
      case 'bottom':
        return { top: 60, bottom: 140, left: 60, right: 80 };
      default:
        return { top: 60, bottom: 60, left: 60, right: 80 };
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
  const { transformedData = [], axisColumnMappings } = state;
  const newState = { ...state };

  if (!transformedData || !Array.isArray(transformedData) || transformedData.length === 0) {
    throw new Error('transformedData must be an array with data rows');
  }

  const headerRow = transformedData[0] as string[];
  const dataRows = transformedData.slice(1);

  // Get field indices from header
  const xFieldIndex = headerRow.indexOf(xField);
  const yFieldIndex = headerRow.indexOf(yField);
  const colorFieldIndex = headerRow.indexOf(colorField);
  const sizeFieldIndex = headerRow.indexOf(sizeField);
  if (xFieldIndex === -1 || yFieldIndex === -1 || colorFieldIndex === -1 || sizeFieldIndex === -1) {
    throw new Error(
      `Cannot find field indices: x=${xFieldIndex}, y=${yFieldIndex}, color=${colorFieldIndex}, size=${sizeFieldIndex}`
    );
  }

  // Get display names for tooltip
  const axisConfig = state.axisConfig;
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

  // Get unique categories from the data
  const categories = [
    ...new Set(dataRows.map((row) => String(row[colorFieldIndex] || 'undefined'))),
  ];

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);

  // Create single series with data in [x, y, colorValue, sizeValue] format
  const series = [
    {
      type: 'scatter',
      symbol: styles.exclusive?.pointShape || 'circle',
      symbolRotate: styles.exclusive?.angle || 0,
      data: dataRows.map((row) => [
        row[xFieldIndex],
        row[yFieldIndex],
        row[colorFieldIndex],
        row[sizeFieldIndex],
      ]),
      itemStyle: {
        opacity: 0.7,
      },
      emphasis: {
        focus: 'self',
        scale: 1.2,
      },
      ...thresholdLines,
    },
  ] as any[];

  const legendPosition = styles.legendPosition || 'bottom';
  newState.visualMap = [
    {
      show: styles.addLegend === true,
      type: 'piecewise',
      categories,
      dimension: 2,
      inRange: {
        color:
          categories.length <= 10
            ? [
                '#5470c6',
                '#91cc75',
                '#fac858',
                '#ee6666',
                '#73c0de',
                '#3ba272',
                '#fc8452',
                '#9a60b4',
                '#ea7ccc',
                '#c2c2c2',
              ].slice(0, categories.length)
            : undefined,
      },
      textStyle: { color: '#333' },
      orient: legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal',
      left: legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center',
      top: legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? undefined : '10%',
      bottom: legendPosition === 'bottom' ? 60 : undefined,
      right: legendPosition === 'right' ? 20 : undefined,
    },
    {
      show: styles.addLegend === true,
      type: 'continuous',
      dimension: 3,
      min: Math.min(...dataRows.map((row) => Number(row[sizeFieldIndex]) || 0)),
      max: Math.max(...dataRows.map((row) => Number(row[sizeFieldIndex]) || 0)),
      inRange: {
        symbolSize: [5, 25],
      },
      textStyle: { color: '#333' },
      orient: legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal',
      left: legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center',
      top: legendPosition === 'top' ? '5%' : legendPosition === 'bottom' ? undefined : undefined,
      bottom: legendPosition === 'bottom' ? 20 : legendPosition === 'top' ? undefined : '5%',
      right: legendPosition === 'right' ? 20 : undefined,
      text: [`${sizeAxisName} Max`, `${sizeAxisName} Min`],
    },
  ];

  // Add tooltip configuration
  newState.tooltipConfig = {
    trigger: 'item',
    formatter: (params: any) => {
      if (params.value && Array.isArray(params.value) && params.value.length >= 4) {
        const xValue = params.value[0];
        const yValue = params.value[1];
        const colorValue = params.value[2];
        const sizeValue = params.value[3];
        return `${xAxisName}: ${xValue}<br/>${yAxisName}: ${yValue}<br/>${colorAxisName}: ${colorValue}<br/>${sizeAxisName}: ${sizeValue}`;
      }
      return `${xAxisName}: ${params.value || 'N/A'}<br/>${yAxisName}: ${params.name || 'N/A'}`;
    },
  };

  // Set flags for size scatter
  newState.useDataInsteadOfDataset = true;
  newState.disableDefaultLegend = true;
  newState.series = series;
  return newState;
};
