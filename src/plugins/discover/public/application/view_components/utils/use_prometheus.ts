/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

const PROMETHEUS_ENDPOINT = 'http://127.0.0.1:9090';

interface PrometheusDataSourceMetadata {
  selectedMetricName: string | null;
  metricNames: string[];
  labelNames: string[];
}

export interface PrometheusContext {
  metadata: PrometheusDataSourceMetadata;
  actions: {
    setSelectedMetricName: (selectedMetricName: string) => void;
  };
}

export const usePrometheus = (): PrometheusContext => {
  const [selectedMetricName, setSelectedMetricName] = useState<string | null>(null);
  const [metricNames, setMetricNames] = useState<string[]>([]);
  const [labelNames, setLabelNames] = useState<string[]>([]);

  const updateLabels = useCallback(async () => {
    const query = selectedMetricName ? `?match[]=${selectedMetricName}` : '';
    const response = await fetch(`${PROMETHEUS_ENDPOINT}/api/v1/labels${query}`).then((r) =>
      r.json()
    );
    setLabelNames(response.data.slice(1));
  }, [selectedMetricName]);

  const updateMetrics = useCallback(async () => {
    const response = await fetch(`${PROMETHEUS_ENDPOINT}/api/v1/label/__name__/values`).then((r) =>
      r.json()
    );
    setMetricNames(response.data);
  }, []);

  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  useEffect(() => {
    updateLabels();
  }, [selectedMetricName, updateLabels]);

  return {
    metadata: {
      selectedMetricName,
      metricNames,
      labelNames,
    },
    actions: {
      setSelectedMetricName,
    },
  };
};
