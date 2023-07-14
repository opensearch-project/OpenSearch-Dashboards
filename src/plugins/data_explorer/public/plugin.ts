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
  ScopedHistory,
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
import {
  createOsdUrlStateStorage,
  withNotifyOnErrors,
} from '../../opensearch_dashboards_utils/public';
import { getPreloadedStore } from './utils/state_management';

export class DataExplorerPlugin
  implements
    Plugin<
      DataExplorerPluginSetup,
      DataExplorerPluginStart,
      DataExplorerPluginSetupDependencies,
      DataExplorerPluginStartDependencies
    > {
  private viewService = new ViewService();
  private currentHistory?: ScopedHistory;

  public setup(
    core: CoreSetup<DataExplorerPluginStartDependencies, DataExplorerPluginStart>
  ): DataExplorerPluginSetup {
    const viewService = this.viewService;

    // Register an application into the side navigation menu
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      navLinkStatus: AppNavLinkStatus.hidden,
      mount: async (params: AppMountParameters) => {
        // Load application bundle
        const { renderApp } = await import('./application');

        const [coreStart, pluginsStart] = await core.getStartServices();
        this.currentHistory = params.history;

        // make sure the index pattern list is up to date
        pluginsStart.data.indexPatterns.clearCache();

        const services: DataExplorerServices = {
          ...coreStart,
          scopedHistory: this.currentHistory,
          data: pluginsStart.data,
          embeddable: pluginsStart.embeddable,
          expressions: pluginsStart.expressions,
          osdUrlStateStorage: createOsdUrlStateStorage({
            history: this.currentHistory,
            useHash: coreStart.uiSettings.get('state:storeInSessionStorage'),
            ...withNotifyOnErrors(coreStart.notifications.toasts),
          }),
          viewRegistry: viewService.start(),
        };

        // Get start services as specified in opensearch_dashboards.json
        // Render the application
        const { store, unsubscribe: unsubscribeStore } = await getPreloadedStore(services);

        const unmount = renderApp(coreStart, services, params, store);

        return () => {
          unsubscribeStore();
          unmount();
        };
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
