/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Process Math Series - High-level TSVB math expression processor
 *
 * This module implements client-side math expression evaluation for TSVB visualizations.
 * It processes raw metric data and evaluates math expressions defined in panel configurations.
 *
 * Purpose:
 * - Process raw response data from /api/metrics/vis/data-raw endpoint
 * - Find math series configurations in panel settings
 * - Build evaluation context (params.a, params.b, params._all, params._index, etc.)
 * - Evaluate math expressions using mathjs_wrapper.js
 * - Handle edge cases (division by zero → null, null values → null)
 * - Return processed series data ready for visualization
 *
 * Server-side equivalent: server/lib/vis_data/response_processors/series/math.js
 *
 * Related file: mathjs_wrapper.js (low-level expression evaluator used by this module)
 *
 * Example usage:
 *   const rawResponse = await fetch('/api/metrics/vis/data-raw', { ... });
 *   const processedResponse = evaluateMathExpressions(rawResponse, panelConfig);
 *   // processedResponse now contains evaluated math series ready for rendering
 */

import { last, first, flatten, values, startsWith } from 'lodash';
import { evaluate, configureMathJs } from './mathjs_wrapper';

// Configure Math.js with security restrictions
configureMathJs();

/**
 * Gets default decoration properties for series rendering.
 * This replicates server/lib/vis_data/helpers/get_default_decoration.js
 */
function getDefaultDecoration(series) {
  const pointSize =
    series.point_size != null ? Number(series.point_size) : Number(series.line_width);
  const showPoints = series.chart_type === 'line' && pointSize !== 0;

  return {
    seriesId: series.id,
    stack: series.stacked,
    lines: {
      show: series.chart_type === 'line' && series.line_width !== 0,
      fill: Number(series.fill),
      lineWidth: Number(series.line_width),
      steps: series.steps || false,
    },
    points: {
      show: showPoints,
      radius: 1,
      lineWidth: showPoints ? pointSize : 5,
    },
    bars: {
      show: series.chart_type === 'bar',
      fill: Number(series.fill),
      lineWidth: Number(series.line_width),
    },
  };
}

/**
 * Evaluates math expressions client-side for TSVB visualizations.
 * This mirrors the server-side math evaluation logic from
 * server/lib/vis_data/response_processors/series/math.js
 *
 * @param {Object} response - The raw response from /api/metrics/vis/data-raw containing individual metric values
 * @param {Object} panel - The panel configuration containing series definitions with math metrics
 * @returns {Object} Response with math expressions evaluated and component metrics removed
 *
 * @example
 * const response = {
 *   'panel-1': {
 *     series: [
 *       { id: 'series-1:avg-cpu', data: [[1000, 50], [2000, 60]] },
 *       { id: 'series-1:max-cpu', data: [[1000, 100], [2000, 120]] }
 *     ]
 *   }
 * };
 * const panel = {
 *   id: 'panel-1',
 *   series: [{
 *     id: 'series-1',
 *     metrics: [
 *       { id: 'avg-cpu', type: 'avg' },
 *       { id: 'max-cpu', type: 'max' },
 *       {
 *         id: 'math-1',
 *         type: 'math',
 *         script: 'params.avg / params.max',
 *         variables: [
 *           { name: 'avg', field: 'avg-cpu' },
 *           { name: 'max', field: 'max-cpu' }
 *         ]
 *       }
 *     ]
 *   }]
 * };
 * const result = evaluateMathExpressions(response, panel);
 * // result = {
 * //   'panel-1': {
 * //     series: [{ id: 'series-1', data: [[1000, 0.5], [2000, 0.5]] }]
 * //   }
 * // }
 */
export function evaluateMathExpressions(response, panel) {
  const panelData = response[panel.id];
  if (!panelData || !panelData.series) {
    return response;
  }

  // Identify which series in the panel have math metrics
  const mathSeriesConfigs = panel.series.filter((s) => {
    const lastMetric = last(s.metrics);
    return lastMetric && lastMetric.type === 'math';
  });

  // Track which series IDs have been processed
  const evaluatedSeries = [];
  const processedIds = new Set();

  // Process each math series
  mathSeriesConfigs.forEach((seriesConfig) => {
    const mathMetric = last(seriesConfig.metrics);

    // Find component metrics for this math series
    // Component metrics have IDs like "series-1:metric-a", "series-1:metric-b"
    const componentSeries = panelData.series.filter((s) => s.id.startsWith(seriesConfig.id + ':'));

    if (componentSeries.length > 0) {
      const evaluatedSerie = evaluateMathSeries(seriesConfig, mathMetric, componentSeries);
      evaluatedSeries.push(evaluatedSerie);

      // Mark component series as processed
      componentSeries.forEach((s) => processedIds.add(s.id));
    } else {
      // No component metrics found, return empty series
      const decoration = getDefaultDecoration(seriesConfig);
      evaluatedSeries.push({
        id: seriesConfig.id,
        label: seriesConfig.label || 'Math',
        data: [],
        ...decoration,
      });
    }
  });

  // Include non-math series as-is
  const nonMathSeries = panelData.series.filter((s) => !processedIds.has(s.id));

  return {
    ...response,
    [panel.id]: {
      ...panelData,
      series: [...evaluatedSeries, ...nonMathSeries],
    },
  };
}

/**
 * Evaluates a single math series by combining component metrics.
 * This replicates the logic from server/lib/vis_data/response_processors/series/math.js:54-136
 *
 * @param {Object} seriesConfig - The series configuration from the panel
 * @param {Object} mathMetric - The math metric definition
 * @param {Array} componentSeries - Array of component metric series
 * @returns {Object} Evaluated series with computed data
 */
function evaluateMathSeries(seriesConfig, mathMetric, componentSeries) {
  const decoration = getDefaultDecoration(seriesConfig);
  if (!mathMetric.variables || mathMetric.variables.length === 0) {
    return {
      id: seriesConfig.id,
      label: seriesConfig.label || 'Math',
      data: [],
      ...decoration,
    };
  }

  // Build splitData structure mapping variable names to [timestamp, value] arrays
  // This mirrors math.js:57-70
  const splitData = {};
  mathMetric.variables.forEach((variable) => {
    const metric = seriesConfig.metrics.find((m) => startsWith(variable.field, m.id));
    if (!metric) return;

    // Find the component series for this variable
    const componentSerie = componentSeries.find((s) => s.id === `${seriesConfig.id}:${metric.id}`);
    if (componentSerie) {
      splitData[variable.name] = componentSerie.data;
    }
  });

  // Build params._all structure
  // This mirrors math.js:73-79
  const all = Object.keys(splitData).reduce((acc, key) => {
    acc[key] = {
      values: splitData[key].map((x) => x[1]),
      timestamps: splitData[key].map((x) => x[0]),
    };
    return acc;
  }, {});

  // Get timestamps from first variable
  // This mirrors math.js:83-92
  const firstVar = first(mathMetric.variables);
  if (!splitData[firstVar.name]) {
    return {
      id: seriesConfig.id,
      label: seriesConfig.label || 'Math',
      data: [],
      ...decoration,
    };
  }

  const timestamps = splitData[firstVar.name].map((r) => first(r));

  // Get bucket size from component series metadata
  const bucketSize = componentSeries[0].meta?.bucketSize || 0;

  // Evaluate expression for each timestamp
  // This mirrors math.js:96-128
  const data = timestamps.map((ts, index) => {
    // Build params object for this timestamp
    const params = mathMetric.variables.reduce((acc, v) => {
      acc[v.name] = last(splitData[v.name].find((row) => row[0] === ts));
      return acc;
    }, {});

    // Check for null values
    const someNull = values(params).some((v) => v == null);
    if (someNull) return [ts, null];

    try {
      // Evaluate expression with full context
      // Context matches server exactly (math.js:107-114)
      const result = evaluate(mathMetric.script, {
        params: {
          ...params,
          _index: index,
          _timestamp: ts,
          _all: all,
          _interval: bucketSize * 1000,
        },
      });

      // Handle object results (flatten and return last value)
      if (result !== null && typeof result === 'object') {
        return [ts, last(flatten(result.valueOf()))];
      }
      // Handle Infinity and -Infinity from division by zero
      if (!isFinite(result)) {
        return [ts, null];
      }
      return [ts, result];
    } catch (e) {
      // Special handling for division by zero (return null, don't throw)
      if (e.message === 'Cannot divide by 0') {
        return [ts, null];
      }
      // Re-throw other errors
      throw e;
    }
  });

  return {
    id: seriesConfig.id,
    label: seriesConfig.label || 'Math',
    color: seriesConfig.color,
    data,
    ...decoration,
  };
}
