/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin,
  PluginInitializerContext,
} from '../../../core/server';

import { createCspRulesPreResponseHandler } from './csp_handlers';
import { ConfigurationProviderPluginSetup, ConfigurationProviderPluginStart } from './types';

export class ConfigurationProviderPlugin
  implements Plugin<ConfigurationProviderPluginSetup, ConfigurationProviderPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    // TODO: replace this with real
    const getConfigurationClient = {};

    core.http.registerOnPreResponse(
      createCspRulesPreResponseHandler(
        core,
        core.http.csp.header,
        getConfigurationClient,
        this.logger
      )
    );

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('ConfigurationProvider: Started');
    return {};
  }

  public stop() {}
}
