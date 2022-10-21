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
import { WizardEmbeddableFactoryDefinition, WIZARD_EMBEDDABLE } from './embeddable';
import wizardIconSecondaryFill from './assets/wizard_icon_secondary_fill.svg';
import wizardIcon from './assets/wizard_icon.svg';
import { EDIT_PATH, PLUGIN_ID, PLUGIN_NAME, WIZARD_SAVED_OBJECT } from '../common';
import { TypeService } from './services/type_service';
import { getPreloadedStore } from './application/utils/state_management';
import {
  setSearchService,
  setIndexPatterns,
  setHttp,
  setSavedWizardLoader,
  setExpressionLoader,
  setTimeFilter,
  setUISettings,
  setTypeService,
  setReactExpressionRenderer,
} from './plugin_services';
import { createSavedWizardLoader } from './saved_visualizations';
import { registerDefaultTypes } from './visualizations';
import { ConfigSchema } from '../config';

export class WizardPlugin
  implements
    Plugin<WizardSetup, WizardStart, WizardPluginSetupDependencies, WizardPluginStartDependencies> {
  private typeService = new TypeService();

  constructor(public initializerContext: PluginInitializerContext<ConfigSchema>) {}

  public setup(
    core: CoreSetup<WizardPluginStartDependencies, WizardStart>,
    { embeddable, visualizations }: WizardPluginSetupDependencies
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
          embeddable: pluginsStart.embeddable,
          scopedHistory: params.history,
        };

        // Instantiate the store
        const store = await getPreloadedStore(services);

        // Render the application
        return renderApp(params, services, store);
      },
    });

    // Register embeddable
    // TODO: investigate simplification via getter a la visualizations:
    // const start = createStartServicesGetter(core.getStartServices));
    // const embeddableFactory = new WizardEmbeddableFactoryDefinition({ start });
    const embeddableFactory = new WizardEmbeddableFactoryDefinition();
    embeddable.registerEmbeddableFactory(WIZARD_EMBEDDABLE, embeddableFactory);

    // Register the plugin as an alias to create visualization
    visualizations.registerAlias({
      name: PLUGIN_ID,
      title: PLUGIN_NAME,
      description: i18n.translate('wizard.visPicker.description', {
        defaultMessage: 'Create visualizations using the new Drag & Drop experience',
      }),
      icon: wizardIconSecondaryFill,
      stage: 'experimental',
      aliasApp: PLUGIN_ID,
      aliasPath: '#/',
      appExtensions: {
        visualizations: {
          docTypes: [PLUGIN_ID],
          toListItem: ({ id, attributes }) => ({
            description: attributes?.description,
            editApp: PLUGIN_ID,
            editUrl: `${EDIT_PATH}/${encodeURIComponent(id)}`,
            icon: wizardIcon,
            id,
            savedObjectType: WIZARD_SAVED_OBJECT,
            stage: 'experimental',
            title: attributes?.title,
            typeTitle: PLUGIN_NAME,
          }),
        },
      },
    });

    return {
      ...typeService.setup(),
    };
  }

  public start(core: CoreStart, { data, expressions }: WizardPluginStartDependencies): WizardStart {
    const typeService = this.typeService.start();

    const savedWizardLoader = createSavedWizardLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns: data.indexPatterns,
      search: data.search,
      chrome: core.chrome,
      overlays: core.overlays,
    });

    // Register plugin services
    setSearchService(data.search);
    setExpressionLoader(expressions.ExpressionLoader);
    setReactExpressionRenderer(expressions.ReactExpressionRenderer);
    setHttp(core.http);
    setIndexPatterns(data.indexPatterns);
    setSavedWizardLoader(savedWizardLoader);
    setTimeFilter(data.query.timefilter.timefilter);
    setTypeService(typeService);
    setUISettings(core.uiSettings);

    return {
      ...typeService,
      savedWizardLoader,
    };
  }

  public stop() {}
}
