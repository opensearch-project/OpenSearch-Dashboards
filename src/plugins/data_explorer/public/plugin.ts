/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  AppNavLinkStatus,
} from '../../../core/public';
import {
  DataExplorerPluginSetup,
  DataExplorerPluginSetupDependencies,
  DataExplorerPluginStart,
  DataExplorerPluginStartDependencies,
  DataExplorerServices,
} from './types';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { ViewService } from './services/view_service';

export class DataExplorerPlugin
  implements
    Plugin<
      DataExplorerPluginSetup,
      DataExplorerPluginStart,
      DataExplorerPluginSetupDependencies,
      DataExplorerPluginStartDependencies
    > {
  private viewService = new ViewService();

  public setup(
    core: CoreSetup<DataExplorerPluginStartDependencies, DataExplorerPluginStart>
  ): DataExplorerPluginSetup {
    const viewService = this.viewService;
    // Register an application into the side navigation menu
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const [coreStart, pluginsStart] = await core.getStartServices();

        // make sure the index pattern list is up to date
        pluginsStart.data.indexPatterns.clearCache();

        const services: DataExplorerServices = {
          ...coreStart,
          viewRegistry: viewService.start(),
        };

        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        // Render the application
        return renderApp(coreStart, services, params);
      },
    });

    return {
      ...this.viewService.setup(),
    };
  }

  public start(core: CoreStart): DataExplorerPluginStart {
    return {};
  }

  public stop() {}
}
