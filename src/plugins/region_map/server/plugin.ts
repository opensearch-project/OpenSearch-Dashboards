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
} from 'opensearch-dashboards/server';
import { registerGeospatialRoutes } from '../server/routes';
import { getUiSettings } from './ui_settings';
import { RegionMapPluginSetup, RegionMapPluginStart } from './types';

export class RegionMapPlugin implements Plugin<RegionMapPluginSetup, RegionMapPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('RegionMap: Setup');
    const router = core.http.createRouter();
    core.uiSettings.register(getUiSettings());
    registerGeospatialRoutes(router);
    return {};
  }

  public start(_core: CoreStart) {
    this.logger.debug('RegionMap: Started');
    return {};
  }

  public stop() {}
}
