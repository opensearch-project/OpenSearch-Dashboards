/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRule } from './types';
import {
  createSimpleLineChart,
  createLineBarChart,
  createMultiLineChart,
  createFacetedMultiLineChart,
} from './line/to_expression';

import { createHeatmapWithBin, createRegularHeatmap } from './heatmap/to_expression';
import { createPieSpec } from './pie/to_expression';
import {
  createTwoMetricScatter,
  createTwoMetricOneCateScatter,
  createThreeMetricOneCateScatter,
} from './scatter/to_expression';
import { createSingleMetric } from './metric/to_expression';
import { createBarSpec, createStackedBarSpec } from './bar/to_expression';

// The file contains visualization rules for different scenarios solely based on the number of metrics, categories, and dates fields.
// Each rule can be mapped to multiple chart types with different priorities.
// We take the highest priority chart type for default visualization type.

// Rule 1: 1 Metric & 1 Date
const oneMetricOneDateRule: VisualizationRule = {
  id: 'one-metric-one-date',
  name: '1 Metric & 1 Date',
  description: 'Time series visualization for single metric',
  matches: (numerical, categorical, date) =>
    numerical.length === 1 && date.length === 1 && categorical.length === 0,
  chartTypes: [
    { type: 'line', priority: 100, name: 'Line Chart' },
    { type: 'area', priority: 80, name: 'Area Chart' },
    { type: 'bar', priority: 60, name: 'Bar Chart' },
  ],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'line'
  ) => {
    // Select the appropriate chart creation function based on the chart type
    switch (chartType) {
      case 'line':
        return createSimpleLineChart(transformedData, numericalColumns, dateColumns, styleOptions);
      case 'area':
        // TODO: Implement area chart creation
        return;
      case 'bar':
        // TODO: Implement bar chart creation
        return;
      default:
        return createSimpleLineChart(transformedData, numericalColumns, dateColumns, styleOptions);
    }
  },
};

// Rule 2: 2 Metric & 1 Date
const twoMetricOneDateRule: VisualizationRule = {
  id: 'two-metric-one-date',
  name: '2 Metric & 1 Date',
  description: 'Time series visualization for double metrics',
  matches: (numerical, categorical, date) =>
    numerical.length === 2 && categorical.length === 0 && date.length === 1,
  chartTypes: [
    { type: 'line', priority: 100, name: 'Line Chart' },
    { type: 'area', priority: 80, name: 'Area Chart' },
    { type: 'bar', priority: 60, name: 'Bar Chart' },
  ],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'line'
  ) => {
    // Select the appropriate chart creation function based on the chart type
    switch (chartType) {
      case 'line':
        return createLineBarChart(transformedData, numericalColumns, dateColumns, styleOptions);
      case 'area':
        // TODO: Implement area chart creation
        return;
      case 'bar':
        // TODO: Implement bar chart creation
        return;
      default:
        return createLineBarChart(transformedData, numericalColumns, dateColumns, styleOptions);
    }
  },
};

// Rule 3: 1 metric & 1 category & 1 date
const oneMetricOneCateOneDateRule: VisualizationRule = {
  id: 'one-metric-one-category-one-date',
  name: '1 Metric & 1 Category & 1 Date',
  description: 'Time series visualization with one metric and one category',
  matches: (numerical, categorical, date) =>
    numerical.length === 1 && categorical.length === 1 && date.length === 1,
  chartTypes: [
    { type: 'line', priority: 100, name: 'Line Chart' },
    { type: 'area', priority: 80, name: 'Area Chart' },
    { type: 'bar', priority: 60, name: 'Bar Chart' },
  ],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'line'
  ) => {
    // Select the appropriate chart creation function based on the chart type
    switch (chartType) {
      case 'line':
        return createMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions
        );
      case 'area':
        // TODO: Implement area chart creation
        return;
      case 'bar':
        // TODO: Implement bar chart creation
        return;
      default:
        return createMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions
        );
    }
  },
};

// Rule 4: 1 Metric & 2 category & 1 date
const oneMetricTwoCateOneDateRule: VisualizationRule = {
  id: 'one-metric-two-category-one-date',
  name: '1 Metric & 2 Category & 1 Date',
  description: 'Multiple time series visualizations',
  matches: (numerical, categorical, date) =>
    numerical.length === 1 && categorical.length === 2 && date.length === 1,
  chartTypes: [
    { type: 'line', priority: 100, name: 'Line Chart' },
    { type: 'area', priority: 80, name: 'Area Chart' },
    { type: 'bar', priority: 60, name: 'Bar Chart' },
  ],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'line'
  ) => {
    // Select the appropriate chart creation function based on the chart type
    switch (chartType) {
      case 'line':
        return createFacetedMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions
        );
      case 'area':
        // TODO: Implement area chart creation
        return;
      case 'bar':
        // TODO: Implement bar chart creation
        return;
      default:
        return createFacetedMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions
        );
    }
  },
};

const threeMetricsRule: VisualizationRule = {
  id: 'three-metric',
  name: '3 Metric',
  description: 'Heatmap with bin for three metric',
  matches: (numerical, categorical, date) =>
    numerical.length === 3 && date.length === 0 && categorical.length === 0,
  chartTypes: [{ type: 'heatmap', priority: 100, name: 'Heatmap' }],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'heatmap'
  ) => {
    return createHeatmapWithBin(transformedData, numericalColumns, styleOptions);
  },
};

const oneMetricTwoCateHighCardRule: VisualizationRule = {
  id: 'one-metric-two-category-high-cardinality',
  name: 'one metric and two category',
  description: 'Heatmap for one metric and two category with high cardinality',
  matches: (numerical, categorical, date) =>
    numerical.length === 1 &&
    date.length === 0 &&
    categorical.length === 2 &&
    (numerical[0].uniqueValuesCount >= 7 ||
      categorical[0].uniqueValuesCount >= 7 ||
      categorical[1].uniqueValuesCount >= 7),
  chartTypes: [
    { type: 'heatmap', priority: 100, name: 'Heatmap' },
    { type: 'bar', priority: 80, name: 'Bar Chart' },
    { type: 'area', priority: 60, name: 'Area Chart' },
  ],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'heatmap'
  ) => {
    switch (chartType) {
      case 'heatmap':
        return createRegularHeatmap(transformedData, numericalColumns, styleOptions);
      case 'bar':
        return createStackedBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions
        );
      case 'area':
        // TODO: Implement stack area chart creation
        return;
      default:
        return createRegularHeatmap(transformedData, numericalColumns, styleOptions);
    }
  },
};

const oneMetricTwoCateLowCardRule: VisualizationRule = {
  id: 'one-metric-two-category-low-cardinality',
  name: 'one metric and two category',
  description: 'Heatmap for one metric and two category with low cardinality',
  matches: (numerical, categorical, date) =>
    numerical.length === 1 &&
    date.length === 0 &&
    categorical.length === 2 &&
    numerical[0].uniqueValuesCount < 7 &&
    categorical[0].uniqueValuesCount < 7 &&
    categorical[1].uniqueValuesCount < 7,
  chartTypes: [
    { type: 'bar', priority: 100, name: 'Bar Chart' },
    { type: 'heatmap', priority: 80, name: 'Heatmap' },
    { type: 'area', priority: 60, name: 'Area Chart' },
  ],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'bar'
  ) => {
    switch (chartType) {
      case 'heatmap':
        return createRegularHeatmap(transformedData, numericalColumns, styleOptions);
      case 'bar':
        return createStackedBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions
        );
      case 'area':
        // TODO: Implement stack area chart creation
        return;
      default:
        return createRegularHeatmap(transformedData, numericalColumns, styleOptions);
    }
  },
};

const oneMetricOneCateRule: VisualizationRule = {
  id: 'one-metric-one-category',
  name: 'one metric and one category',
  description: 'Multiple visualizations for one metric and one category',
  matches: (numerical, categorical, date) =>
    numerical.length === 1 && date.length === 0 && categorical.length === 1,
  chartTypes: [
    { type: 'bar', priority: 100, name: 'Bar Chart' },
    { type: 'pie', priority: 80, name: 'Pie Chart' },
    { type: 'line', priority: 60, name: 'Line Chart' },
    { type: 'area', priority: 40, name: 'Area Chart' },
  ],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'pie'
  ) => {
    switch (chartType) {
      case 'pie':
        return createPieSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions
        );
      case 'bar':
        return createBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions
        );
      case 'line':
        // TODO: Implement area chart creation
        return;
      case 'area':
        // TODO: Implement bar chart creation
        return;
      default:
        // TODO: when bar is implemented, bar will take higher priority
        return createPieSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions
        );
    }
  },
};

const oneMetricRule: VisualizationRule = {
  id: 'one-metric',
  name: 'one metric',
  description: 'Metric for one metric',
  matches: (numerical, categorical, date) =>
    numerical.length === 1 &&
    date.length === 0 &&
    categorical.length === 0 &&
    numerical[0].validValuesCount === 1,
  chartTypes: [{ type: 'metric', priority: 100, name: 'metric' }],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'metric'
  ) => {
    return createSingleMetric(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions
    );
  },
};

const twoMetricRule: VisualizationRule = {
  id: 'two-metric',
  name: 'two metric',
  description: 'Scatter for two metric',
  matches: (numerical, categorical, date) =>
    numerical.length === 2 && date.length === 0 && categorical.length === 0,
  chartTypes: [{ type: 'scatter', priority: 100, name: 'scatter' }],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter'
  ) => {
    return createTwoMetricScatter(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions
    );
  },
};

const twoMetricOneCateRule: VisualizationRule = {
  id: 'two-metric-one-category',
  name: 'two metric and one category',
  description: 'Scatter for two metric and one category',
  matches: (numerical, categorical, date) =>
    numerical.length === 2 && date.length === 0 && categorical.length === 1,
  chartTypes: [{ type: 'scatter', priority: 100, name: 'scatter' }],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter'
  ) => {
    return createTwoMetricOneCateScatter(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions
    );
  },
};

const threeMetricOneCateRule: VisualizationRule = {
  id: 'three-metric-one-category',
  name: 'three metric and one category',
  description: 'Scatter for three metric and one category',
  matches: (numerical, categorical, date) =>
    numerical.length === 3 && date.length === 0 && categorical.length === 1,
  chartTypes: [{ type: 'scatter', priority: 100, name: 'scatter' }],
  toExpression: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter'
  ) => {
    return createThreeMetricOneCateScatter(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions
    );
  },
};

// TODO: add more rules here as needed

// Export all rules
export const ALL_VISUALIZATION_RULES: VisualizationRule[] = [
  oneMetricOneDateRule,
  twoMetricOneDateRule,
  oneMetricOneCateOneDateRule,
  oneMetricTwoCateOneDateRule,
  threeMetricsRule,
  oneMetricTwoCateHighCardRule,
  oneMetricTwoCateLowCardRule,
  oneMetricOneCateRule,
  twoMetricRule,
  twoMetricOneCateRule,
  threeMetricOneCateRule,
  oneMetricRule,
];
