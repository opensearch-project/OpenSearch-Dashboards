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

import { InternalPluginSetup, InternalPluginStart } from './types';
import { registerHeapRoute } from './routes';

export class InternalPlugin implements Plugin<InternalPluginSetup, InternalPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('internal: Setup');
    const router = core.http.createRouter();

    registerHeapRoute(router);

    return {};
  }

  public start(_core: CoreStart) {
    this.logger.debug('internal: Started');
    return {};
  }

  public stop() {}
}
