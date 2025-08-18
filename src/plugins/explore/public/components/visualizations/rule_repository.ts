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
  createCategoryLineChart,
} from './line/to_expression';

import {
  createSimpleAreaChart,
  createMultiAreaChart,
  createFacetedMultiAreaChart,
  createStackedAreaChart,
  createCategoryAreaChart,
} from './area/to_expression';

import { createRegularHeatmap } from './heatmap/to_expression';
import { createPieSpec } from './pie/to_expression';
import {
  createTwoMetricScatter,
  createTwoMetricOneCateScatter,
  createThreeMetricOneCateScatter,
} from './scatter/to_expression';
import { createSingleMetric } from './metric/to_expression';
import {
  createBarSpec,
  createStackedBarSpec,
  createTimeBarChart,
  createGroupedTimeBarChart,
  createFacetedTimeBarChart,
} from './bar/to_expression';
import { CHART_METADATA } from './constants';

// The file contains visualization rules for different scenarios solely based on the number of metrics, categories, and dates fields.
// Each rule can be mapped to multiple chart types with different priorities.
// We take the highest priority chart type for default visualization type.

// Rule 1: 1 Metric & 1 Date
const oneMetricOneDateRule: VisualizationRule = {
  id: 'one-metric-one-date',
  name: '1 Metric & 1 Date',
  description: 'Time series visualization for single metric',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 1 || date.length < 1) {
      return 'NOT_MATCH';
    }
    if (numerical.length === 1 && date.length === 1 && categorical.length === 0) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [
    { ...CHART_METADATA.line, priority: 100 },
    { ...CHART_METADATA.area, priority: 80 },
    { ...CHART_METADATA.bar, priority: 60 },
  ],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'line',
    axisColumnMappings
  ) => {
    // Select the appropriate chart creation function based on the chart type
    switch (chartType) {
      case 'line':
        return createSimpleLineChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'area':
        return createSimpleAreaChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'bar':
        return createTimeBarChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      default:
        return createSimpleLineChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
    }
  },
};

// Rule 2: 2 Metric & 1 Date
const twoMetricOneDateRule: VisualizationRule = {
  id: 'two-metric-one-date',
  name: '2 Metric & 1 Date',
  description: 'Time series visualization for double metrics',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 2 || date.length < 1) {
      return 'NOT_MATCH';
    }
    if (numerical.length === 2 && categorical.length === 0 && date.length === 1) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [{ ...CHART_METADATA.line, priority: 100 }],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'line',
    axisColumnMappings
  ) => {
    // Select the appropriate chart creation function based on the chart type
    switch (chartType) {
      case 'line':
        return createLineBarChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      default:
        return createLineBarChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
    }
  },
};

// Rule 3: 1 metric & 1 category & 1 date
const oneMetricOneCateOneDateRule: VisualizationRule = {
  id: 'one-metric-one-category-one-date',
  name: '1 Metric & 1 Category & 1 Date',
  description: 'Time series visualization with one metric and one category',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 1 || categorical.length < 1 || date.length < 1) {
      return 'NOT_MATCH';
    }
    if (numerical.length === 1 && categorical.length === 1 && date.length === 1) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [
    { ...CHART_METADATA.line, priority: 100 },
    { ...CHART_METADATA.area, priority: 80 },
    { ...CHART_METADATA.bar, priority: 60 },
  ],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'line',
    axisColumnMappings
  ) => {
    // Select the appropriate chart creation function based on the chart type
    switch (chartType) {
      case 'line':
        return createMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'area':
        return createMultiAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'bar':
        return createGroupedTimeBarChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      default:
        return createMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
    }
  },
};

// Rule 4: 1 Metric & 2 category & 1 date
const oneMetricTwoCateOneDateRule: VisualizationRule = {
  id: 'one-metric-two-category-one-date',
  name: '1 Metric & 2 Category & 1 Date',
  description: 'Multiple time series visualizations',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 1 || categorical.length < 2 || date.length < 1) {
      return 'NOT_MATCH';
    }
    if (numerical.length === 1 && categorical.length === 2 && date.length === 1) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [
    { ...CHART_METADATA.line, priority: 100 },
    { ...CHART_METADATA.area, priority: 80 },
    { ...CHART_METADATA.bar, priority: 60 },
  ],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'line',
    axisColumnMappings
  ) => {
    // Select the appropriate chart creation function based on the chart type
    switch (chartType) {
      case 'line':
        return createFacetedMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'area':
        return createFacetedMultiAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'bar':
        return createFacetedTimeBarChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      default:
        return createFacetedMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
    }
  },
};

const oneMetricTwoCateHighCardRule: VisualizationRule = {
  id: 'one-metric-two-category-high-cardinality',
  name: 'one metric and two category',
  description: 'Heatmap for one metric and two category with high cardinality',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 1 || categorical.length < 2) {
      return 'NOT_MATCH';
    }
    if (
      numerical.length === 1 &&
      date.length === 0 &&
      categorical.length === 2 &&
      (numerical[0].uniqueValuesCount >= 7 ||
        categorical[0].uniqueValuesCount >= 7 ||
        categorical[1].uniqueValuesCount >= 7)
    ) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [
    { ...CHART_METADATA.heatmap, priority: 100 },
    { ...CHART_METADATA.bar, priority: 80 },
    { ...CHART_METADATA.area, priority: 60 },
  ],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'heatmap',
    axisColumnMappings
  ) => {
    switch (chartType) {
      case 'heatmap':
        return createRegularHeatmap(
          transformedData,
          numericalColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'bar':
        return createStackedBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'area':
        return createStackedAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      default:
        return createRegularHeatmap(
          transformedData,
          numericalColumns,
          styleOptions,
          axisColumnMappings
        );
    }
  },
};

const oneMetricTwoCateLowCardRule: VisualizationRule = {
  id: 'one-metric-two-category-low-cardinality',
  name: 'one metric and two category',
  description: 'Heatmap for one metric and two category with low cardinality',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 1 || categorical.length < 2) {
      return 'NOT_MATCH';
    }
    if (
      numerical.length === 1 &&
      date.length === 0 &&
      categorical.length === 2 &&
      numerical[0].uniqueValuesCount < 7 &&
      categorical[0].uniqueValuesCount < 7 &&
      categorical[1].uniqueValuesCount < 7
    ) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [
    { ...CHART_METADATA.bar, priority: 100 },
    { ...CHART_METADATA.heatmap, priority: 80 },
    { ...CHART_METADATA.area, priority: 60 },
  ],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'bar',
    axisColumnMappings
  ) => {
    switch (chartType) {
      case 'heatmap':
        return createRegularHeatmap(
          transformedData,
          numericalColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'bar':
        return createStackedBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'area':
        return createStackedAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      default:
        return createRegularHeatmap(
          transformedData,
          numericalColumns,
          styleOptions,
          axisColumnMappings
        );
    }
  },
};

const oneMetricOneCateRule: VisualizationRule = {
  id: 'one-metric-one-category',
  name: 'one metric and one category',
  description: 'Multiple visualizations for one metric and one category',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 1 || categorical.length < 1) {
      return 'NOT_MATCH';
    }
    if (numerical.length === 1 && date.length === 0 && categorical.length === 1) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [
    { ...CHART_METADATA.bar, priority: 100 },
    { ...CHART_METADATA.pie, priority: 80 },
    { ...CHART_METADATA.line, priority: 60 },
    { ...CHART_METADATA.area, priority: 40 },
  ],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'pie',
    axisColumnMappings
  ) => {
    switch (chartType) {
      case 'bar':
        return createBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'pie':
        return createPieSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'line':
        return createCategoryLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      case 'area':
        return createCategoryAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
      default:
        return createBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions,
          axisColumnMappings
        );
    }
  },
};

const singleMetricRule: VisualizationRule = {
  id: 'single-metric',
  name: 'single metric',
  description: 'Metric for single metric',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 1 || numerical[0].validValuesCount !== 1) {
      return 'NOT_MATCH';
    }
    if (
      numerical.length === 1 &&
      date.length === 0 &&
      categorical.length === 0 &&
      numerical[0].validValuesCount === 1
    ) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [{ ...CHART_METADATA.metric, priority: 100 }],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'metric',
    axisColumnMappings
  ) => {
    return createSingleMetric(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions,
      axisColumnMappings
    );
  },
};

const twoMetricRule: VisualizationRule = {
  id: 'two-metric',
  name: 'two metric',
  description: 'Scatter for two metric',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 2) {
      return 'NOT_MATCH';
    }
    if (numerical.length === 2 && date.length === 0 && categorical.length === 0) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [{ ...CHART_METADATA.scatter, priority: 100 }],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter',
    axisColumnMappings
  ) => {
    return createTwoMetricScatter(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions,
      axisColumnMappings
    );
  },
};

const twoMetricOneCateRule: VisualizationRule = {
  id: 'two-metric-one-category',
  name: 'two metric and one category',
  description: 'Scatter for two metric and one category',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 2 || categorical.length < 1) {
      return 'NOT_MATCH';
    }
    if (numerical.length === 2 && date.length === 0 && categorical.length === 1) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [{ ...CHART_METADATA.scatter, priority: 100 }],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter',
    axisColumnMappings
  ) => {
    return createTwoMetricOneCateScatter(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions,
      axisColumnMappings
    );
  },
};

const threeMetricOneCateRule: VisualizationRule = {
  id: 'three-metric-one-category',
  name: 'three metric and one category',
  description: 'Scatter for three metric and one category',
  matches: (numerical, categorical, date) => {
    if (numerical.length < 3 || categorical.length < 1) {
      return 'NOT_MATCH';
    }
    if (numerical.length === 3 && date.length === 0 && categorical.length === 1) {
      return 'EXACT_MATCH';
    }
    return 'OVER_MATCH';
  },
  chartTypes: [{ ...CHART_METADATA.scatter, priority: 100 }],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter',
    axisColumnMappings
  ) => {
    return createThreeMetricOneCateScatter(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions,
      axisColumnMappings
    );
  },
};

// Export all rules
export const ALL_VISUALIZATION_RULES: VisualizationRule[] = [
  oneMetricOneDateRule,
  twoMetricOneDateRule,
  oneMetricOneCateOneDateRule,
  oneMetricTwoCateOneDateRule,
  oneMetricTwoCateHighCardRule,
  oneMetricTwoCateLowCardRule,
  oneMetricOneCateRule,
  twoMetricRule,
  twoMetricOneCateRule,
  threeMetricOneCateRule,
  singleMetricRule,
];
