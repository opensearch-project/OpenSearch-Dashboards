/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

import LRUCache from 'lru-cache';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  SharedGlobalConfig,
  OpenSearchDashboardsRequest,
  IClusterClient,
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
  private clusterClient: IClusterClient;

  private cache: LRUCache<string, string | undefined>;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.legacy.globalConfig$;
    this.configurationIndexName = '';
    this.clusterClient = null;

    this.cache = new LRUCache({
      max: 100, // at most 100 entries
      maxAge: 10 * 60 * 1000, // 10 mins
    });
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

  private getConfigurationClient(request?: OpenSearchDashboardsRequest): ConfigurationClient {
    if (this.configurationClient) {
      return this.configurationClient;
    }

    const openSearchConfigurationClient = new OpenSearchConfigurationClient(
      this.clusterClient.asScoped(request),
      this.configurationIndexName,
      this.logger,
      this.cache
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
    this.clusterClient = core.opensearch.client;

    return {};
  }

  public stop() {}
}
