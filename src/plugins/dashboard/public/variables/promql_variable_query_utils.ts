/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart, TimeRange } from '../../../data/public';
import { NormalizedVariableOption, PromQLLabelMatcher, PromQLVariableQueryType } from './types';
import { applyRegexToVariableOptions } from './variable_query_utils';

/**
 * Single source of truth for the free-text fields of each PromQL query type: applies
 * `transform` to every text field and returns a new query type. Both interpolation and
 * dependency detection build on this one switch, so they can't silently diverge.
 */
export function mapPromqlQueryTypeTextFields(
  queryType: PromQLVariableQueryType,
  transform: (value: string) => string
): PromQLVariableQueryType {
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
    case 'queryResult':
      return queryType;
    default: {
      // Exhaustiveness check for new query-type variants.
      const _exhaustive: never = queryType;
      return _exhaustive;
    }
  }
}

/** Collect every free-text field value of a PromQL query type (for dependency detection). */
export function collectPromqlQueryTypeTextFields(queryType: PromQLVariableQueryType): string[] {
  const fields: string[] = [];
  mapPromqlQueryTypeTextFields(queryType, (value) => {
    fields.push(value);
    return value;
  });
  return fields;
}

/**
 * Interpolate `${var}`/`$var` references that may appear in any of the
 * free-text-like fields of a PromQL fill-in-the-blank query type (Label,
 * Metric, Metric regex, Series matcher, and label filter values) — mirrors
 * how `variable.query` is interpolated for the free-text flow, but applied
 * field-by-field since promqlQueryType is a structured object, not a string.
 *
 * `interpolate` is expected to be a no-op for strings with no variable
 * references, so it is safe to call unconditionally on every field.
 */
export function interpolatePromqlQueryType(
  queryType: PromQLVariableQueryType,
  interpolate: (value: string) => string
): PromQLVariableQueryType {
  return mapPromqlQueryTypeTextFields(queryType, interpolate);
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
  return dataPlugin.resourceClientFactory.get<PromQLResourceClientLike>('prometheus');
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
function buildSeriesSelector(
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

export function hasValidLabelValuesSelector(
  metric: string | undefined,
  matchers: PromQLLabelMatcher[]
): boolean {
  if (metric && metric.trim()) {
    return true;
  }
  const activeMatchers = matchers.filter((matcher) => matcher.label.trim() && matcher.value.trim());
  if (activeMatchers.length === 0) {
    return true;
  }
  return activeMatchers.some((matcher) => matcher.operator === '=' || matcher.operator === '=~');
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
    .map(([key, value]) => `${key}="${value}"`);

  if (labelPairs.length === 0) {
    return name ?? '';
  }

  return `${name ?? ''}{${labelPairs.join(', ')}}`;
}

export async function executePromQLResourceQuery(
  dataPlugin: DataPublicPluginStart,
  dataConnectionId: string | undefined,
  queryType: PromQLVariableQueryType,
  timeRange?: TimeRange
): Promise<string[]> {
  if (queryType.kind === 'queryResult') {
    throw new Error(
      "executePromQLResourceQuery does not handle the 'queryResult' query type — " +
        'use executeVariableQuery with the free-text query instead.'
    );
  }

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
      if (!hasValidLabelValuesSelector(queryType.metric, queryType.matchers ?? [])) {
        throw new Error(
          'Add a Metric, or an "=" / "=~" label filter — a selector made only of "!=" / "!~" ' +
            'filters is not valid in PromQL.'
        );
      }
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
      // Exhaustiveness check — new PromQLVariableQueryType variants must be handled above.
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
