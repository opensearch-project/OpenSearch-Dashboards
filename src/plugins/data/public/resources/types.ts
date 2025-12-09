/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseResourceClient } from './base_resource_client';

/**
 * Interface for Prometheus metric metadata
 */
export interface PrometheusMetricMetadata {
  [metric: string]: Array<{
    type: string;
    unit: string;
    help: string;
  }>;
}

/**
 * Interface for Prometheus resource client.
 * The implementation is provided by query_enhancements plugin.
 */
export interface IPrometheusResourceClient extends BaseResourceClient {
  getLabels(dataConnectionId: string, metric?: string): Promise<string[]>;
  getLabelValues(dataConnectionId: string, label: string): Promise<string[]>;
  getMetrics(dataConnectionId: string): Promise<string[]>;
  getMetricMetadata(dataConnectionId: string, metric?: string): Promise<PrometheusMetricMetadata>;
}
