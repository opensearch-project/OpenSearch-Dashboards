/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  Plugin,
} from '../../../core/public';
import { WizardPluginStartDependencies, WizardServices } from './types';
import { PLUGIN_NAME } from '../common';

export class WizardPlugin implements Plugin<void, void, object, WizardPluginStartDependencies> {
  public setup(core: CoreSetup<WizardPluginStartDependencies>) {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'wizard',
      title: PLUGIN_NAME,
      euiIconType: 'inputOutput',
      defaultPath: '#/',
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, pluginsStart] = await core.getStartServices();

        const services: WizardServices = {
          ...coreStart,
          toastNotifications: coreStart.notifications.toasts,
          data: pluginsStart.data,
          savedObjectsPublic: pluginsStart.savedObjects,
          navigation: pluginsStart.navigation,
          setHeaderActionMenu: params.setHeaderActionMenu,
        };

        // make sure the index pattern list is up to date
        pluginsStart.data.indexPatterns.clearCache();
        // make sure a default index pattern exists
        // if not, the page will be redirected to management and visualize won't be rendered
        await pluginsStart.data.indexPatterns.ensureDefaultIndexPattern();

        // Render the application
        return renderApp(params, services);
      },
    });
  }

  public start(core: CoreStart) {}

  public stop() {}
}
