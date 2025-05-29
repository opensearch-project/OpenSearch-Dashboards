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
import { capabilitiesProvider } from './capabilities_provider';
import { searchSavedObjectType } from './saved_objects';

import { ExplorePluginSetup, ExplorePluginStart } from './types';

export class ExplorePlugin implements Plugin<ExplorePluginSetup, ExplorePluginStart> {
  private readonly logger: Logger;

  // @ts-ignore
  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('explore: Setup');

    core.capabilities.registerProvider(capabilitiesProvider);
    core.capabilities.registerSwitcher(async (request, capabilites) => {
      return await core.security.readonlyService().hideForReadonly(request, capabilites, {
        discover: {
          createShortUrl: false,
          save: false,
          saveQuery: false,
        },
      });
    });
    // core.uiSettings.register(uiSettings);
    core.savedObjects.registerType(searchSavedObjectType);

    return {};
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
