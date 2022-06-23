import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { DataSourceManagementPluginSetup, DataSourceManagementPluginStart } from './types';
import { defineRoutes } from './routes';
import { sampleDataSource } from './saved_objects';

export class DataSourceManagementPlugin
  implements Plugin<DataSourceManagementPluginSetup, DataSourceManagementPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    core.savedObjects.registerType(sampleDataSource);

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
