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

import { ContextProviderServerPluginSetup, ContextProviderServerPluginStart } from './types';

/**
 * @experimental
 * Context Provider plugin for React hooks-based context capture system. This plugin is experimental and will change in future releases.
 */
export class ContextProviderServerPlugin
  implements Plugin<ContextProviderServerPluginSetup, ContextProviderServerPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('contextProvider: Setup');
    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('contextProvider: Started');
    return {};
  }

  public stop() {}
}
