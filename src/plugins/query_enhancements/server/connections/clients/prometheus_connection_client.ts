/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OpenSearchClient,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import {
  BaseConnectionClient,
  ClientRequest,
  GetResourcesResponse,
} from './base_connection_client';

export class PrometheusConnectionClient extends BaseConnectionClient<OpenSearchClient> {
  protected client: OpenSearchClient;

  constructor(context: RequestHandlerContext, _request: OpenSearchDashboardsRequest) {
    super();
    // Prometheus connections are always created with "Local Cluster". Always use the non-MDS client.
    this.client = context.core.opensearch.client.asCurrentUser;
  }

  async getResources<R>(request: ClientRequest): Promise<GetResourcesResponse<R>> {
    const response = await this.client.transport.request({ ...request, method: 'GET' });
    return { status: response.body.status, data: response.body.data, type: 'prometheus' };
  }
}
