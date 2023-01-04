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
import { augmentVisSavedObjectType } from './saved_objects';
import { capabilitiesProvider } from './capabilities_provider';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterPluginStart {}

export class VisAugmenterPlugin
  implements Plugin<VisAugmenterPluginSetup, VisAugmenterPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('VisAugmenter: Setup');
    core.savedObjects.registerType(augmentVisSavedObjectType);
    core.capabilities.registerProvider(capabilitiesProvider);
    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('VisAugmenter: Started');
    return {};
  }

  public stop() {}
}
