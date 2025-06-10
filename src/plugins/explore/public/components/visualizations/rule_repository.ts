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

// TODO: add more rules here as needed

// Export all rules
export const ALL_VISUALIZATION_RULES: VisualizationRule[] = [
  oneMetricOneDateRule,
  twoMetricOneDateRule,
  oneMetricOneCateOneDateRule,
  oneMetricTwoCateOneDateRule,
];
