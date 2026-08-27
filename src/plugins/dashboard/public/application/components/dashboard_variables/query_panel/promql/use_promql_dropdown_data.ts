/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataPublicPluginStart } from '../../../../../../../data/public';
import { getPromQLResourceClient } from '../../../../../variables/promql_variable_query_utils';
import { PromQLLabelMatcher, PromQLResourceQuery } from '../../../../../variables/types';
import { Dataset } from '../../../../../../../data/common';

export interface UsePromqlDropdownDataArgs {
  data: DataPublicPluginStart;
  dataset: Dataset | undefined;
  useTimeFilter: boolean;
  isPrometheusResource: boolean;
  promQLResourceQuery: PromQLResourceQuery | undefined;
  onResourceQueryChange?: (queryType: PromQLResourceQuery) => void;
}

/**
 * Owns all Prometheus resource-API-backed dropdown data and Label filter row
 * mutation logic for the PromQL resource query forms (Label names/Label
 * values/Metrics/Series query).
 */
export function usePromqlDropdownData({
  data,
  dataset,
  useTimeFilter,
  isPrometheusResource,
  promQLResourceQuery,
  onResourceQueryChange,
}: UsePromqlDropdownDataArgs) {
  // Dropdown source data for the PromQL resource query forms (label names,
  // metric names) — backed by the same Prometheus resource API already used
  // for autocomplete elsewhere.
  const [promqlLabelNameOptions, setPromqlLabelNameOptions] = useState<string[]>([]);
  const [promqlMetricNameOptions, setPromqlMetricNameOptions] = useState<string[]>([]);

  // Load the label name and metric name dropdown options for the PromQL.
  useEffect(() => {
    if (!isPrometheusResource || !dataset?.id) {
      setPromqlLabelNameOptions([]);
      setPromqlMetricNameOptions([]);
      return;
    }

    const client = getPromQLResourceClient(data);
    if (!client) {
      return;
    }

    let cancelled = false;
    const timeRange = useTimeFilter ? data.query.timefilter.timefilter.getTime() : undefined;

    client
      .getLabels(dataset.id, undefined, undefined, timeRange)
      .then((labels) => {
        if (!cancelled) setPromqlLabelNameOptions(labels);
      })
      .catch(() => {
        if (!cancelled) setPromqlLabelNameOptions([]);
      });

    client
      .getMetrics(dataset.id, undefined, timeRange)
      .then((metrics) => {
        if (!cancelled) setPromqlMetricNameOptions(metrics);
      })
      .catch(() => {
        if (!cancelled) setPromqlMetricNameOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isPrometheusResource, dataset?.id, data, useTimeFilter]);

  // Value options for each Label filter row, keyed by that row's selected
  // label. Loaded on demand when a row's label is chosen/changed.
  const [promqlMatcherValueOptions, setPromqlMatcherValueOptions] = useState<
    Record<string, string[]>
  >({});

  const loadPromqlMatcherValues = useCallback(
    (label: string) => {
      if (!label.trim() || !dataset?.id) {
        return;
      }

      const client = getPromQLResourceClient(data);
      if (!client) {
        return;
      }

      const timeRange = useTimeFilter ? data.query.timefilter.timefilter.getTime() : undefined;

      client
        .getLabelValues(dataset.id, undefined, label, timeRange)
        .then((values) => {
          setPromqlMatcherValueOptions((prev) => ({ ...prev, [label]: values }));
        })
        .catch(() => {
          setPromqlMatcherValueOptions((prev) => ({ ...prev, [label]: [] }));
        });
    },
    [dataset?.id, data, useTimeFilter]
  );

  // Label filters row mutators — only meaningful for the `labelValues` query type.
  const promqlMatchers: PromQLLabelMatcher[] = useMemo(
    () => (promQLResourceQuery?.kind === 'labelValues' ? (promQLResourceQuery.matchers ?? []) : []),
    [promQLResourceQuery]
  );

  const promqlMatcherLabelsKey = useMemo(
    () => promqlMatchers.map((m) => m.label).join(','),
    [promqlMatchers]
  );

  useEffect(() => {
    if (!isPrometheusResource || !dataset?.id) {
      return;
    }

    const labelsNeedingValues = Array.from(
      new Set(
        promqlMatchers
          .map((matcher) => matcher.label.trim())
          .filter((label) => label && !(label in promqlMatcherValueOptions))
      )
    );

    labelsNeedingValues.forEach((label) => loadPromqlMatcherValues(label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrometheusResource, dataset?.id, promqlMatcherLabelsKey, loadPromqlMatcherValues]);

  const updatePromqlMatchers = useCallback(
    (nextMatchers: PromQLLabelMatcher[]) => {
      if (promQLResourceQuery?.kind !== 'labelValues' || !onResourceQueryChange) {
        return;
      }
      onResourceQueryChange({ ...promQLResourceQuery, matchers: nextMatchers });
    },
    [promQLResourceQuery, onResourceQueryChange]
  );

  const addPromqlMatcher = useCallback(() => {
    updatePromqlMatchers([...promqlMatchers, { label: '', operator: '=', value: '' }]);
  }, [promqlMatchers, updatePromqlMatchers]);

  const updatePromqlMatcherAt = useCallback(
    (index: number, patch: Partial<PromQLLabelMatcher>) => {
      const next = promqlMatchers.map((matcher, i) =>
        i === index ? { ...matcher, ...patch } : matcher
      );
      updatePromqlMatchers(next);
    },
    [promqlMatchers, updatePromqlMatchers]
  );

  const removePromqlMatcherAt = useCallback(
    (index: number) => {
      updatePromqlMatchers(promqlMatchers.filter((_, i) => i !== index));
    },
    [promqlMatchers, updatePromqlMatchers]
  );

  return {
    promqlLabelNameOptions,
    promqlMetricNameOptions,
    promqlMatcherValueOptions,
    loadPromqlMatcherValues,
    promqlMatchers,
    addPromqlMatcher,
    updatePromqlMatcherAt,
    removePromqlMatcherAt,
  };
}
