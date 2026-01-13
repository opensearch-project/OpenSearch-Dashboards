/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import { BaseResourceClient } from '../../../data/public';
import { RESOURCE_TYPES } from '../../common/constants';

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

export class PrometheusResourceClient extends BaseResourceClient {
  constructor(http: HttpSetup) {
    super(http, 'prometheus');
  }

  getLabels(dataConnectionId: string, metric?: string) {
    return this.get<string[]>(dataConnectionId, RESOURCE_TYPES.PROMETHEUS.LABELS, metric);
  }

  getLabelValues(dataConnectionId: string, label: string) {
    return this.get<string[]>(dataConnectionId, RESOURCE_TYPES.PROMETHEUS.LABEL_VALUES, label);
  }

  getMetrics(dataConnectionId: string) {
    return this.get<string[]>(dataConnectionId, RESOURCE_TYPES.PROMETHEUS.METRICS);
  }

  getMetricMetadata(dataConnectionId: string, metric?: string) {
    return this.get<PrometheusMetricMetadata>(
      dataConnectionId,
      RESOURCE_TYPES.PROMETHEUS.METRIC_METADATA,
      metric
    );
  }
}
