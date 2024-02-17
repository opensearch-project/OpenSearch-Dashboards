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
} from '../../../src/core/server';

import { ExamplePlugin1PluginSetup, ExamplePlugin1PluginStart } from './types';
import { defineRoutes } from './routes';

type CompatibilityStatus = 'Enabled' | 'Disabled' | 'Degraded';

export class ExamplePlugin1Plugin
  implements Plugin<ExamplePlugin1PluginSetup, ExamplePlugin1PluginStart> {
  private readonly logger: Logger;
  core?: CoreStart;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('example-plugin-1: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router, this);
    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('example-plugin-1: Started');
    this.core = core;
    return {};
  }

  async exampleCompatibilityCheck() {
    const pluginName = 'XCompat-plugin-example1';
    let compatabilityResultMessage = '';
    let compatibilityStatus: CompatibilityStatus = 'Enabled'; // Default to Enabled
    const result = await this.core?.crossCompatibility.verifyOpenSearchPluginsState(pluginName);
    await result?.forEach((mustHavePlugin) => {
      if (!mustHavePlugin.isCompatible) {
        compatibilityStatus = 'Disabled';
        compatabilityResultMessage += ' | ' + (mustHavePlugin.incompatibilityReason || '');
      }
    });
    if (compatibilityStatus === 'Enabled') {
      compatabilityResultMessage += ` | All required engine plugins are compatible`;
    }
    return { message: compatabilityResultMessage, status: compatibilityStatus };
  }

  public stop() {}
}
