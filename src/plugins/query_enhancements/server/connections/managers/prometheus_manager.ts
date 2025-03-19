/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OpenSearchClient,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { BaseConnectionManager } from './base_connection_manager';
import { GetResourcesResponse } from '../clients/base_connection_client';
import { URI } from '../../../common/constants';
import { PromQLConnectionClient } from '../clients/promql_connection_client';

const BASE_RESOURCE_API = 'api/v1';

const PROMETHEUS_RESOURCE_TYPES = {
  LABELS: 'labels',
  LABEL_VALUES: 'label_values',
  METRIC_METADATA: 'metric_metadata',
  ALERTS: 'alerts',
} as const;

// docs: https://prometheus.io/docs/concepts/metric_types/#metric-types
type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export type Label = string;
export type Metric = string;
export interface MetricMetadata {
  [metric: string]: Array<{
    type: MetricType;
    help: string;
    unit: string;
  }>;
}
type PrometheusResource = Label[] | Metric[] | MetricMetadata;

// We want to ensure valid resourceType and resourceName parameters in the type system
interface CommonQuery {
  dataSourceName: string;
  query: Record<string, string>;
}
interface LabelsQuery {
  resourceType: typeof PROMETHEUS_RESOURCE_TYPES.LABELS;
  resourceName?: string;
}
interface LabelValuesQuery {
  resourceType: typeof PROMETHEUS_RESOURCE_TYPES.LABEL_VALUES;
  resourceName: string;
}
interface MetricMetadataQuery {
  resourceType: typeof PROMETHEUS_RESOURCE_TYPES.METRIC_METADATA;
  resourceName?: string;
}
interface AlertsQuery {
  resourceType: typeof PROMETHEUS_RESOURCE_TYPES.ALERTS;
  resourceName: undefined;
}
export type PrometheusResourceQuery = CommonQuery &
  (LabelsQuery | LabelValuesQuery | MetricMetadataQuery | AlertsQuery);

class PrometheusManager extends BaseConnectionManager<OpenSearchClient> {
  constructor() {
    super();
    const clientFactory = (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest
    ): PromQLConnectionClient => new PromQLConnectionClient(context, request);
    this.setClientFactory(clientFactory);
  }
  private getResourceURI(query: PrometheusResourceQuery): string {
    const { resourceType, resourceName } = query;
    switch (resourceType) {
      case PROMETHEUS_RESOURCE_TYPES.LABELS:
        const labelsQueryString = resourceName ? `?match[]=${resourceName}` : '';
        return `${BASE_RESOURCE_API}/labels${labelsQueryString}`;
      case PROMETHEUS_RESOURCE_TYPES.ALERTS:
        return `${BASE_RESOURCE_API}/alerts`;
      case PROMETHEUS_RESOURCE_TYPES.LABEL_VALUES:
        return `${BASE_RESOURCE_API}/label/${resourceName}/values`;
      case PROMETHEUS_RESOURCE_TYPES.METRIC_METADATA:
        const metricMetadataQueryString = resourceName ? `?metric=${resourceName}` : '';
        return `${BASE_RESOURCE_API}/metadata${metricMetadataQueryString}`;

      default:
        throw Error(`unknown resource type: ${resourceType}`);
    }
  }

  getResources<R extends PrometheusResource>(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    query: PrometheusResourceQuery
  ): Promise<GetResourcesResponse<R>> {
    return this.getClient(context, request).getResources<R>({
      query,
      path: `${URI.DIRECT_QUERY.RESOURCES}/${query.dataSourceName}/${this.getResourceURI(query)}`,
      params: {
        querystring: new URLSearchParams(query.query).toString(),
      },
    });
  }
}

// we must export as singleton so all changes to clientFactory are respected across plugins
export const prometheusManager = new PrometheusManager();
