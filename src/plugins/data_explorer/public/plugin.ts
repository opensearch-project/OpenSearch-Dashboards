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
import { DataExplorerPluginSetup, DataExplorerPluginStart, DataExplorerServices } from './types';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { ViewService } from './services/view_service';

export class DataExplorerPlugin
  implements Plugin<DataExplorerPluginSetup, DataExplorerPluginStart> {
  private viewService = new ViewService();

  public setup(core: CoreSetup): DataExplorerPluginSetup {
    const viewService = this.viewService;
    // Register an application into the side navigation menu
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const [coreStart, depsStart] = await core.getStartServices();

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
