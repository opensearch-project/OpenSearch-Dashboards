/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '..';
import { IdentitySourceHandler } from './types';

export class IdentitySourceService {
  // A identity source to store all registered identity source handlers.
  private identitySource: Record<string, IdentitySourceHandler> = {};
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a new identity source handler
   */
  public registerIdentitySourceHandler(source: string, handler: IdentitySourceHandler): void {
    this.identitySource[source] = handler;
    this.logger.info(`Register ${source} type handler`);
  }

  /**
   * Get the handler for the identity source
   */
  public getIdentitySourceHandler(source: string): IdentitySourceHandler {
    const handler = this.identitySource[source];
    if (!handler) {
      throw new Error(`Identity source '${source}' is not supported.`);
    }
    return handler;
  }
}
