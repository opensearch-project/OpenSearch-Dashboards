/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
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
  setQueryService,
  setUIActions,
} from './plugin_services';
import { createSavedVisBuilderLoader } from './saved_visualizations';
import { registerDefaultTypes } from './visualizations';
import { ConfigSchema } from '../config';
import {
  createOsdUrlStateStorage,
  createOsdUrlTracker,
  createStartServicesGetter,
  withNotifyOnErrors,
} from '../../opensearch_dashboards_utils/public';
import { opensearchFilters } from '../../data/public';

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
    { embeddable, visualizations, data }: VisBuilderPluginSetupDependencies
  ) {
    const { appMounted, appUnMounted, stop: stopUrlTracker } = createOsdUrlTracker({
      baseUrl: core.http.basePath.prepend(`/app/${PLUGIN_ID}`),
      defaultSubUrl: '#/',
      storageKey: `lastUrl:${core.http.basePath.get()}:${PLUGIN_ID}`,
      navLinkUpdater$: this.appStateUpdater,
      toastNotifications: core.notifications.toasts,
      stateParams: [
        {
          osdUrlKey: '_g',
          stateUpdate$: data.query.state$.pipe(
            filter(
              ({ changes }) => !!(changes.globalFilters || changes.time || changes.refreshInterval)
            ),
            map(({ state }) => ({
              ...state,
              filters: state.filters?.filter(opensearchFilters.isFilterPinned),
            }))
          ),
        },
      ],
      getHistory: () => {
        return this.currentHistory!;
      },
    });
    this.stopUrlTracking = () => {
      stopUrlTracker();
    };

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
        // Load application bundle
        const { renderApp } = await import('./application');

        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, pluginsStart, selfStart] = await core.getStartServices();
        const { savedObjects, navigation, expressions } = pluginsStart;
        this.currentHistory = params.history;

        // make sure the index pattern list is up to date
        pluginsStart.data.indexPatterns.clearCache();
        // make sure a default index pattern exists
        // if not, the page will be redirected to management and visualize won't be rendered
        // TODO: Add the redirect
        await pluginsStart.data.indexPatterns.ensureDefaultIndexPattern();

        appMounted();

        // dispatch synthetic hash change event to update hash history objects
        // this is necessary because hash updates triggered by using popState won't trigger this event naturally.
        const unlistenParentHistory = this.currentHistory.listen(() => {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        });

        const services: VisBuilderServices = {
          ...coreStart,
          appName: PLUGIN_ID,
          scopedHistory: this.currentHistory,
          history: this.currentHistory,
          osdUrlStateStorage: createOsdUrlStateStorage({
            history: this.currentHistory,
            useHash: coreStart.uiSettings.get('state:storeInSessionStorage'),
            ...withNotifyOnErrors(coreStart.notifications.toasts),
          }),
          toastNotifications: coreStart.notifications.toasts,
          data: pluginsStart.data,
          savedObjectsPublic: savedObjects,
          navigation,
          expressions,
          setHeaderActionMenu: params.setHeaderActionMenu,
          types: typeService.start(),
          savedVisBuilderLoader: selfStart.savedVisBuilderLoader,
          embeddable: pluginsStart.embeddable,
          dashboard: pluginsStart.dashboard,
          uiActions: pluginsStart.uiActions,
        };

        // Instantiate the store
        const { store, unsubscribe: unsubscribeStore } = await getPreloadedStore(services);
        const unmount = renderApp(params, services, store);

        // Render the application
        return () => {
          unlistenParentHistory();
          unmount();
          appUnMounted();
          unsubscribeStore();
        };
      },
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
