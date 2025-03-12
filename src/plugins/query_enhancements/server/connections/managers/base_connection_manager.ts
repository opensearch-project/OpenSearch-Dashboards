/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';
import { SqlConnectionClient } from '../clients/sql_connection_client';

import type { BaseConnectionClient, ResourcesQuery } from '../clients/base_connection_client';

type ClientFactory<C> = (
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest
) => BaseConnectionClient<C>;

export abstract class BaseConnectionManager<C> {
  protected clientFactory: ClientFactory<C>;

  constructor() {
    this.clientFactory = (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest
    ): BaseConnectionClient<C> =>
      (new SqlConnectionClient(context, request) as unknown) as BaseConnectionClient<C>;
  }

  setClientFactory(factory: ClientFactory<C>) {
    this.clientFactory = factory;
  }

  getClient(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): BaseConnectionClient<C> {
    return this.clientFactory(context, request);
  }

  abstract getResources(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    query: ResourcesQuery
  ): Promise<unknown>;
}
