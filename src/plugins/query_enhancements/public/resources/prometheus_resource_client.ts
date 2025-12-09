/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import {
  BaseResourceClient,
  IPrometheusResourceClient,
  PrometheusMetricMetadata,
} from '../../../data/public';

const RESOURCE_TYPES = {
  LABELS: 'labels',
  LABEL_VALUES: 'label_values',
  METRICS: 'metrics',
  METRIC_METADATA: 'metric_metadata',
} as const;

export class PrometheusResourceClient
  extends BaseResourceClient
  implements IPrometheusResourceClient {
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
