/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  CoreSetup,
  CoreStart,
  Logger,
  OpenSearchClient,
  Plugin,
  PluginInitializerContext,
  SharedGlobalConfig,
} from '../../../core/server';

import { createCspRulesPreResponseHandler } from './csp_handlers';
import { OpenSearchCspClient } from './provider';
import { defineRoutes } from './routes';
import {
  CspClient,
  CspConfigurationProviderPluginSetup,
  CspConfigurationProviderPluginStart,
} from './types';

export class CspConfigurationProviderPlugin
  implements Plugin<CspConfigurationProviderPluginSetup, CspConfigurationProviderPluginStart> {
  private readonly logger: Logger;
  private readonly config$: Observable<SharedGlobalConfig>;
  private cspClient: CspClient | undefined;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.legacy.globalConfig$;
  }

  private setCspClient(inputCspClient: CspClient) {
    this.cspClient = inputCspClient;
  }

  private getCspClient(inputOpenSearchClient: OpenSearchClient) {
    if (this.cspClient) {
      return this.cspClient;
    }

    const openSearchCspClient = new OpenSearchCspClient(inputOpenSearchClient);
    this.setCspClient(openSearchCspClient);
    return this.cspClient;
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('CspConfigurationProvider: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    const config = await this.config$.pipe(first()).toPromise();

    core.http.registerOnPreResponse(
      createCspRulesPreResponseHandler(
        core,
        config.opensearchDashboards.dynamic_config_index,
        this.getCspClient.bind(this)
      )
    );

    return {
      setCspClient: this.setCspClient.bind(this),
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('CspConfigurationProvider: Started');
    return {};
  }

  public stop() {}
}
