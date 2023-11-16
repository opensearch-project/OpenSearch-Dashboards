import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { VisDrilldownPluginSetup, VisDrilldownPluginStart } from './types';
import { defineRoutes } from './routes';

export class VisDrilldownPlugin
  implements Plugin<VisDrilldownPluginSetup, VisDrilldownPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('vis_type_drilldown: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('vis_type_drilldown: Started');
    return {};
  }

  public stop() {}
}
