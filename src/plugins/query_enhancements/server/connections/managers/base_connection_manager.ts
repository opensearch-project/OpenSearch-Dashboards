/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';
import { SqlConnectionClient } from '../clients/sql_connection_client';

import type { BaseConnectionClient, ResourcesQuery } from '../clients/base_connection_client';

type ClientFactory = (
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest
) => BaseConnectionClient;

export abstract class BaseConnectionManager {
  protected clientFactory: ClientFactory;

  constructor() {
    this.clientFactory = (context: RequestHandlerContext, request: OpenSearchDashboardsRequest) =>
      new SqlConnectionClient(context, request);
  }

  setClientFactory(factory: ClientFactory) {
    this.clientFactory = factory;
  }

  getClient(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): BaseConnectionClient {
    return this.clientFactory(context, request);
  }

  abstract getResources(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    query: ResourcesQuery
  ): Promise<unknown>;
}
