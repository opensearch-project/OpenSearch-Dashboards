/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataPublicPluginStart } from '../../../../../../../data/public';
import {
  buildSeriesSelector,
  getPromQLResourceClient,
} from '../../../../../variables/promql_variable_query_utils';
import { PromQLLabelMatcher, PromQLResourceQuery } from '../../../../../variables/types';
import { Dataset } from '../../../../../../../data/common';

/** Cache key for a Label filter row's value options, keyed by label + selector. */
const matcherValueCacheKey = (label: string, selector?: string): string =>
  `${label}\n${selector ?? ''}`;

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
  const promqlMetric =
    promQLResourceQuery?.kind === 'labelValues' ? promQLResourceQuery.metric : undefined;

  // Latest scope, read when a fetch resolves to discard results issued under a
  // now-changed dataset/metric (out-of-order responses).
  const currentScopeRef = useRef({ datasetId: dataset?.id, metric: promqlMetric });
  currentScopeRef.current = { datasetId: dataset?.id, metric: promqlMetric };

  // Skip state updates from fetches that resolve after unmount.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getTimeRange = useCallback(
    () => (useTimeFilter ? data.query.timefilter.timefilter.getTime() : undefined),
    [useTimeFilter, data]
  );

  // Shared lazy loader for the metric-name and label-name dropdowns: dedups when
  // already loaded/in-flight, and drops out-of-order or post-unmount responses.
  const loadNameList = useCallback(
    (opts: {
      alreadyLoaded: boolean;
      fetchList: () => Promise<string[]>;
      isStale: () => boolean;
      setOptions: (v: string[]) => void;
      setLoading: (v: boolean) => void;
      onLoaded: () => void;
    }) => {
      if (!isPrometheusResource || !dataset?.id || opts.alreadyLoaded) {
        return;
      }
      if (!getPromQLResourceClient(data)) {
        return;
      }
      opts.setLoading(true);
      opts
        .fetchList()
        .then((list) => {
          if (opts.isStale()) return;
          opts.setOptions(list);
          opts.onLoaded();
        })
        .catch(() => {
          if (opts.isStale()) return;
          opts.setOptions([]);
        })
        .finally(() => {
          if (opts.isStale()) return;
          opts.setLoading(false);
        });
    },
    [isPrometheusResource, dataset?.id, data]
  );

  // Metric names for the Metric dropdown. Loaded lazily, cached per dataset.
  const [promqlMetricNameOptions, setPromqlMetricNameOptions] = useState<string[]>([]);
  const [promqlMetricNamesLoading, setPromqlMetricNamesLoading] = useState(false);
  const [loadedMetricNamesDataset, setLoadedMetricNamesDataset] = useState<string | undefined>(
    undefined
  );

  // Reset cache and loading when the dataset changes.
  useEffect(() => {
    setPromqlMetricNameOptions([]);
    setLoadedMetricNamesDataset(undefined);
    setPromqlMetricNamesLoading(false);
  }, [dataset?.id]);

  const loadMetricNames = useCallback(() => {
    const datasetId = dataset?.id;
    loadNameList({
      alreadyLoaded: loadedMetricNamesDataset === datasetId || promqlMetricNamesLoading,
      fetchList: () =>
        getPromQLResourceClient(data)!.getMetrics(datasetId!, undefined, getTimeRange()),
      isStale: () => !isMountedRef.current || currentScopeRef.current.datasetId !== datasetId,
      setOptions: setPromqlMetricNameOptions,
      setLoading: setPromqlMetricNamesLoading,
      onLoaded: () => setLoadedMetricNamesDataset(datasetId),
    });
  }, [
    loadNameList,
    dataset?.id,
    data,
    getTimeRange,
    loadedMetricNamesDataset,
    promqlMetricNamesLoading,
  ]);

  // Per-row Label filter value options, loaded lazily and keyed by label + selector.
  const [promqlMatcherValueOptions, setPromqlMatcherValueOptions] = useState<
    Record<string, string[]>
  >({});
  const [promqlMatcherValueLoading, setPromqlMatcherValueLoading] = useState<
    Record<string, boolean>
  >({});

  // Matcher values are scoped by dataset and metric; drop them (and any stale
  // in-flight loading flags) when either changes.
  useEffect(() => {
    setPromqlMatcherValueOptions({});
    setPromqlMatcherValueLoading({});
  }, [dataset?.id, promqlMetric]);

  const loadPromqlMatcherValues = useCallback(
    (label: string, selector: string | undefined, metricAtRequest: string | undefined) => {
      if (!label.trim() || !dataset?.id) {
        return;
      }

      const client = getPromQLResourceClient(data);
      if (!client) {
        return;
      }

      const cacheKey = matcherValueCacheKey(label, selector);
      // Skip if already fetched or a fetch is already in flight for this key.
      if (cacheKey in promqlMatcherValueOptions || promqlMatcherValueLoading[cacheKey]) {
        return;
      }

      const meta = selector ? { 'match[]': selector } : undefined;
      const timeRange = getTimeRange();
      const datasetId = dataset.id;

      // Ignore the result if unmounted or the dataset/metric changed mid-flight.
      // The values are selector-scoped (metric + siblings), so a late response
      // from an old scope must not write into the (now-orphaned) cache entry.
      const isStale = () =>
        !isMountedRef.current ||
        currentScopeRef.current.datasetId !== datasetId ||
        currentScopeRef.current.metric !== metricAtRequest;

      setPromqlMatcherValueLoading((prev) => ({ ...prev, [cacheKey]: true }));
      client
        .getLabelValues(datasetId, meta, label, timeRange)
        .then((values) => {
          if (isStale()) return;
          setPromqlMatcherValueOptions((prev) => ({ ...prev, [cacheKey]: values }));
        })
        .catch(() => {
          if (isStale()) return;
          setPromqlMatcherValueOptions((prev) => ({ ...prev, [cacheKey]: [] }));
        })
        .finally(() => {
          if (isStale()) return;
          setPromqlMatcherValueLoading((prev) => {
            const { [cacheKey]: _removed, ...rest } = prev;
            return rest;
          });
        });
    },
    [dataset?.id, data, getTimeRange, promqlMatcherValueOptions, promqlMatcherValueLoading]
  );

  // Label filters row mutators — only meaningful for the `labelValues` query type.
  const promqlMatchers: PromQLLabelMatcher[] = useMemo(
    () => (promQLResourceQuery?.kind === 'labelValues' ? (promQLResourceQuery.matchers ?? []) : []),
    [promQLResourceQuery]
  );

  // Label names for the "Select label..." dropdown. Loaded lazily, scoped to the
  // selected metric, cached per metric.
  const [promqlLabelNameOptions, setPromqlLabelNameOptions] = useState<string[]>([]);
  const [promqlLabelNamesLoading, setPromqlLabelNamesLoading] = useState(false);
  const [loadedLabelNamesMetric, setLoadedLabelNamesMetric] = useState<string | undefined>(
    undefined
  );

  // Reset cache and loading when the metric or dataset changes.
  useEffect(() => {
    setPromqlLabelNameOptions([]);
    setLoadedLabelNamesMetric(undefined);
    setPromqlLabelNamesLoading(false);
  }, [promqlMetric, dataset?.id]);

  const loadLabelNames = useCallback(() => {
    const datasetId = dataset?.id;
    const metricAtRequest = promqlMetric;
    loadNameList({
      alreadyLoaded: loadedLabelNamesMetric === (metricAtRequest ?? '') || promqlLabelNamesLoading,
      fetchList: () =>
        getPromQLResourceClient(data)!.getLabels(
          datasetId!,
          undefined,
          buildSeriesSelector(metricAtRequest),
          getTimeRange()
        ),
      isStale: () =>
        !isMountedRef.current ||
        currentScopeRef.current.datasetId !== datasetId ||
        currentScopeRef.current.metric !== metricAtRequest,
      setOptions: setPromqlLabelNameOptions,
      setLoading: setPromqlLabelNamesLoading,
      onLoaded: () => setLoadedLabelNamesMetric(metricAtRequest ?? ''),
    });
  }, [
    loadNameList,
    dataset?.id,
    data,
    getTimeRange,
    promqlMetric,
    loadedLabelNamesMetric,
    promqlLabelNamesLoading,
  ]);

  // Selector for row `i`'s value lookup: current metric + every other filled sibling matcher.
  const selectorForRow = useCallback(
    (index: number): string | undefined => {
      const siblings = promqlMatchers.filter(
        (matcher, i) => i !== index && matcher.label.trim() && matcher.value.trim()
      );
      return buildSeriesSelector(promqlMetric, siblings);
    },
    [promqlMatchers, promqlMetric]
  );

  // A row's trimmed label + its scoped cache key, or undefined when unset.
  const rowKey = useCallback(
    (index: number): { label: string; cacheKey: string } | undefined => {
      const label = promqlMatchers[index]?.label.trim();
      if (!label) {
        return undefined;
      }
      return { label, cacheKey: matcherValueCacheKey(label, selectorForRow(index)) };
    },
    [promqlMatchers, selectorForRow]
  );

  // Load a row's value options — called when the user opens that row's dropdown.
  const loadMatcherValues = useCallback(
    (index: number) => {
      const key = rowKey(index);
      if (key) {
        loadPromqlMatcherValues(key.label, selectorForRow(index), promqlMetric);
      }
    },
    [rowKey, selectorForRow, loadPromqlMatcherValues, promqlMetric]
  );

  // Value options for a given Label filter row, scoped to that row's selector.
  const getMatcherValueOptions = useCallback(
    (index: number): string[] => {
      const key = rowKey(index);
      return key ? (promqlMatcherValueOptions[key.cacheKey] ?? []) : [];
    },
    [rowKey, promqlMatcherValueOptions]
  );

  // Whether a row's value options are currently being fetched.
  const isMatcherValueLoading = useCallback(
    (index: number): boolean => {
      const key = rowKey(index);
      return key ? !!promqlMatcherValueLoading[key.cacheKey] : false;
    },
    [rowKey, promqlMatcherValueLoading]
  );

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
    promqlLabelNamesLoading,
    loadLabelNames,
    promqlMetricNameOptions,
    promqlMetricNamesLoading,
    loadMetricNames,
    getMatcherValueOptions,
    loadMatcherValues,
    isMatcherValueLoading,
    promqlMatchers,
    addPromqlMatcher,
    updatePromqlMatcherAt,
    removePromqlMatcherAt,
  };
}
