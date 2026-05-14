/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EuiComboBoxOptionOption } from '@elastic/eui';
import { PrometheusClient } from '../explore/services/prometheus_client';

export function useMetricData(client: PrometheusClient, metric: string) {
  const [metricOptions, setMetricOptions] = useState<EuiComboBoxOptionOption[]>([]);
  const [metricSearchLoading, setMetricSearchLoading] = useState(false);
  const [labelOptions, setLabelOptions] = useState<EuiComboBoxOptionOption[]>([]);
  const [labelValueOptions, setLabelValueOptions] = useState<
    Record<string, EuiComboBoxOptionOption[]>
  >({});
  const [labelCardinality, setLabelCardinality] = useState<Record<string, number>>({});

  const metricSearchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const metricNamesLoadedRef = useRef(false);
  const loadedLabelsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      clearTimeout(metricSearchTimerRef.current);
    };
  }, []);

  const onMetricFocus = useCallback(() => {
    if (metricNamesLoadedRef.current) return;
    metricNamesLoadedRef.current = true;
    setMetricSearchLoading(true);
    client
      .getMetricNames()
      .then((names) => setMetricOptions(names.slice(0, 100).map((n) => ({ label: n }))))
      .catch(() => {})
      .finally(() => setMetricSearchLoading(false));
  }, [client]);

  const onMetricSearchChange = useCallback(
    (searchValue: string) => {
      clearTimeout(metricSearchTimerRef.current);
      setMetricSearchLoading(false);
      if (searchValue.length < 2) {
        if (metricNamesLoadedRef.current) {
          client
            .getMetricNames()
            .then((names) => setMetricOptions(names.slice(0, 100).map((n) => ({ label: n }))))
            .catch(() => {});
        }
        return;
      }
      setMetricSearchLoading(true);
      metricSearchTimerRef.current = setTimeout(() => {
        client
          .searchMetricNames(searchValue)
          .then((names) => setMetricOptions(names.slice(0, 100).map((n) => ({ label: n }))))
          .catch(() => setMetricOptions([]))
          .finally(() => setMetricSearchLoading(false));
      }, 200);
    },
    [client]
  );

  useEffect(() => {
    loadedLabelsRef.current = new Set();
    setLabelValueOptions({});
    if (!metric) {
      setLabelOptions([]);
      setLabelCardinality({});
      return;
    }
    let cancelled = false;
    // The series response includes every label key on each entry, so we derive
    // both the label list and per-label cardinality from a single call rather
    // than also hitting /labels?match[]=<metric>.
    client
      .getSeries(`{__name__="${metric}"}`)
      .then((series) => {
        if (cancelled) return;
        const valueSets: Record<string, Set<string>> = {};
        for (const s of series) {
          for (const [key, value] of Object.entries(s)) {
            if (key === '__name__') continue;
            if (!valueSets[key]) valueSets[key] = new Set();
            valueSets[key].add(value);
          }
        }
        const labels = Object.keys(valueSets).sort();
        setLabelOptions(labels.map((l) => ({ label: l })));
        const cardinality: Record<string, number> = {};
        for (const label of labels) {
          cardinality[label] = valueSets[label].size;
        }
        setLabelCardinality(cardinality);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client, metric]);

  const loadLabelValues = useCallback(
    (labelName: string) => {
      if (!labelName || loadedLabelsRef.current.has(labelName)) return;
      loadedLabelsRef.current.add(labelName);
      client
        .getLabelValues(labelName, metric)
        .then((values) => {
          setLabelValueOptions((prev) => ({
            ...prev,
            [labelName]: values.map((v) => ({ label: v })),
          }));
        })
        .catch(() => {
          loadedLabelsRef.current.delete(labelName);
        });
    },
    [client, metric]
  );

  return {
    metricOptions,
    metricSearchLoading,
    labelOptions,
    labelValueOptions,
    labelCardinality,
    onMetricFocus,
    onMetricSearchChange,
    loadLabelValues,
  };
}
