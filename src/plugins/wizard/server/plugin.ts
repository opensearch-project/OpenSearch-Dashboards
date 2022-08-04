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
import { capabilitiesProvider } from './capabilities_provider';
import { wizardSavedObjectType } from './saved_objects';

export class WizardPlugin implements Plugin<WizardPluginSetup, WizardPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup({ capabilities, http, savedObjects }: CoreSetup) {
    this.logger.debug('wizard: Setup');

    // Register saved object types
    savedObjects.registerType(wizardSavedObjectType);

    // Register capabilities
    capabilities.registerProvider(capabilitiesProvider);

    return {};
  }

  public start(_core: CoreStart) {
    this.logger.debug('wizard: Started');
    return {};
  }

  public stop() {}
}
