/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ILegacyClusterClient,
  OpenSearchClient,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { BaseConnectionManager, QueryExecutor } from './base_connection_manager';
import { GetResourcesResponse, QueryResponse } from '../clients/base_connection_client';
import { URI } from '../../../common/constants';
import { PrometheusConnectionClient } from '../clients/prometheus_connection_client';
import { ResourcesRequest } from '../../routes/resources/routes';

const BASE_RESOURCE_API = 'api/v1';
const BASE_ALERT_MANAGER_API = 'alertmanager/api/v2';

const PROMETHEUS_RESOURCE_TYPES = {
  LABELS: 'labels',
  LABEL_VALUES: 'label_values',
  METRICS: 'metrics',
  METRIC_METADATA: 'metric_metadata',
  ALERTS: 'alerts',
  ALERTS_GROUPS: 'alert_manager_alert_groups',
  RULES: 'rules',
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

/**
 * Parameters for PromQL query execution
 */
export interface PromQLQueryParams {
  body: {
    query: string;
    language: string;
    maxResults: number;
    timeout: number;
    options: {
      queryType: 'range' | 'instant';
      start: string;
      end: string;
      step: string;
    };
  };
  dataconnection: string;
}

/**
 * Result of a single metric series
 */
export interface MetricResult {
  metric: Record<string, string>;
  values: Array<[number, number]>;
}

/**
 * Response from a PromQL query
 */
export interface PromQLQueryResponse {
  queryId: string;
  sessionId: string;
  results: {
    [connectionId: string]: {
      resultType: string;
      result: MetricResult[];
    };
  };
}

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
interface MetricsQuery {
  resourceType: typeof PROMETHEUS_RESOURCE_TYPES.METRICS;
  resourceName: undefined;
}
interface MetricMetadataQuery {
  resourceType: typeof PROMETHEUS_RESOURCE_TYPES.METRIC_METADATA;
  resourceName?: string;
}
interface AlertsQuery {
  resourceType: typeof PROMETHEUS_RESOURCE_TYPES.ALERTS;
  resourceName: undefined;
}
interface AlertsGroupsQuery {
  resourceType: typeof PROMETHEUS_RESOURCE_TYPES.ALERTS_GROUPS;
  resourceName: undefined;
}
interface RulesQuery {
  resourceType: typeof PROMETHEUS_RESOURCE_TYPES.RULES;
  resourceName: undefined;
}
type PrometheusResourceQuery = CommonQuery &
  (
    | LabelsQuery
    | LabelValuesQuery
    | MetricsQuery
    | MetricMetadataQuery
    | AlertsQuery
    | AlertsGroupsQuery
    | RulesQuery
  );

class PrometheusManager extends BaseConnectionManager<
  OpenSearchClient,
  PromQLQueryParams,
  PromQLQueryResponse
> {
  constructor() {
    super();
    // Set up the client factory for resource fetching
    const clientFactory = (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest
    ): PrometheusConnectionClient => new PrometheusConnectionClient(context, request);
    this.setClientFactory(clientFactory);
  }

  /**
   * Initialize the default query executor using the legacy OpenSearch client.
   * This should be called during plugin setup.
   * @param client The legacy cluster client for OpenSearch
   */
  initializeDefaultQueryExecutor(client: ILegacyClusterClient): void {
    const defaultQueryExecutor: QueryExecutor<PromQLQueryParams, PromQLQueryResponse> = {
      execute: async (context, request, params) => {
        // Support multi-datasource routing
        const dataSourceId = (request as { dataSourceId?: string }).dataSourceId;
        const callAPI = dataSourceId
          ? context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI
          : client.asScoped(request).callAsCurrentUser;
        return callAPI('enhancements.promqlQuery', params);
      },
    };
    this.setQueryExecutor(defaultQueryExecutor);
  }

  private getResourceURI(query: PrometheusResourceQuery): string {
    const { resourceType, resourceName } = query;
    switch (resourceType) {
      case PROMETHEUS_RESOURCE_TYPES.LABELS: {
        const labelsQueryString = resourceName ? `?match[]=${resourceName}` : '';
        return `${BASE_RESOURCE_API}/labels${labelsQueryString}`;
      }
      case PROMETHEUS_RESOURCE_TYPES.ALERTS: {
        return `${BASE_RESOURCE_API}/alerts`;
      }
      case PROMETHEUS_RESOURCE_TYPES.LABEL_VALUES: {
        return `${BASE_RESOURCE_API}/label/${resourceName}/values`;
      }
      case PROMETHEUS_RESOURCE_TYPES.METRICS: {
        return `${BASE_RESOURCE_API}/label/__name__/values`;
      }
      case PROMETHEUS_RESOURCE_TYPES.METRIC_METADATA: {
        const metricMetadataQueryString = resourceName ? `?metric=${resourceName}` : '';
        return `${BASE_RESOURCE_API}/metadata${metricMetadataQueryString}`;
      }
      case PROMETHEUS_RESOURCE_TYPES.ALERTS_GROUPS: {
        return `${BASE_ALERT_MANAGER_API}/alerts/groups`;
      }
      case PROMETHEUS_RESOURCE_TYPES.RULES: {
        return `${BASE_RESOURCE_API}/rules`;
      }
      default: {
        throw Error(`unknown resource type: ${resourceType}`);
      }
    }
  }

  getResources<R extends PrometheusResource>(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    query: PrometheusResourceQuery
  ): Promise<GetResourcesResponse<R>> {
    return this.getClient(context, request).getResources<R>({
      path: `${URI.DIRECT_QUERY.RESOURCES}/${query.dataSourceName}/${this.getResourceURI(query)}`,
      querystring: new URLSearchParams(query.query).toString(),
    });
  }

  handlePostRequest(context: RequestHandlerContext, request: ResourcesRequest) {
    const { id: dataSourceName } = request.body.connection;
    const { type: resourceType, name: resourceName } = request.body.resource;
    const query = {
      dataSourceName,
      resourceType,
      resourceName,
      query: {},
    } as PrometheusResourceQuery;
    return this.getResources(context, request, query);
  }
}

// we must export as singleton so all changes to clientFactory are respected across plugins
export const prometheusManager = new PrometheusManager();
