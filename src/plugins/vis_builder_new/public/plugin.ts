/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { lazy } from 'react';
import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  ScopedHistory,
} from '../../../core/public';
import {
  VisBuilderPluginSetupDependencies,
  VisBuilderPluginStartDependencies,
  VisBuilderServices,
  VisBuilderSetup,
  VisBuilderStart,
} from './types';
import { VisBuilderEmbeddableFactory, VISBUILDER_EMBEDDABLE } from './embeddable';
import {
  EDIT_PATH,
  PLUGIN_ID,
  PLUGIN_NAME,
  VISBUILDER_SAVED_OBJECT,
  VIS_BUILDER_CHART_TYPE,
} from '../common';
import { TypeService } from './services/type_service';
import {
  editorSlice,
  styleSlice,
  uiStateSlice,
  visualizationSlice,
  handlerEditorState,
  handlerParentAggs,
  getEditorSlicePreloadedState,
  getStyleSlicePreloadedState,
  getUiStateSlicePreloadedState,
  getVisualizationSlicePreloadedState,
} from './application/utils/state_management';
import {
  setExpressionLoader,
  setReactExpressionRenderer,
  setSearchService,
  setIndexPatterns,
  setHttp,
  setSavedVisBuilderLoader,
  setTimeFilter,
  setUISettings,
  setUIActions,
  setTypeService,
  setQueryService,
  setHeaderActionMenuMounter,
} from './plugin_services';
import { createSavedVisBuilderLoader } from './saved_visualizations';
import { registerDefaultTypes } from './visualizations';
import { ConfigSchema } from '../config';
import { createStartServicesGetter } from '../../opensearch_dashboards_utils/public';
import { opensearchFilters } from '../../data/public';
import { useOpenSearchDashboards } from '../../opensearch_dashboards_react/public';

export class VisBuilderPlugin
  implements
    Plugin<
      VisBuilderSetup,
      VisBuilderStart,
      VisBuilderPluginSetupDependencies,
      VisBuilderPluginStartDependencies
    > {
  private typeService = new TypeService();
  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private stopUrlTracking?: () => void;
  private currentHistory?: ScopedHistory;

  constructor(public initializerContext: PluginInitializerContext<ConfigSchema>) {}

  public setup(
    core: CoreSetup<VisBuilderPluginStartDependencies, VisBuilderStart>,
    { embeddable, visualizations, dataExplorer }: VisBuilderPluginSetupDependencies
  ) {
    // Register Default Visualizations
    const typeService = this.typeService;
    registerDefaultTypes(typeService.setup());

    // Register the plugin to core
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      navLinkStatus: AppNavLinkStatus.hidden,
      defaultPath: '#/',
      mount: async (params: AppMountParameters) => {
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart] = await core.getStartServices();
        const {
          application: { navigateToApp },
        } = coreStart;
        setHeaderActionMenuMounter(params.setHeaderActionMenu);
        this.currentHistory = params.history;

        // dispatch synthetic hash change event to update hash history objects
        // this is necessary because hash updates triggered by using popState won't trigger this event naturally.
        this.currentHistory.listen(() => {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        });

        // This is for instances where the user navigates to the app from the application nav menu
        const path = window.location.hash;
        navigateToApp('data-explorer', {
          replace: true,
          path: `/${PLUGIN_ID}${path}`,
        });

        return () => {};
      },
    });

    // Register view in data explorer
    dataExplorer.registerView<any>({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      defaultPath: '#/',
      appExtentions: {
        savedObject: {
          docTypes: [VISBUILDER_SAVED_OBJECT],
          toListItem: (obj) => ({
            id: obj.id,
            label: obj.title,
          }),
        },
      },
      ui: {
        defaults: async () => {
          const [coreStart, pluginsStart, selfStart] = await core.getStartServices();
          const services: VisBuilderServices = {
            ...coreStart,
            appName: PLUGIN_ID,
            // history: this.currentHistory,
            toastNotifications: coreStart.notifications.toasts,
            data: pluginsStart.data,
            savedObjectsPublic: pluginsStart.savedObjects,
            navigation: pluginsStart.navigation,
            expressions: pluginsStart.expressions,
            types: typeService.start(),
            savedVisBuilderLoader: selfStart.savedVisBuilderLoader,
            embeddable: pluginsStart.embeddable,
            dashboard: pluginsStart.dashboard,
            uiActions: pluginsStart.uiActions,
            scopedHistory: this.currentHistory,
          };

          return [
            getEditorSlicePreloadedState(services),
            getStyleSlicePreloadedState(services),
            getUiStateSlicePreloadedState(services),
            getVisualizationSlicePreloadedState(services),
          ];
        },
        slices: [editorSlice, styleSlice, uiStateSlice, visualizationSlice],
        sideEffects: [handlerEditorState, handlerParentAggs],
      },
      shouldShow: () => true,
      // ViewComponent
      Canvas: lazy(() => import('./application/view_components/canvas')),
      Panel: lazy(() => import('./application/view_components/panel')),
      Context: lazy(() => import('./application/view_components/context')),
    });

    // Register embeddable
    const start = createStartServicesGetter(core.getStartServices);
    const embeddableFactory = new VisBuilderEmbeddableFactory({ start });
    embeddable.registerEmbeddableFactory(VISBUILDER_EMBEDDABLE, embeddableFactory);

    // Register the plugin as an alias to create visualization
    visualizations.registerAlias({
      name: PLUGIN_ID,
      title: PLUGIN_NAME,
      description: i18n.translate('visBuilder.visPicker.description', {
        defaultMessage: 'Create visualizations using the new VisBuilder',
      }),
      icon: 'visBuilder',
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
            icon: 'visBuilder',
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
    { expressions, data, uiActions }: VisBuilderPluginStartDependencies
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
    setUIActions(uiActions);
    setQueryService(data.query);

    return {
      ...typeService,
      savedVisBuilderLoader,
    };
  }

  public stop() {
    if (this.stopUrlTracking) {
      this.stopUrlTracking();
    }
  }
}
