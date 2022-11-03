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
  VisBuilderPluginSetupDependencies,
  VisBuilderPluginStartDependencies,
  VisBuilderServices,
  VisBuilderSetup,
  VisBuilderStart,
} from './types';
import { VisBuilderEmbeddableFactoryDefinition, VISBUILDER_EMBEDDABLE } from './embeddable';
import visBuilderIconSecondaryFill from './assets/vis_builder_icon_secondary_fill.svg';
import visBuilderIcon from './assets/vis_builder_icon.svg';
import {
  EDIT_PATH,
  PLUGIN_ID,
  PLUGIN_NAME,
  VISBUILDER_SAVED_OBJECT,
  VIS_BUILDER_CHART_TYPE,
} from '../common';
import { TypeService } from './services/type_service';
import { getPreloadedStore } from './application/utils/state_management';
import {
  setSearchService,
  setIndexPatterns,
  setHttp,
  setSavedVisBuilderLoader,
  setExpressionLoader,
  setTimeFilter,
  setUISettings,
  setTypeService,
  setReactExpressionRenderer,
} from './plugin_services';
import { createSavedVisBuilderLoader } from './saved_visualizations';
import { registerDefaultTypes } from './visualizations';
import { ConfigSchema } from '../config';

export class VisBuilderPlugin
  implements
    Plugin<
      VisBuilderSetup,
      VisBuilderStart,
      VisBuilderPluginSetupDependencies,
      VisBuilderPluginStartDependencies
    > {
  private typeService = new TypeService();

  constructor(public initializerContext: PluginInitializerContext<ConfigSchema>) {}

  public setup(
    core: CoreSetup<VisBuilderPluginStartDependencies, VisBuilderStart>,
    { embeddable, visualizations }: VisBuilderPluginSetupDependencies
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

        const services: VisBuilderServices = {
          ...coreStart,
          toastNotifications: coreStart.notifications.toasts,
          data,
          savedObjectsPublic: savedObjects,
          navigation,
          expressions,
          history: params.history,
          setHeaderActionMenu: params.setHeaderActionMenu,
          types: typeService.start(),
          savedVisBuilderLoader: selfStart.savedVisBuilderLoader,
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
    // const embeddableFactory = new VisBuilderEmbeddableFactoryDefinition({ start });
    const embeddableFactory = new VisBuilderEmbeddableFactoryDefinition();
    embeddable.registerEmbeddableFactory(VISBUILDER_EMBEDDABLE, embeddableFactory);

    // Register the plugin as an alias to create visualization
    visualizations.registerAlias({
      name: PLUGIN_ID,
      title: PLUGIN_NAME,
      description: i18n.translate('visBuilder.visPicker.description', {
        defaultMessage: 'Create visualizations using the new VisBuilder',
      }),
      icon: visBuilderIconSecondaryFill,
      stage: 'experimental',
      aliasApp: PLUGIN_ID,
      aliasPath: '#/',
      appExtensions: {
        visualizations: {
          docTypes: [VISBUILDER_SAVED_OBJECT],
          toListItem: ({ id, attributes, updated_at: updatedAt }) => ({
            description: attributes?.description,
            editApp: PLUGIN_ID,
            editUrl: `${EDIT_PATH}/${encodeURIComponent(id)}`,
            icon: visBuilderIcon,
            id,
            savedObjectType: VISBUILDER_SAVED_OBJECT,
            stage: 'experimental',
            title: attributes?.title,
            typeTitle: VIS_BUILDER_CHART_TYPE,
            updated_at: updatedAt,
          }),
        },
      },
    });

    return {
      ...typeService.setup(),
    };
  }

  public start(
    core: CoreStart,
    { data, expressions }: VisBuilderPluginStartDependencies
  ): VisBuilderStart {
    const typeService = this.typeService.start();

    const savedVisBuilderLoader = createSavedVisBuilderLoader({
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
    setSavedVisBuilderLoader(savedVisBuilderLoader);
    setTimeFilter(data.query.timefilter.timefilter);
    setTypeService(typeService);
    setUISettings(core.uiSettings);

    return {
      ...typeService,
      savedVisBuilderLoader,
    };
  }

  public stop() {}
}
