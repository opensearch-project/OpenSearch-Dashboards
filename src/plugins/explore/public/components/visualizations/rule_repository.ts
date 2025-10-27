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
  createNumericalHistogramBarChart,
  createSingleBarChart,
} from './bar/to_expression';
import { CHART_METADATA } from './constants';
import { createGauge } from './gauge/to_expression';
import { AreaChartStyle } from './area/area_vis_config';
import { BarChartStyle } from './bar/bar_vis_config';
import { GaugeChartStyle } from './gauge/gauge_vis_config';
import { LineChartStyle } from './line/line_vis_config';
import { MetricChartStyle } from './metric/metric_vis_config';
import { PieChartStyle } from './pie/pie_vis_config';
import { BarGaugeChartStyle } from './bar_gauge/bar_gauge_vis_config';
import { ScatterChartStyle } from './scatter/scatter_vis_config';
import { HeatmapChartStyle } from './heatmap/heatmap_vis_config';
import { StateTimeLineChartStyle } from './state_timeline/state_timeline_config';
import {
  createNumericalStateTimeline,
  createCategoricalStateTimeline,
  createSingleCategoricalStateTimeline,
} from './state_timeline/to_expression';
import { createBarGaugeSpec } from './bar_gauge/to_expression';

type RuleMatchIndex = [number, number, number];

/**
 * Compares two rule match index arrays to determine their relationship.
 * Returns NOT_MATCH if arrays have different lengths or arr1 has values exceeding arr2
 * Returns EXACT_MATCH if arrays are identical in all positions
 * Returns COMPATIBLE_MATCH if arr1 doesn't exceed arr2 in any position
 */
function compare(
  arr1: RuleMatchIndex,
  arr2: RuleMatchIndex
): 'NOT_MATCH' | 'EXACT_MATCH' | 'COMPATIBLE_MATCH' {
  if (arr1.length !== arr2.length) {
    return 'NOT_MATCH';
  }

  if (arr1.some((v, i) => v !== 0 && v > arr2[i])) {
    return 'NOT_MATCH';
  }

  if (arr1.every((v, i) => v === arr2[i])) {
    return 'EXACT_MATCH';
  }

  return 'COMPATIBLE_MATCH';
}

// The file contains visualization rules for different scenarios solely based on the number of metrics, categories, and dates fields.
// Each rule can be mapped to multiple chart types with different priorities.
// We take the highest priority chart type for default visualization type.

// Rule 1: 1 Metric & 1 Date
const oneMetricOneDateRule: VisualizationRule = {
  id: 'one-metric-one-date',
  name: '1 Metric & 1 Date',
  description: 'Time series visualization for single metric',
  matches: (numerical, categorical, date) =>
    compare([1, 0, 1], [numerical.length, categorical.length, date.length]),
  chartTypes: [
    { ...CHART_METADATA.line, priority: 100 },
    { ...CHART_METADATA.area, priority: 80 },
    { ...CHART_METADATA.bar, priority: 60 },
    { ...CHART_METADATA.metric, priority: 40 },
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
          styleOptions as LineChartStyle,
          axisColumnMappings
        );
      case 'area':
        return createSimpleAreaChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions as AreaChartStyle,
          axisColumnMappings
        );
      case 'bar':
        return createTimeBarChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions as BarChartStyle,
          axisColumnMappings
        );
      case 'metric':
        return createSingleMetric(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as MetricChartStyle,
          axisColumnMappings
        );
      default:
        return createSimpleLineChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions as LineChartStyle,
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
  matches: (numerical, categorical, date) =>
    compare([2, 0, 1], [numerical.length, categorical.length, date.length]),
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
          styleOptions as LineChartStyle,
          axisColumnMappings
        );
      default:
        return createLineBarChart(
          transformedData,
          numericalColumns,
          dateColumns,
          styleOptions as LineChartStyle,
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
  matches: (numerical, categorical, date) =>
    compare([1, 1, 1], [numerical.length, categorical.length, date.length]),
  chartTypes: [
    { ...CHART_METADATA.line, priority: 100 },
    { ...CHART_METADATA.area, priority: 80 },
    { ...CHART_METADATA.bar, priority: 60 },
    { ...CHART_METADATA.state_timeline, priority: 40 },
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
          styleOptions as LineChartStyle,
          axisColumnMappings
        );
      case 'area':
        return createMultiAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as AreaChartStyle,
          axisColumnMappings
        );
      case 'bar':
        return createGroupedTimeBarChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as BarChartStyle,
          axisColumnMappings
        );
      case 'state_timeline':
        return createNumericalStateTimeline(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as StateTimeLineChartStyle,
          axisColumnMappings
        );
      default:
        return createMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as LineChartStyle,
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
  matches: (numerical, categorical, date) =>
    compare([1, 2, 1], [numerical.length, categorical.length, date.length]),
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
          styleOptions as LineChartStyle,
          axisColumnMappings
        );
      case 'area':
        return createFacetedMultiAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as AreaChartStyle,
          axisColumnMappings
        );
      case 'bar':
        return createFacetedTimeBarChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as BarChartStyle,
          axisColumnMappings
        );
      default:
        return createFacetedMultiLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as LineChartStyle,
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
    return 'COMPATIBLE_MATCH';
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
          styleOptions as HeatmapChartStyle,
          axisColumnMappings
        );
      case 'bar':
        return createStackedBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as BarChartStyle,
          axisColumnMappings
        );
      case 'area':
        return createStackedAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as AreaChartStyle,
          axisColumnMappings
        );
      default:
        return createRegularHeatmap(
          transformedData,
          numericalColumns,
          styleOptions as HeatmapChartStyle,
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
    return 'COMPATIBLE_MATCH';
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
          styleOptions as HeatmapChartStyle,
          axisColumnMappings
        );
      case 'bar':
        return createStackedBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as BarChartStyle,
          axisColumnMappings
        );
      case 'area':
        return createStackedAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as AreaChartStyle,
          axisColumnMappings
        );
      default:
        return createRegularHeatmap(
          transformedData,
          numericalColumns,
          styleOptions as HeatmapChartStyle,
          axisColumnMappings
        );
    }
  },
};

const oneMetricOneCateRule: VisualizationRule = {
  id: 'one-metric-one-category',
  name: 'one metric and one category',
  description: 'Multiple visualizations for one metric and one category',
  matches: (numerical, categorical, date) =>
    compare([1, 1, 0], [numerical.length, categorical.length, date.length]),
  chartTypes: [
    { ...CHART_METADATA.bar, priority: 100 },
    { ...CHART_METADATA.bar_gauge, priority: 80 },
    { ...CHART_METADATA.pie, priority: 60 },
    { ...CHART_METADATA.line, priority: 40 },
    { ...CHART_METADATA.area, priority: 20 },
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
      case 'bar_gauge':
        return createBarGaugeSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as BarGaugeChartStyle,
          axisColumnMappings
        );
      case 'bar':
        return createBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as BarChartStyle,
          axisColumnMappings
        );
      case 'pie':
        return createPieSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as PieChartStyle,
          axisColumnMappings
        );
      case 'line':
        return createCategoryLineChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as LineChartStyle,
          axisColumnMappings
        );
      case 'area':
        return createCategoryAreaChart(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as AreaChartStyle,
          axisColumnMappings
        );
      default:
        return createBarSpec(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as BarChartStyle,
          axisColumnMappings
        );
    }
  },
};

const oneMetricRule: VisualizationRule = {
  id: 'one-metric',
  name: 'one metric',
  description: 'Metric for one metric',
  matches: (numerical, categorical, date) =>
    compare([1, 0, 0], [numerical.length, categorical.length, date.length]),
  chartTypes: [
    { ...CHART_METADATA.metric, priority: 100 },
    { ...CHART_METADATA.gauge, priority: 80 },
    { ...CHART_METADATA.bar, priority: 60 },
  ],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'metric',
    axisColumnMappings
  ) => {
    switch (chartType) {
      case 'metric':
        return createSingleMetric(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as MetricChartStyle,
          axisColumnMappings
        );
      case 'gauge':
        return createGauge(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as GaugeChartStyle,
          axisColumnMappings
        );
      case 'bar':
        return createSingleBarChart(
          transformedData,
          numericalColumns,
          styleOptions as BarChartStyle,
          axisColumnMappings
        );
      default:
        return createSingleMetric(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as MetricChartStyle,
          axisColumnMappings
        );
    }
  },
};

const twoMetricRule: VisualizationRule = {
  id: 'two-metric',
  name: 'two metric',
  description: 'Scatter for two metric',
  matches: (numerical, categorical, date) =>
    compare([2, 0, 0], [numerical.length, categorical.length, date.length]),
  chartTypes: [
    { ...CHART_METADATA.scatter, priority: 100 },
    { ...CHART_METADATA.bar, priority: 80 },
  ],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter',
    axisColumnMappings
  ) => {
    switch (chartType) {
      case 'scatter':
        return createTwoMetricScatter(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOptions as ScatterChartStyle,
          axisColumnMappings
        );
      case 'bar':
        return createNumericalHistogramBarChart(
          transformedData,
          numericalColumns,
          styleOptions as BarChartStyle,
          axisColumnMappings
        );
    }
  },
};

const twoMetricOneCateRule: VisualizationRule = {
  id: 'two-metric-one-category',
  name: 'two metric and one category',
  description: 'Scatter for two metric and one category',
  matches: (numerical, categorical, date) =>
    compare([2, 1, 0], [numerical.length, categorical.length, date.length]),
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
      styleOptions as ScatterChartStyle,
      axisColumnMappings
    );
  },
};

const threeMetricOneCateRule: VisualizationRule = {
  id: 'three-metric-one-category',
  name: 'three metric and one category',
  description: 'Scatter for three metric and one category',
  matches: (numerical, categorical, date) =>
    compare([3, 1, 0], [numerical.length, categorical.length, date.length]),
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
      styleOptions as ScatterChartStyle,
      axisColumnMappings
    );
  },
};

const twoCateOneDateRule: VisualizationRule = {
  id: 'two-category-one-date',
  name: 'two category and one date',
  description: 'stateTimeLine for two category and one date',
  matches: (numerical, categorical, date) =>
    compare([0, 2, 1], [numerical.length, categorical.length, date.length]),
  chartTypes: [{ ...CHART_METADATA.state_timeline, priority: 100 }],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter',
    axisColumnMappings
  ) => {
    return createCategoricalStateTimeline(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions as StateTimeLineChartStyle,
      axisColumnMappings
    );
  },
};

const oneCateOneDateRule: VisualizationRule = {
  id: 'one-category-one-date',
  name: 'two category and one date',
  description: 'stateTimeLine for one category and one date',
  matches: (numerical, categorical, date) =>
    compare([0, 1, 1], [numerical.length, categorical.length, date.length]),
  chartTypes: [{ ...CHART_METADATA.state_timeline, priority: 100 }],
  toSpec: (
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    chartType = 'scatter',
    axisColumnMappings
  ) => {
    return createSingleCategoricalStateTimeline(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions as StateTimeLineChartStyle,
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
  oneMetricRule,
  twoCateOneDateRule,
  oneCateOneDateRule,
];
