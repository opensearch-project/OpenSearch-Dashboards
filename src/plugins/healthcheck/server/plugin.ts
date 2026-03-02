/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { HealtcheckPluginSetup, HealtcheckPluginStart } from './types';
import { defineRoutes } from './routes';

export class HealtcheckPlugin implements Plugin<HealtcheckPluginSetup, HealtcheckPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('healtcheck: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('healtcheck: Started');
    return {};
  }

  public stop() {}
}
