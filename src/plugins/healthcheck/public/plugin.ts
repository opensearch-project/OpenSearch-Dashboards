/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  Plugin,
} from '../../../core/public';
import { HealtcheckPluginSetup, HealtcheckPluginStart, AppPluginStartDependencies } from './types';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { setCore, setHealthCheck } from './dashboards_services';
import { mountButton } from './components/button_header/mount_button';

export class HealtcheckPlugin implements Plugin<HealtcheckPluginSetup, HealtcheckPluginStart> {
  public setup(core: CoreSetup): HealtcheckPluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      category: DEFAULT_APP_CATEGORIES.dashboardManagement,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });

    /* Wazuh BEGIN */
    // Register in the 'all' nav group under Dashboard management category
    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: PLUGIN_ID,
        category: DEFAULT_APP_CATEGORIES.dashboardManagement,
        order: 10009,
      },
    ]);
    /* Wazuh END */

    return {};
  }

  public start(core: CoreStart): HealtcheckPluginStart {
    setHealthCheck(core.healthCheck);
    setCore(core);

    mountButton(core);

    return {};
  }

  public stop() {}
}
