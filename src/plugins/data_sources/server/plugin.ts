import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { defineRoutes } from './routes';
import { dataSource } from './saved_objects';
import { DataSourcePluginSetup, DataSourcePluginStart } from './types';

export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    core.savedObjects.registerType(dataSource);

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
