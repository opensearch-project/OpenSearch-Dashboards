/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';
import { PrometheusResourceClient } from '../../../../../data/public';

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

// TODO: use id from temp index pattern
const CONNECTION_ID = 'my_prometheus';

export const usePrometheus = (): PrometheusContext => {
  const {
    services: { data },
  } = useOpenSearchDashboards<DiscoverViewServices>();
  const prometheusResourceClient = useMemo(() => {
    return data.resourceClientFactory.get('prometheus') as PrometheusResourceClient;
  }, [data.resourceClientFactory]);

  const [selectedMetricName, setSelectedMetricName] = useState<string | undefined>();
  const [metricNames, setMetricNames] = useState<string[]>([]);
  const [labelNames, setLabelNames] = useState<string[]>([]);

  const updateLabels = useCallback(async () => {
    const labels = await prometheusResourceClient.getLabels(CONNECTION_ID);
    setLabelNames(labels);
  }, [prometheusResourceClient]);

  const updateMetrics = useCallback(async () => {
    const metrics = await prometheusResourceClient.getMetrics(CONNECTION_ID);
    setMetricNames(metrics);

    if (!data.query.queryString.getQuery().query) {
      setSelectedMetricName(metrics[0]);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
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
