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

import { defineRoutes } from './routes';
import { DataSourceManagementPluginSetup, DataSourceManagementPluginStart } from './types';

export class DataSourceManagementPlugin
  implements Plugin<DataSourceManagementPluginSetup, DataSourceManagementPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('dataSourceManagement: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('dataSourceManagement: Started');
    return {};
  }

  public stop() {}
}
