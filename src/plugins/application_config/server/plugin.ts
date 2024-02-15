/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  IScopedClusterClient,
  SharedGlobalConfig,
} from '../../../core/server';

import {
  ApplicationConfigPluginSetup,
  ApplicationConfigPluginStart,
  ConfigurationClient,
} from './types';
import { defineRoutes } from './routes';
import { OpenSearchConfigurationClient } from './opensearch_config_client';

export class ApplicationConfigPlugin
  implements Plugin<ApplicationConfigPluginSetup, ApplicationConfigPluginStart> {
  private readonly logger: Logger;
  private readonly config$: Observable<SharedGlobalConfig>;

  private configurationClient: ConfigurationClient;
  private configurationIndexName: string;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.legacy.globalConfig$;
    this.configurationIndexName = '';
  }

  private setConfigurationClient(inputConfigurationClient: ConfigurationClient) {
    this.configurationClient = inputConfigurationClient;
  }

  private getConfigurationClient(inputOpenSearchClient: IScopedClusterClient) {
    if (this.configurationClient) {
      return this.configurationClient;
    }

    const openSearchConfigurationClient = new OpenSearchConfigurationClient(
      inputOpenSearchClient,
      this.configurationIndexName,
      this.logger
    );

    return openSearchConfigurationClient;
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('applicationConfig: Setup');
    const router = core.http.createRouter();

    const config = await this.config$.pipe(first()).toPromise();

    this.configurationIndexName = config.opensearchDashboards.config_index;

    // Register server side APIs
    defineRoutes(router, this.getConfigurationClient.bind(this), this.logger);

    return {
      setConfigurationClient: this.setConfigurationClient.bind(this),
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('applicationConfig: Started');
    return {};
  }

  public stop() { }
}
