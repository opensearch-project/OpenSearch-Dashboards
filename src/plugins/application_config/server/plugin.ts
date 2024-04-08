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

  private registerConfigurationClient(configurationClient: ConfigurationClient) {
    this.logger.info('Register a configuration client.');

    if (this.configurationClient) {
      const errorMessage = 'Configuration client is already registered! Cannot register again!';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.configurationClient = configurationClient;
  }

  private getConfigurationClient(scopedClusterClient: IScopedClusterClient): ConfigurationClient {
    if (this.configurationClient) {
      return this.configurationClient;
    }

    const openSearchConfigurationClient = new OpenSearchConfigurationClient(
      scopedClusterClient,
      this.configurationIndexName,
      this.logger
    );

    return openSearchConfigurationClient;
  }

  public async setup(core: CoreSetup) {
    const router = core.http.createRouter();

    const config = await this.config$.pipe(first()).toPromise();

    this.configurationIndexName = config.opensearchDashboards.configIndex;

    // Register server side APIs
    defineRoutes(router, this.getConfigurationClient.bind(this), this.logger);

    return {
      getConfigurationClient: this.getConfigurationClient.bind(this),
      registerConfigurationClient: this.registerConfigurationClient.bind(this),
    };
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
