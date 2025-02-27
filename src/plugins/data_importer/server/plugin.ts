import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { DataUploaderPluginSetup, DataUploaderPluginStart } from './types';
import { defineRoutes } from './routes';
import { registerRoutes } from './routes/upload';

export class DataUploaderPlugin
  implements Plugin<DataUploaderPluginSetup, DataUploaderPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('dataUploader: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);
    registerRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('dataUploader: Started');
    return {};
  }

  public stop() {}
}
