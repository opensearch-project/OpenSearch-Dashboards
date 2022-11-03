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

import { VisBuilderPluginSetup, VisBuilderPluginStart } from './types';
import { capabilitiesProvider } from './capabilities_provider';
import { visBuilderSavedObjectType } from './saved_objects';

export class VisBuilderPlugin implements Plugin<VisBuilderPluginSetup, VisBuilderPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup({ capabilities, http, savedObjects }: CoreSetup) {
    this.logger.debug('vis-builder: Setup');

    // Register saved object types
    savedObjects.registerType(visBuilderSavedObjectType);

    // Register capabilities
    capabilities.registerProvider(capabilitiesProvider);

    return {};
  }

  public start(_core: CoreStart) {
    this.logger.debug('vis-builder: Started');
    return {};
  }

  public stop() {}
}
