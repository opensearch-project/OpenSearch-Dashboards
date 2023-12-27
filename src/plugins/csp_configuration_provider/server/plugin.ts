import {
  CoreSetup,
  CoreStart,
  Logger,
  OpenSearchClient,
  Plugin,
  PluginInitializerContext,
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
  private cspClient: CspClient | undefined;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  private setCspClient(inputCspClient: CspClient) {
    this.cspClient = inputCspClient;
  }

  private getCspClient(inputOpenSearchClient: OpenSearchClient) {
    if (this.cspClient) {
      return this.cspClient;
    }

    return new OpenSearchCspClient(inputOpenSearchClient);
  }

  public setup(core: CoreSetup) {
    this.logger.debug('CspConfigurationProvider: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    core.http.registerOnPreResponse(
      createCspRulesPreResponseHandler(core, this.getCspClient.bind(this))
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
