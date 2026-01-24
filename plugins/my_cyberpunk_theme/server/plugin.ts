import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { MyCyberpunkThemePluginSetup, MyCyberpunkThemePluginStart } from './types';
import { defineRoutes } from './routes';

export class MyCyberpunkThemePlugin
  implements Plugin<MyCyberpunkThemePluginSetup, MyCyberpunkThemePluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('my-cyberpunk-theme: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('my-cyberpunk-theme: Started');
    return {};
  }

  public stop() {}
}
