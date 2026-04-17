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

  const onMetricFocus = useCallback(() => {
    if (metricNamesLoadedRef.current || metricOptions.length > 0) return;
    metricNamesLoadedRef.current = true;
    setMetricSearchLoading(true);
    client
      .getMetricNames()
      .then((names) => setMetricOptions(names.slice(0, 100).map((n) => ({ label: n }))))
      .catch(() => {})
      .finally(() => setMetricSearchLoading(false));
  }, [client, metricOptions.length]);

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

  // Fetch label names and derive cardinality from a single getSeries call
  useEffect(() => {
    if (!metric) {
      setLabelOptions([]);
      setLabelCardinality({});
      return;
    }
    let cancelled = false;
    Promise.all([client.getLabelsForMetric(metric), client.getSeries(`{__name__="${metric}"}`)])
      .then(([labels, series]) => {
        if (cancelled) return;
        setLabelOptions(labels.map((l) => ({ label: l })));

        const valueSets: Record<string, Set<string>> = {};
        for (const s of series) {
          for (const [key, value] of Object.entries(s)) {
            if (key === '__name__') continue;
            if (!valueSets[key]) valueSets[key] = new Set();
            valueSets[key].add(value);
          }
        }
        const cardinality: Record<string, number> = {};
        for (const label of labels) {
          cardinality[label] = valueSets[label]?.size ?? 0;
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
      if (!labelName || labelValueOptions[labelName]) return;
      client
        .getLabelValues(labelName, metric)
        .then((values) => {
          setLabelValueOptions((prev) => ({
            ...prev,
            [labelName]: values.map((v) => ({ label: v })),
          }));
        })
        .catch(() => {});
    },
    [client, metric, labelValueOptions]
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
