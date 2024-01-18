/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  CoreSetup,
  CoreStart,
  IScopedClusterClient,
  Logger,
  Plugin,
  PluginInitializerContext,
  SharedGlobalConfig,
} from '../../../core/server';

import { createCspRulesPreResponseHandler } from './csp_handlers';
import { OpenSearchConfigurationClient } from './provider';
import { defineRoutes } from './routes';
import {
  ConfigurationClient,
  ConfigurationProviderPluginSetup,
  ConfigurationProviderPluginStart,
} from './types';

export class ConfigurationProviderPlugin
  implements Plugin<ConfigurationProviderPluginSetup, ConfigurationProviderPluginStart> {
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

    this.setConfigurationClient(openSearchConfigurationClient);
    return this.configurationClient;
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('ConfigurationProvider: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router, this.getConfigurationClient.bind(this), this.logger);

    const config = await this.config$.pipe(first()).toPromise();

    this.configurationIndexName = config.opensearchDashboards.dynamic_config_index;

    core.http.registerOnPreResponse(
      createCspRulesPreResponseHandler(core, this.getConfigurationClient.bind(this), this.logger)
    );

    return {
      setConfigurationClient: this.setConfigurationClient.bind(this),
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('ConfigurationProvider: Started');
    return {};
  }

  public stop() {}
}
