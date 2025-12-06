/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpResponsePayload,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { BaseConnectionClient } from '../clients/base_connection_client';

type ClientFactory<T> = (
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest
) => BaseConnectionClient<T>;

/**
 * @experimental this class is experimental and might change in future releases.
 */
export abstract class BaseConnectionManager<T = any> {
  private clientFactory?: ClientFactory<T>;

  constructor() {}

  protected setClientFactory(factory: ClientFactory<T>): void {
    this.clientFactory = factory;
  }

  protected getClient(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): BaseConnectionClient<T> {
    if (!this.clientFactory) {
      throw new Error('Client factory not set');
    }
    return this.clientFactory(context, request);
  }

  abstract handlePostRequest(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): Promise<HttpResponsePayload>;
}
