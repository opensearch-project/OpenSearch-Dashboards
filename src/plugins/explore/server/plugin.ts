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

import { ExplorePluginSetup, ExplorePluginStart } from './types';
import { defineRoutes } from './routes';

export class ExplorePlugin implements Plugin<ExplorePluginSetup, ExplorePluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('explore: Setup');
    const router = core.http.createRouter();

    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('explore: Started');
    return {};
  }

  public stop() {}
}
