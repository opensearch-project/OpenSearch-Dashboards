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

import { WizardPluginSetup, WizardPluginStart } from './types';
import { defineRoutes } from './routes';
import { wizardApp } from './saved_objects';

export class WizardPlugin implements Plugin<WizardPluginSetup, WizardPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup({ http, savedObjects }: CoreSetup) {
    this.logger.debug('wizard: Setup');
    const router = http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    // Register saved object types
    savedObjects.registerType(wizardApp);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('wizard: Started');
    return {};
  }

  public stop() {}
}
