/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  AppNavLinkStatus,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from '../../../core/public';
import {
  WizardPluginSetupDependencies,
  WizardPluginStartDependencies,
  WizardServices,
} from './types';
import { PLUGIN_NAME } from '../common';

export class WizardPlugin
  implements Plugin<void, void, WizardPluginSetupDependencies, WizardPluginStartDependencies> {
  constructor(public initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup<WizardPluginStartDependencies>,
    { visualizations }: WizardPluginSetupDependencies
  ) {
    // Register the plugin to core
    core.application.register({
      id: 'wizard',
      title: PLUGIN_NAME,
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, pluginsStart] = await core.getStartServices();
        const { data, savedObjects, navigation } = pluginsStart;

        const services: WizardServices = {
          ...coreStart,
          toastNotifications: coreStart.notifications.toasts,
          data,
          savedObjectsPublic: savedObjects,
          navigation,
          setHeaderActionMenu: params.setHeaderActionMenu,
        };

        // make sure the index pattern list is up to date
        data.indexPatterns.clearCache();
        // make sure a default index pattern exists
        // if not, the page will be redirected to management and visualize won't be rendered
        await pluginsStart.data.indexPatterns.ensureDefaultIndexPattern();

        // Render the application
        return renderApp(params, services);
      },
    });

    // Register the plugin as an alias to create visualization
    visualizations.registerAlias({
      name: 'wizard',
      title: 'Wizard',
      description: i18n.translate('wizard.vizPicker.description', {
        defaultMessage: 'TODO...',
      }),
      // TODO: Replace with actual icon once available
      icon: 'vector',
      stage: 'beta',
      aliasApp: 'wizard',
      aliasPath: '#/',
    });
  }

  public start(core: CoreStart) {}

  public stop() {}
}
