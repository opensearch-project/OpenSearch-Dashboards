/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PluginIntegrationPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PluginIntegrationPluginStart {}

export class PluginIntegrationPlugin
  implements Plugin<PluginIntegrationPluginSetup, PluginIntegrationPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('pluginIntegration: Setup');
    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('pluginIntegration: Started');
    return {};
  }

  public stop() {}
}
