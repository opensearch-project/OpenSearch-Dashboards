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

import { DataExplorerPluginSetup, DataExplorerPluginStart } from './types';
import { defineRoutes } from './routes';

export class DataExplorerPlugin
  implements Plugin<DataExplorerPluginSetup, DataExplorerPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('dataExplorer: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('dataExplorer: Started');
    return {};
  }

  public stop() {}
}
