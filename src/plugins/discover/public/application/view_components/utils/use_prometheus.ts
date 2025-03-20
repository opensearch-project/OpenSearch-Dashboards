/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';

interface PrometheusDataSourceMetadata {
  selectedMetricName?: string;
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
  const {
    services: { data },
  } = useOpenSearchDashboards<DiscoverViewServices>();
  const prometheusResourceClient = useMemo(() => {
    return data.resourceClientFactory.create('prometheus');
  }, [data.resourceClientFactory]);

  const [selectedMetricName, setSelectedMetricName] = useState<string | undefined>();
  const [metricNames, setMetricNames] = useState<string[]>([]);
  const [labelNames, setLabelNames] = useState<string[]>([]);

  const updateLabels = useCallback(async () => {
    const labels = await prometheusResourceClient.getLabels('my_prometheus');
    setLabelNames(labels.sort());
  }, [prometheusResourceClient]);

  const updateMetrics = useCallback(async () => {
    const metricMetadata = await prometheusResourceClient.getMetricMetadata('my_prometheus');
    const metrics = Object.keys(metricMetadata).sort();
    setMetricNames(metrics);
  }, [prometheusResourceClient]);

  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  useEffect(() => {
    updateLabels();
  }, [selectedMetricName, updateLabels]);

  useEffect(() => {
    if (selectedMetricName) {
      data.query.queryString.setQuery({
        query: selectedMetricName,
      });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedMetricName]);

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
