/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransportRequestParams } from '@opensearch-project/opensearch/lib/Transport';
import { OpenSearchClient } from 'src/core/server';

export interface ResourcesQuery {
  dataSourceName: string; // SQL/DQS data source name (my_prometheus)
  resourceType: string; // prometheus
  // dataConnectionId: string; // or the API can take the data-connection saved object ID instead
  query: Record<string, string>; // query params for raw prometheus API
}

export interface ClientRequest {
  query: ResourcesQuery;
  path: string;
  params: Partial<TransportRequestParams>;
}

type ResourceData = unknown;

export interface GetResourcesResponse {
  nextToken?: string;
  status: string;
  data: ResourceData[];
  type: string;
}

export abstract class BaseConnectionClient {
  protected abstract client: OpenSearchClient;
  constructor() {}

  abstract getResources(request: ClientRequest): Promise<GetResourcesResponse>;
}
