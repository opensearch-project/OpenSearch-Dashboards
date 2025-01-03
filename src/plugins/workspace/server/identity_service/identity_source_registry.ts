/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../core/server';
import { IdentityEntry } from '../types';

interface IdentitySourceHandler {
  getUsers?: (
    params: { page?: number; perPage?: number },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[] | []>;
  getRoles?: (
    params: { page?: number; perPage?: number },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[] | []>;
}

export class IdentitySourceRegistry {
  private registry: Record<string, IdentitySourceHandler> = {};
  private logger: Logger;
  private identitySource: string;

  constructor(logger: Logger, identitySource: string) {
    this.logger = logger;
    this.identitySource = identitySource;
  }

  /**
   * Register a new identity source handler
   */
  public registerSourceHandler(source: string, handler: IdentitySourceHandler): void {
    this.registry[source] = handler;
    this.logger.info(`Register ${source} type handler`);
  }

  /**
   * Get the handler for the identity source
   */
  public getSourceHandler(): IdentitySourceHandler {
    const handler = this.registry[this.identitySource];
    if (!handler) {
      throw new Error(`Identity source '${this.identitySource}' is not supported.`);
    }
    return handler;
  }
}
