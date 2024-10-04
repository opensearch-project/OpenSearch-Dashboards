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
import { AppPluginSetupDependencies, CspHandlerPluginSetup, CspHandlerPluginStart } from './types';

export class CspHandlerPlugin implements Plugin<CspHandlerPluginSetup, CspHandlerPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup, { applicationConfig }: AppPluginSetupDependencies) {
    /**
     * TODO Deprecate this plugin (right now it needs to be enabled for Dashboards plugin to function)
     */
    // core.http.registerOnPreResponse(
    //   createCspRulesPreResponseHandler(
    //     core,
    //     core.http.csp.header,
    //     applicationConfig.getConfigurationClient,
    //     this.logger
    //   )
    // );

    return {};
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
