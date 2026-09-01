/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart, TimeRange } from '../../../data/public';
import { NormalizedVariableOption, PromQLLabelMatcher, PromQLResourceQuery } from './types';
import { applyRegexToVariableOptions } from './variable_query_utils';

/** Applies `transform` to every free-text field of a PromQL query type. */
export function mapResourceQueryTextFields(
  queryType: PromQLResourceQuery,
  transform: (value: string) => string
): PromQLResourceQuery {
  switch (queryType.kind) {
    case 'labelNames':
    case 'metrics':
      return {
        ...queryType,
        metricRegex:
          queryType.metricRegex !== undefined ? transform(queryType.metricRegex) : undefined,
      };
    case 'labelValues':
      return {
        ...queryType,
        label: transform(queryType.label),
        metric: queryType.metric !== undefined ? transform(queryType.metric) : undefined,
        matchers: queryType.matchers?.map((matcher) => ({
          ...matcher,
          label: transform(matcher.label),
          value: transform(matcher.value),
        })),
      };
    case 'series':
      return { ...queryType, matcher: transform(queryType.matcher) };
    default: {
      const _exhaustive: never = queryType;
      return _exhaustive;
    }
  }
}

/** Collect every free-text field value of a PromQL query type (for dependency detection). */
export function collectResourceQueryTextFields(queryType: PromQLResourceQuery): string[] {
  const fields: string[] = [];
  mapResourceQueryTextFields(queryType, (value) => {
    fields.push(value);
    return value;
  });
  return fields;
}

/** Interpolates `${var}`/`$var` references in every free-text field of a PromQL query type. */
export function interpolateResourceQuery(
  queryType: PromQLResourceQuery,
  interpolate: (value: string) => string
): PromQLResourceQuery {
  return mapResourceQueryTextFields(queryType, interpolate);
}

/**
 * Metadata entry for a single metric, as returned by Prometheus's
 * /api/v1/metadata endpoint (one metric name maps to a list because some
 * metrics report metadata per target; we only ever surface the first entry).
 */
export interface PromQLMetricMetadataEntry {
  type: string;
  unit: string;
  help: string;
}

/**
 * Minimal shape of PrometheusResourceClient consumed here.
 */
export interface PromQLResourceClientLike {
  getLabels(
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    metric?: string,
    timeRange?: TimeRange
  ): Promise<string[]>;
  getLabelValues(
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    label?: string,
    timeRange?: TimeRange
  ): Promise<string[]>;
  getMetrics(
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    timeRange?: TimeRange,
    metric?: string
  ): Promise<string[]>;
  getMetricMetadata(
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    metric?: string,
    timeRange?: TimeRange
  ): Promise<Record<string, PromQLMetricMetadataEntry[]>>;
  getSeries(
    dataConnectionId: string,
    match: string,
    meta?: Record<string, unknown>,
    timeRange?: TimeRange
  ): Promise<Array<Record<string, string>>>;
}

/**
 * Resolve the registered PromQL resource client from the data plugin.
 * Returns undefined if the query_enhancements plugin (which registers the
 * 'prometheus' resource client) is not installed/enabled.
 */
export function getPromQLResourceClient(
  dataPlugin: DataPublicPluginStart
): PromQLResourceClientLike | undefined {
  try {
    return dataPlugin.resourceClientFactory.get<PromQLResourceClientLike>('prometheus');
  } catch {
    return undefined;
  }
}

/**
 * Escape a value for safe embedding in a PromQL string literal within a
 * series selector (double quotes and backslashes).
 */
function escapeSelectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Combine an optional metric filter and a list of label matchers.
 */
export function buildSeriesSelector(
  metric?: string,
  matchers?: PromQLLabelMatcher[],
  metricOperator: '=' | '=~' = '='
): string | undefined {
  const clauses: string[] = [];

  if (metric) {
    clauses.push(`__name__${metricOperator}"${escapeSelectorValue(metric)}"`);
  }

  (matchers ?? [])
    .filter((matcher) => matcher.label.trim() && matcher.value.trim())
    .forEach((matcher) => {
      clauses.push(`${matcher.label}${matcher.operator}"${escapeSelectorValue(matcher.value)}"`);
    });

  if (clauses.length === 0) {
    return undefined;
  }

  return `{${clauses.join(', ')}}`;
}

/**
 * Turn a Prometheus series (a single flat label-set object, as returned by
 * the /api/v1/series resource) into a single display string, e.g.:
 * {"__name__": "up", "job": "node", "instance": "host:9100"}
 *   -> 'up{instance="host:9100", job="node"}'
 */
function seriesLabelSetToString(series: Record<string, string>): string {
  const name = series.__name__;
  const labelPairs = Object.entries(series)
    .filter(([key]) => key !== '__name__')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}="${escapeSelectorValue(value)}"`);

  if (labelPairs.length === 0) {
    return name ?? '';
  }

  return `${name ?? ''}{${labelPairs.join(', ')}}`;
}

export async function executePromQLResourceQuery(
  dataPlugin: DataPublicPluginStart,
  dataConnectionId: string | undefined,
  queryType: PromQLResourceQuery,
  timeRange?: TimeRange
): Promise<string[]> {
  if (!dataConnectionId) {
    throw new Error('A dataset must be selected to fetch PromQL variable options.');
  }

  const client = getPromQLResourceClient(dataPlugin);
  if (!client) {
    throw new Error(
      'PromQL resource client is not available. Ensure the query_enhancements plugin is enabled.'
    );
  }

  switch (queryType.kind) {
    case 'labelNames': {
      const selector = buildSeriesSelector(queryType.metricRegex, undefined, '=~');
      return client.getLabels(dataConnectionId, undefined, selector, timeRange);
    }

    case 'labelValues': {
      const selector = buildSeriesSelector(queryType.metric, queryType.matchers);
      return client.getLabelValues(
        dataConnectionId,
        selector ? { 'match[]': selector } : undefined,
        queryType.label,
        timeRange
      );
    }

    case 'metrics': {
      const selector = buildSeriesSelector(queryType.metricRegex, undefined, '=~');
      return client.getMetrics(dataConnectionId, undefined, timeRange, selector);
    }

    case 'series': {
      const series = await client.getSeries(
        dataConnectionId,
        queryType.matcher,
        undefined,
        timeRange
      );
      return series.map(seriesLabelSetToString);
    }

    default: {
      // Exhaustiveness check — new PromQLResourceQuery variants must be handled above.
      const _exhaustive: never = queryType;
      throw new Error(`Unsupported PromQL variable query type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/**
 * Convert raw string values from a PromQL resource query into normalized
 * variable options, applying the shared regex filter/extractor (the same
 * one used by the free-text query flow) and de-duplicating.
 */
export function buildPromQLVariableOptions(
  values: string[],
  regex?: string
): NormalizedVariableOption[] {
  const uniqueValues = Array.from(new Set(values));
  const options: NormalizedVariableOption[] = uniqueValues.map((value) => ({ value }));
  return applyRegexToVariableOptions(options, regex);
}
