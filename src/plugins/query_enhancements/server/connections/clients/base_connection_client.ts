/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransportRequestParams } from '@opensearch-project/opensearch/lib/Transport';

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

export interface GetResourcesResponse<R> {
  nextToken?: string;
  status: string;
  data: R[];
  type: string;
}

export abstract class BaseConnectionClient<C> {
  protected abstract client: C;
  constructor() {}

  abstract getResources<R>(request: ClientRequest): Promise<GetResourcesResponse<R>>;
}
