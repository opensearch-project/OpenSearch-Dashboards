/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { filter, map, take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { opensearchFilters } from '../../data/public';
import {
  createOsdUrlStateStorage,
  createOsdUrlTracker,
  withNotifyOnErrors,
} from '../../opensearch_dashboards_utils/public';
import {
  AppMountParameters,
  AppUpdater,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  Plugin,
  PluginInitializerContext,
  ScopedHistory,
  WorkspaceAvailability,
} from '../../../core/public';
import { isNavGroupInFeatureConfigs } from '../../workspace/public';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { ConfigSchema } from '../common/types/config';
import {
  ExplorePluginSetup,
  ExplorePluginStart,
  ExploreSetupDependencies,
  ExploreStartDependencies,
} from './types';
import { ViewService } from './application/legacy/data_explorer/services/view_service';
import { setUsageCollector } from './application/legacy/data_explorer/services';
import { DataExplorerServices } from './application/legacy/data_explorer';
import { getPreloadedStore } from './application/legacy/data_explorer/utils/state_management';

export class ExplorePlugin
  implements
    Plugin<
      ExplorePluginSetup,
      ExplorePluginStart,
      ExploreSetupDependencies,
      ExploreStartDependencies
    > {
  private config: ConfigSchema;
  private viewService = new ViewService();
  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private stopUrlTracking?: () => void;
  private currentHistory?: ScopedHistory;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
  }

  public setup(
    core: CoreSetup<ExploreStartDependencies, ExplorePluginStart>,
    { data, usageCollection }: ExploreSetupDependencies
  ): ExplorePluginSetup {
    if (!this.config.enabled) return {};
    const viewService = this.viewService;

    setUsageCollector(usageCollection);
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

    // Register an application into the side navigation menu
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      order: 1000,
      workspaceAvailability: WorkspaceAvailability.insideWorkspace,
      euiIconType: 'inputOutput',
      defaultPath: '#/',
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      mount: async (params: AppMountParameters) => {
        const [coreStart, pluginsStart] = await core.getStartServices();
        const features = await core.workspaces.currentWorkspace$
          .pipe(take(1))
          .toPromise()
          .then((workspace) => workspace?.features);
        if (
          !features ||
          (!isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features) &&
            !isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS['security-analytics'].id, features))
        ) {
          coreStart.application.navigateToApp('discover', { replace: true });
        }

        const { renderApp } = await import('./application/legacy/data_explorer/application');
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
        services.store = store;

        const unmount = renderApp(coreStart, services, params, store);
        appMounted();

        return () => {
          unsubscribeStore();
          appUnMounted();
          unmount();
        };
      },
    });

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS['security-analytics'], [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
      },
    ]);

    // Register the plugin in the data explorer
    // plugins.dataExplorer.registerView({
    //   id: PLUGIN_ID,
    //   title: PLUGIN_NAME,
    //   defaultPath: '#/',
    //   appExtentions: {
    //     savedObject: {
    //       docTypes: ['explore'],
    //       toListItem: (obj) => ({
    //         id: obj.id,
    //         label: obj.title,
    //       }),
    //     },
    //   },
    //   shouldShow: () => true,
    //   // ViewComponent
    //   Canvas: lazy(() => import('./application/view_components/canvas')),
    //   Panel: lazy(() => import('./application/view_components/panel')),
    //   Context: lazy(() => import('./application/view_components/context')),
    // });

    // TODO: Register embeddable factory when ready
    // this.registerEmbeddable(core, plugins);

    return {};
  }

  public start(core: CoreStart): ExplorePluginStart {
    return {};
  }

  public stop() {
    if (this.stopUrlTracking) {
      this.stopUrlTracking();
    }
  }

  // TODO: Register embeddable factory when ready
  // private registerEmbeddable(core: CoreSetup<ExploreStartPlugins>, plugins: ExploreSetupPlugins) {
  //   const getStartServices = async () => {
  //     const [coreStart, deps] = await core.getStartServices();
  //     return {
  //       executeTriggerActions: deps.uiActions.executeTriggerActions,
  //       isEditable: () => coreStart.application.capabilities.discover?.save as boolean,
  //     };
  //   };

  //   const factory = new ExploreEmbeddableFactory(getStartServices);
  //   plugins.embeddable.registerEmbeddableFactory(factory.type, factory);
  // }
}
