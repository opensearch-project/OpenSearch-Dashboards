/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { first } from 'rxjs/operators';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { capabilitiesProvider } from './capabilities_provider';
import { exploreSavedObjectType } from './saved_objects';
import { ConfigSchema } from '../common/config';
import { registerExploreAssistRoutes } from './query_panel';

import { ExplorePluginSetup, ExplorePluginSetupDependencies, ExplorePluginStart } from './types';

export class ExplorePlugin implements Plugin<ExplorePluginSetup, ExplorePluginStart> {
  private readonly logger: Logger;

  // @ts-ignore
  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup, { data, dataSource }: ExplorePluginSetupDependencies) {
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
    core.savedObjects.registerType(exploreSavedObjectType);

    // Register a route handler context for assist config and data source support
    // This matches the pattern in query_enhancements
    // @ts-ignore https://github.com/opensearch-project/openSearch-Dashboards/issues/4274
    core.http.registerRouteHandlerContext('query_panel', () => ({
      logger: this.logger,
      configPromise: this.initializerContext.config
        .create<ConfigSchema>()
        .pipe(first())
        .toPromise(),
      dataSourceEnabled: true,
    }));

    // Register the assist API route
    registerExploreAssistRoutes(core.http.createRouter());

    return {};
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
