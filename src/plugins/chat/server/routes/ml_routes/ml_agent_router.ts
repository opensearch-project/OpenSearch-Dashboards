/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Logger,
  RequestHandlerContext,
  OpenSearchDashboardsRequest,
  IOpenSearchDashboardsResponse,
  OpenSearchDashboardsResponseFactory,
} from '../../../../../core/server';

/**
 * Abstract interface for ML agent routing strategies
 * This allows different environments to implement their own ML agent communication
 * while keeping the route handler logic identical
 */
export interface MLAgentRouter {
  /**
   * Forward the request to the appropriate ML agent implementation
   * @param context Request handler context
   * @param request OpenSearch Dashboards request
   * @param response Response factory
   * @param logger Logger instance
   * @param configuredAgentId ML Commons agent ID
   * @param dataSourceId Optional data source ID for multi-cluster setups
   * @param observabilityAgentId Optional observability agent ID for PromQL/observability query assist
   * @returns Promise resolving to the response
   */
  forward(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
    logger: Logger,
    configuredAgentId?: string,
    dataSourceId?: string,
    observabilityAgentId?: string
  ): Promise<IOpenSearchDashboardsResponse<any>>;

  /**
   * Get a descriptive name for this router (for logging)
   */
  getRouterName(): string;
}

/**
 * Factory for managing the ML agent router
 * Simplified to handle a single router since only one is ever registered
 */
export class MLAgentRouterFactory {
  private static router: MLAgentRouter | undefined;

  /**
   * Register a router implementation
   * @param router The router to register
   */
  static registerRouter(router: MLAgentRouter): void {
    this.router = router;
  }

  /**
   * Get the registered router
   * @returns The registered router or undefined if none available
   */
  static getRouter(): MLAgentRouter | undefined {
    return this.router;
  }

  /**
   * Clear the registered router (primarily for testing)
   */
  static clearRouters(): void {
    this.router = undefined;
  }
}
