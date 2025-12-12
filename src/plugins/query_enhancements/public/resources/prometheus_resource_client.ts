/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import { BaseResourceClient } from '../../../data/public';

/**
 * Interface for Prometheus metric metadata
 */
interface PrometheusMetricMetadata {
  [metric: string]: Array<{
    type: string;
    unit: string;
    help: string;
  }>;
}

const RESOURCE_TYPES = {
  LABELS: 'labels',
  LABEL_VALUES: 'label_values',
  METRICS: 'metrics',
  METRIC_METADATA: 'metric_metadata',
} as const;

export class PrometheusResourceClient extends BaseResourceClient {
  constructor(http: HttpSetup) {
    super(http, 'prometheus');
  }

  getLabels(dataConnectionId: string, metric?: string) {
    return this.get<string[]>(dataConnectionId, RESOURCE_TYPES.LABELS, metric);
  }

  getLabelValues(dataConnectionId: string, label: string) {
    return this.get<string[]>(dataConnectionId, RESOURCE_TYPES.LABEL_VALUES, label);
  }

  getMetrics(dataConnectionId: string) {
    return this.get<string[]>(dataConnectionId, RESOURCE_TYPES.METRICS);
  }

  getMetricMetadata(dataConnectionId: string, metric?: string) {
    return this.get<PrometheusMetricMetadata>(
      dataConnectionId,
      RESOURCE_TYPES.METRIC_METADATA,
      metric
    );
  }
}
