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
import { exploreSavedObjectType } from './saved_objects';
import { exploreUiSettings } from './explore_ui_settings';

import { ExplorePluginSetup, ExplorePluginStart } from './types';

export class ExplorePlugin implements Plugin<ExplorePluginSetup, ExplorePluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('explore: Setup');

    core.capabilities.registerProvider(capabilitiesProvider);

    // Register default explore capabilities
    core.capabilities.registerProvider(() => ({
      explore: {
        discoverTracesEnabled: false,
        discoverMetricsEnabled: false,
        logsQueryBuilderEnabled: false,
      },
    }));

    // Register dynamic capabilities switcher for feature flags
    // This will override the defaults with values from DynamicConfigService
    core.capabilities.registerSwitcher(async (request, capabilities) => {
      try {
        const dynamicConfigServiceStart = await core.dynamicConfigService.getStartService();
        const client = dynamicConfigServiceStart.getClient();
        const store = dynamicConfigServiceStart.getAsyncLocalStore();

        const config = await client.getConfig(
          { name: 'explore' },
          { asyncLocalStorageContext: store! }
        );

        return {
          ...capabilities,
          explore: {
            ...(capabilities.explore || {}),
            discoverTracesEnabled: config.discoverTraces?.enabled ?? false,
            discoverMetricsEnabled: config.discoverMetrics?.enabled ?? false,
            logsQueryBuilderEnabled: config.logsQueryBuilder?.enabled ?? false,
          },
        };
      } catch (error) {
        this.logger.debug('Failed to load explore dynamic config, using defaults');
        // Keep defaults from provider (false for all flags)
        return capabilities;
      }
    });

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
    core.uiSettings.register(exploreUiSettings);

    core.savedObjects.registerType(exploreSavedObjectType);

    return {};
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
