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

export class SqlConnectionClient extends BaseConnectionClient {
  protected client: OpenSearchClient;

  constructor(context: RequestHandlerContext, _request: OpenSearchDashboardsRequest) {
    super();
    this.client = context.core.opensearch.client.asCurrentUser;
  }

  async getResources(request: ClientRequest): Promise<GetResourcesResponse> {
    const _response = await this.client.transport.request({
      ...request,
      method: 'GET',
      path: `/_plugins${request.path}`,
    });
    // additional logic to extract {@link GetResourcesResponse} from raw response
    return {
      status: 'success',
      data: [],
      type: 'sql',
    };
  }
}
