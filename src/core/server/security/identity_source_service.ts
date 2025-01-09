/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { Logger } from '..';
import { IConfigService } from '../config';
import { OpenSearchDashboardsConfigType } from '../opensearch_dashboards_config';
import { IdentitySourceHandler } from './types';

export class IdentitySourceService {
  private registry: Record<string, IdentitySourceHandler> = {};
  private logger: Logger;
  private configService: IConfigService;

  constructor(logger: Logger, configService: IConfigService) {
    this.logger = logger;
    this.configService = configService;
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
  public async getSourceHandler(): Promise<IdentitySourceHandler> {
    const config = await this.configService
      .atPath<OpenSearchDashboardsConfigType>('opensearchDashboards')
      .pipe(first())
      .toPromise();
    const source = config.identity.source;
    const handler = this.registry[source];
    if (!handler) {
      throw new Error(`Identity source '${source}' is not supported.`);
    }
    return handler;
  }
}
