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
  WizardSetup,
  WizardStart,
} from './types';
import wizardIcon from './assets/wizard_icon.svg';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { TypeService } from './services/type_service';
import { getPreloadedStore } from './application/utils/state_management';
import { setAggService, setIndexPatterns } from './plugin_services';
import { createSavedWizardLoader } from './saved_visualizations';
import { registerDefaultTypes } from './visualizations';

export class WizardPlugin
  implements
    Plugin<WizardSetup, WizardStart, WizardPluginSetupDependencies, WizardPluginStartDependencies> {
  private typeService = new TypeService();

  constructor(public initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup<WizardPluginStartDependencies, WizardStart>,
    { visualizations }: WizardPluginSetupDependencies
  ) {
    const typeService = this.typeService;
    registerDefaultTypes(typeService.setup());

    // Register the plugin to core
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');

        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, pluginsStart, selfStart] = await core.getStartServices();
        const { data, savedObjects, navigation, expressions } = pluginsStart;

        // make sure the index pattern list is up to date
        data.indexPatterns.clearCache();
        // make sure a default index pattern exists
        // if not, the page will be redirected to management and visualize won't be rendered
        // TODO: Add the redirect
        await pluginsStart.data.indexPatterns.ensureDefaultIndexPattern();

        // Register plugin services
        setAggService(data.search.aggs);
        setIndexPatterns(data.indexPatterns);

        // Register Default Visualizations

        const services: WizardServices = {
          ...coreStart,
          toastNotifications: coreStart.notifications.toasts,
          data,
          savedObjectsPublic: savedObjects,
          navigation,
          expressions,
          history: params.history,
          setHeaderActionMenu: params.setHeaderActionMenu,
          types: typeService.start(),
          savedWizardLoader: selfStart.savedWizardLoader,
        };

        // Instantiate the store
        const store = await getPreloadedStore(services);

        // Render the application
        return renderApp(params, services, store);
      },
    });

    // Register the plugin as an alias to create visualization
    visualizations.registerAlias({
      name: PLUGIN_ID,
      title: PLUGIN_NAME,
      description: i18n.translate('wizard.visPicker.description', {
        defaultMessage: 'TODO...',
      }),
      // TODO: Replace with actual icon once available
      icon: wizardIcon,
      stage: 'beta',
      aliasApp: PLUGIN_ID,
      aliasPath: '#/',
    });

    return {
      ...typeService.setup(),
    };
  }

  public start(core: CoreStart, { data }: WizardPluginStartDependencies): WizardStart {
    const typeService = this.typeService;

    return {
      ...typeService.start(),
      savedWizardLoader: createSavedWizardLoader({
        savedObjectsClient: core.savedObjects.client,
        indexPatterns: data.indexPatterns,
        search: data.search,
        chrome: core.chrome,
        overlays: core.overlays,
      }),
    };
  }

  public stop() {}
}
