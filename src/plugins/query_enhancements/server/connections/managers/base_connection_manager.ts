/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpResponsePayload,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { BaseConnectionClient, QueryResponse } from '../clients/base_connection_client';

type ClientFactory<T> = (
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest
) => BaseConnectionClient<T>;

/**
 * Generic query executor interface.
 * This allows overriding the query execution at runtime with custom implementations.
 * @template TParams The type of query parameters
 * @template TResponse The type of query response
 */
export interface QueryExecutor<TParams = unknown, TResponse = unknown> {
  /**
   * Execute a query with the given params.
   * @param context The request handler context
   * @param request The OpenSearch Dashboards request
   * @param params The query parameters
   */
  execute(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    params: TParams
  ): Promise<TResponse>;
}

/**
 * @experimental this class is experimental and might change in future releases.
 * @template TClient The type of the underlying client
 * @template TQueryParams The type of query parameters (defaults to unknown)
 * @template TQueryResponse The type of query response (defaults to unknown)
 */
export abstract class BaseConnectionManager<
  TClient = unknown,
  TQueryParams = unknown,
  TQueryResponse = unknown
> {
  private clientFactory?: ClientFactory<TClient>;
  private queryExecutor?: QueryExecutor<TQueryParams, TQueryResponse>;

  constructor() {}

  /**
   * Set the client factory for creating connection clients.
   * This allows overriding the default client behavior at runtime.
   */
  setClientFactory(factory: ClientFactory<TClient>): void {
    this.clientFactory = factory;
  }

  /**
   * Set the query executor for query execution.
   * This allows overriding the default query behavior at runtime.
   */
  setQueryExecutor(executor: QueryExecutor<TQueryParams, TQueryResponse>): void {
    this.queryExecutor = executor;
  }

  protected getQueryExecutor(): QueryExecutor<TQueryParams, TQueryResponse> | undefined {
    return this.queryExecutor;
  }

  protected getClient(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): BaseConnectionClient<TClient> {
    if (!this.clientFactory) {
      throw new Error('Client factory not set');
    }
    return this.clientFactory(context, request);
  }

  /**
   * Execute a query against the data source
   */
  async query<R = TQueryResponse>(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    params: TQueryParams
  ): Promise<QueryResponse<R>> {
    if (!this.queryExecutor) {
      throw new Error('No query executor available');
    }
    try {
      const response = await this.queryExecutor.execute(context, request, params);
      return {
        status: 'success',
        data: (response as unknown) as R,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        status: 'failed',
        data: (undefined as unknown) as R,
        error: error.message || 'Query failed',
      };
    }
  }

  abstract handlePostRequest(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): Promise<HttpResponsePayload>;
}
