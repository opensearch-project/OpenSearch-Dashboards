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

export class PromQLConnectionClient extends BaseConnectionClient<OpenSearchClient> {
  protected client: OpenSearchClient;

  constructor(context: RequestHandlerContext, _request: OpenSearchDashboardsRequest) {
    super();
    this.client = context.core.opensearch.client.asCurrentUser;
  }

  async getResources<R>(request: ClientRequest): Promise<GetResourcesResponse<R>> {
    try {
      const response = await this.client.transport.request({
        ...request,
        method: 'GET',
      });
      return {
        status: 'success',
        data: response.body.data,
        type: 'promql',
      };
    } catch (err) {
      return {
        status: 'failed',
        data: ([] as unknown) as R,
        type: 'promq',
      };
    }
  }
}
