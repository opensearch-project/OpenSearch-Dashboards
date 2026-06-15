/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '..';
import { IdentitySourceHandler } from './types';

export class IdentitySourceService {
  // A identity source to store all registered identity source handlers.
  // Use Object.create(null) to avoid prototype pollution from keys like 'constructor', '__proto__', etc.
  private identitySource: Record<string, IdentitySourceHandler> = Object.create(null);
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a new identity source handler
   */
  public registerIdentitySourceHandler(source: string, handler: IdentitySourceHandler): void {
    if (this.identitySource[source]) {
      throw new Error(`Identity source for field 'source' has already been registered`);
    }
    this.identitySource[source] = handler;
    this.logger.info(`Register ${source} type identity source handler`);
  }

  /**
   * Get the handler for the identity source
   */
  public getIdentitySourceHandler(source: string): IdentitySourceHandler {
    const handler = this.identitySource[source];
    if (!handler) {
      throw new Error(
        `Invalid input for field 'source', no matching identity source handler found`
      );
    }
    return handler;
  }
}
