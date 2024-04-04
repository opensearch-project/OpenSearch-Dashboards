/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { lazy } from 'react';
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
  getVisBuilderServices,
  setVisBuilderServices,
} from './plugin_services';
import { createSavedVisBuilderLoader } from './saved_visualizations';
import { registerDefaultTypes } from './visualizations';
import { ConfigSchema } from '../config';
import { createStartServicesGetter } from '../../opensearch_dashboards_utils/public';
import { buildVisBuilderServices } from './types';
import { extractSavedVisBuilderId } from './extract_id';
import { getStateFromSavedObject } from '../public/saved_visualizations/transforms';
import { getSavedVisBuilderVis } from '../public/application/utils/use/use_saved_vis_builder_vis';
import { migrateUrlState } from './migrate_state';

export class VisBuilderPlugin
  implements
    Plugin<
      VisBuilderSetup,
      VisBuilderStart,
      VisBuilderPluginSetupDependencies,
      VisBuilderPluginStartDependencies
    > {
  private typeService = new TypeService();
  private stopUrlTracking?: () => void;
  private currentHistory?: any;

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
        // const { savedObjects, navigation, expressions } = pluginsStart;
        const {
          application: { navigateToApp },
        } = coreStart;
        setHeaderActionMenuMounter(params.setHeaderActionMenu);
        this.currentHistory = params.history;

        const unlistenParentHistory = this.currentHistory.listen(() => {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        });

        // dispatch synthetic hash change event to update hash history objects
        // this is necessary because hash updates triggered by using popState won't trigger this event naturally.
        this.currentHistory.listen(() => {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        });

        // This is for instances where the user navigates to the app from the application nav menu
        const path = window.location.pathname;
        const hash = window.location.hash;
        const id = extractSavedVisBuilderId(path);
        const editPath = id ? `${EDIT_PATH}/${id}` : hash;
        const migratePath = hash
          ? migrateUrlState(`${editPath}/${hash}`)
          : migrateUrlState(editPath);

        navigateToApp('data-explorer', {
          replace: true,
          path: `/${PLUGIN_ID}${migratePath}`,
          state: params.history.location.state,
        });

        return () => {
          unlistenParentHistory();
        };
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
          const services: VisBuilderServices = getVisBuilderServices();
          const { savedVisBuilderLoader } = services;

          const path = window.location.pathname;
          const savedVisBuilderId = extractSavedVisBuilderId(path);
          let savedVisBuilderState;

          if (savedVisBuilderId) {
            const savedVisBuilderVis = await getSavedVisBuilderVis(
              savedVisBuilderLoader,
              savedVisBuilderId
            );
            savedVisBuilderState = getStateFromSavedObject(savedVisBuilderVis).state;
          }
          const sliceProps = {
            services,
            savedVisBuilderState: savedVisBuilderState || undefined,
          };

          return [
            getEditorSlicePreloadedState(services),
            getStyleSlicePreloadedState(sliceProps),
            getUiStateSlicePreloadedState(sliceProps),
            getVisualizationSlicePreloadedState(sliceProps),
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

  public start(core: CoreStart, plugins: VisBuilderPluginStartDependencies): VisBuilderStart {
    const typeService = this.typeService.start();
    const { expressions, data, uiActions } = plugins;

    const savedVisBuilderLoader = createSavedVisBuilderLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns: data.indexPatterns,
      search: data.search,
      chrome: core.chrome,
      overlays: core.overlays,
    });

    const services = buildVisBuilderServices(core, plugins, savedVisBuilderLoader, typeService);
    setVisBuilderServices(services);

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
