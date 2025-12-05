/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransportRequestParams } from '@opensearch-project/opensearch/lib/Transport';

export interface ResourcesQuery {
  dataSourceName: string;
  resourceType: string;
  resourceName?: string;
  query: Record<string, string>;
}

export type ClientRequest = Omit<TransportRequestParams, 'method'>;

export interface GetResourcesResponse<R> {
  nextToken?: string;
  status: 'success' | 'failed';
  data: R;
  type: string;
}

export abstract class BaseConnectionClient<C> {
  protected abstract client: C;
  constructor() {}

  abstract getResources<R>(request: ClientRequest): Promise<GetResourcesResponse<R>>;
}
