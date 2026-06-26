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

import { last, first, flatten, values } from 'lodash';
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

    // Find component metrics for this math series.
    // Component metric series have IDs like "series-1:metric-a" (no split) or
    // "series-1:<splitKey>:metric-a" (when the series is split by terms/filters).
    const componentSeries = panelData.series.filter((s) => s.id.startsWith(seriesConfig.id + ':'));

    if (componentSeries.length > 0) {
      // Group the component series by split bucket so a split-by-terms math series
      // produces one evaluated series per split. Without this, a split series emits a
      // single empty series and the visualization renders no data.
      const splits = groupComponentSeriesBySplit(seriesConfig, mathMetric, componentSeries);

      splits.forEach((split) => {
        evaluatedSeries.push(evaluateMathSplit(seriesConfig, mathMetric, split));
      });

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
 * Groups a math series' component metrics by their split bucket.
 *
 * The raw endpoint appends the metric id to each series id. A non-split
 * ("everything") series has the form `${seriesId}:${metricId}`, while a series
 * split by terms/filters has the form `${seriesId}:${splitKey}:${metricId}`.
 * Stripping the trailing `:${metricId}` yields the split id, which we use to
 * group the component metrics that belong to the same split bucket (one evaluated
 * math series per split).
 *
 * @param {Object} seriesConfig - The series configuration from the panel
 * @param {Object} mathMetric - The math metric definition (for variable field tokens)
 * @param {Array} componentSeries - Component metric series for this math series
 * @returns {Array} One entry per split: { id, label, color, metrics: { [token]: serie } }
 */
function groupComponentSeriesBySplit(seriesConfig, mathMetric, componentSeries) {
  // Tokens are the possible id suffixes a component series can carry: a plain metric
  // id (e.g. "metric-a") or a percentile-value reference used by a math variable
  // (e.g. "metric-a[95]"). Variables are resolved by these same tokens. Longest-first
  // so the most specific token wins.
  const tokens = [
    ...seriesConfig.metrics.map((m) => m.id),
    ...(mathMetric.variables || []).map((v) => v.field),
  ]
    .filter((t) => typeof t === 'string' && t.length > 0)
    .sort((a, b) => b.length - a.length);

  const splitsById = new Map();

  componentSeries.forEach((serie) => {
    // Match the trailing `:${token}` to recover both the split id (everything before
    // it) and the token under which the variable will look this series up.
    const token = tokens.find((t) => serie.id.endsWith(`:${t}`));
    if (!token) return;

    // Everything before the `:${token}` suffix is the split id. For a non-split
    // series this equals seriesConfig.id; for a terms/filters split it is
    // `${seriesConfig.id}:${splitKey}`.
    const splitId = serie.id.slice(0, serie.id.length - `:${token}`.length);

    if (!splitsById.has(splitId)) {
      splitsById.set(splitId, {
        id: splitId,
        label: serie.label,
        color: serie.color,
        metrics: {},
      });
    }
    splitsById.get(splitId).metrics[token] = serie;
  });

  return Array.from(splitsById.values());
}

/**
 * Evaluates the math expression for a single split bucket.
 *
 * @param {Object} seriesConfig - The series configuration from the panel
 * @param {Object} mathMetric - The math metric definition
 * @param {Object} split - A split bucket from groupComponentSeriesBySplit
 * @returns {Object} Evaluated series with computed data
 */
function evaluateMathSplit(seriesConfig, mathMetric, split) {
  const decoration = getDefaultDecoration(seriesConfig);

  // For a non-split ("everything") series the split id equals the series id, and we
  // keep the configured series label/color. For a terms/filters split, each bucket
  // carries its own label (the term value) and color.
  const isSplit = split.id !== seriesConfig.id;
  const label = isSplit
    ? split.label || seriesConfig.label || 'Math'
    : seriesConfig.label || 'Math';
  const color = isSplit ? split.color : seriesConfig.color;

  const emptySeries = {
    id: split.id,
    label,
    color,
    data: [],
    ...decoration,
  };

  if (!mathMetric.variables || mathMetric.variables.length === 0) {
    return emptySeries;
  }

  // Build splitData mapping variable names to [timestamp, value] arrays. Components
  // are keyed by the variable field (the metric id, or "${metricId}[${percentile}]"
  // for percentile references), so each variable resolves directly to its component.
  const splitData = {};
  mathMetric.variables.forEach((variable) => {
    const componentSerie = split.metrics[variable.field];
    if (componentSerie) {
      splitData[variable.name] = componentSerie.data;
    }
  });

  // Build params._all structure
  const all = Object.keys(splitData).reduce((acc, key) => {
    acc[key] = {
      values: splitData[key].map((x) => x[1]),
      timestamps: splitData[key].map((x) => x[0]),
    };
    return acc;
  }, {});

  // Get timestamps from first variable
  const firstVar = first(mathMetric.variables);
  if (!splitData[firstVar.name]) {
    return emptySeries;
  }

  const timestamps = splitData[firstVar.name].map((r) => first(r));

  // Get bucket size from any component series metadata for this split
  const componentForMeta = values(split.metrics)[0];
  const bucketSize = componentForMeta?.meta?.bucketSize || 0;

  // Evaluate expression for each timestamp
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
    id: split.id,
    label,
    color,
    data,
    ...decoration,
  };
}
