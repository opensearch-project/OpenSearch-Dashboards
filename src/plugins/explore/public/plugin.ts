/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { filter, map, take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { i18n } from '@osd/i18n';
import rison from 'rison-node';
import { stringify } from 'query-string';
import { lazy } from 'react';
import { opensearchFilters } from '../../data/public';
import {
  createOsdUrlStateStorage,
  createOsdUrlTracker,
  url,
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
import { LOGS_VIEW_ID, PLUGIN_ID, PLUGIN_NAME } from '../common';
import { ConfigSchema } from '../common/config';
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
import { DiscoverStart, DiscoverStartPlugins } from './application/legacy/discover/types';
import { DocViewsRegistry } from './application/legacy/discover/application/doc_views/doc_views_registry';
import { DocViewsLinksRegistry } from './application/legacy/discover/application/doc_views_links/doc_views_links_registry';
import { JsonCodeBlock } from './application/legacy/discover/application/components/json_code_block/json_code_block';
import { DocViewTable } from './application/legacy/discover/application/components/table/table';
import {
  getServices,
  setDocViewsLinksRegistry,
  setDocViewsRegistry,
  setServices,
  setUiActions,
} from './application/legacy/discover/opensearch_dashboards_services';
import { generateDocViewsUrl } from './application/legacy/discover/application/components/doc_views/generate_doc_views_url';
import {
  discoverSlice,
  DiscoverState,
  getPreloadedState,
} from './application/legacy/discover/application/utils/state_management';
import { buildServices } from './application/legacy/discover/build_services';
import { createSavedSearchesLoader } from './application/legacy/discover';
import { isNavGroupInFeatureConfigs } from '../../../core/public';

export class ExplorePlugin
  implements
    Plugin<
      ExplorePluginSetup,
      ExplorePluginStart,
      ExploreSetupDependencies,
      ExploreStartDependencies
    > {
  private config: ConfigSchema;
  /** data_explorer */
  private viewService = new ViewService();
  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private stopUrlTracking?: () => void;
  private currentHistory?: ScopedHistory;

  /** discover */
  private docViewsRegistry: DocViewsRegistry | null = null;
  private docViewsLinksRegistry: DocViewsLinksRegistry | null = null;
  private servicesInitialized: boolean = false;
  private urlGenerator?: DiscoverStart['urlGenerator'];
  private initializeServices?: () => { core: CoreStart; plugins: DiscoverStartPlugins };

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
  }

  public setup(
    core: CoreSetup<ExploreStartDependencies, ExplorePluginStart>,
    setupDeps: ExploreSetupDependencies
  ): ExplorePluginSetup {
    const viewService = this.viewService;

    setUsageCollector(setupDeps.usageCollection);
    this.docViewsRegistry = new DocViewsRegistry();
    setDocViewsRegistry(this.docViewsRegistry);
    this.docViewsRegistry.addDocView({
      title: i18n.translate('explore.discover.docViews.table.tableTitle', {
        defaultMessage: 'Table',
      }),
      order: 10,
      component: DocViewTable,
    });

    this.docViewsRegistry.addDocView({
      title: i18n.translate('explore.discover.docViews.json.jsonTitle', {
        defaultMessage: 'JSON',
      }),
      order: 20,
      component: JsonCodeBlock,
    });
    this.docViewsLinksRegistry = new DocViewsLinksRegistry();
    setDocViewsLinksRegistry(this.docViewsLinksRegistry);

    this.docViewsLinksRegistry.addDocViewLink({
      label: i18n.translate('explore.discover.docTable.tableRow.viewSurroundingDocumentsLinkText', {
        defaultMessage: 'View surrounding documents',
      }),
      generateCb: (renderProps: any) => {
        const globalFilters: any = getServices().filterManager.getGlobalFilters();
        const appFilters: any = getServices().filterManager.getAppFilters();
        const queryString = getServices().data.query.queryString;
        const showDocLinks =
          queryString.getLanguageService().getLanguage(queryString.getQuery().language)
            ?.showDocLinks ?? undefined;

        const hash = stringify(
          url.encodeQuery({
            _g: rison.encode({
              filters: globalFilters || [],
            }),
            _a: rison.encode({
              columns: renderProps.columns,
              filters: (appFilters || []).map(opensearchFilters.disableFilter),
            }),
          }),
          { encode: false, sort: false }
        );

        const contextUrl = `#/context/${encodeURIComponent(
          renderProps.indexPattern.id
        )}/${encodeURIComponent(renderProps.hit._id)}?${hash}`;

        return {
          url: generateDocViewsUrl(contextUrl),
          hide:
            (showDocLinks !== undefined ? !showDocLinks : false) ||
            !renderProps.indexPattern.isTimeBased(),
        };
      },
      order: 1,
    });

    this.docViewsLinksRegistry.addDocViewLink({
      label: i18n.translate('explore.discover.docTable.tableRow.viewSingleDocumentLinkText', {
        defaultMessage: 'View single document',
      }),
      generateCb: (renderProps) => {
        const queryString = getServices().data.query.queryString;
        const showDocLinks =
          queryString.getLanguageService().getLanguage(queryString.getQuery().language)
            ?.showDocLinks ?? undefined;

        const docUrl = `#/doc/${renderProps.indexPattern.id}/${
          renderProps.hit._index
        }?id=${encodeURIComponent(renderProps.hit._id)}`;

        return {
          url: generateDocViewsUrl(docUrl),
          hide: showDocLinks !== undefined ? !showDocLinks : false,
        };
      },
      order: 2,
    });

    const { appMounted, appUnMounted, stop: stopUrlTracker } = createOsdUrlTracker({
      baseUrl: core.http.basePath.prepend(`/app/${PLUGIN_ID}`),
      defaultSubUrl: '#/',
      storageKey: `lastUrl:${core.http.basePath.get()}:${PLUGIN_ID}`,
      navLinkUpdater$: this.appStateUpdater,
      toastNotifications: core.notifications.toasts,
      stateParams: [
        {
          osdUrlKey: '_g',
          stateUpdate$: setupDeps.data.query.state$.pipe(
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
      defaultPath: `${LOGS_VIEW_ID}#/`,
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      mount: async (params: AppMountParameters) => {
        const [coreStart, pluginsStart] = await core.getStartServices();
        const features = await core.workspaces.currentWorkspace$
          .pipe(take(1))
          .toPromise()
          .then((workspace) => workspace?.features);
        // We want to limit explore UI to only show up under the observability
        // workspace. If user lands in the explore plugin URL in a different
        // workspace, we will redirect them to classic discover.
        if (
          !features ||
          !isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features)
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

    // TODO: Register embeddable factory when ready
    // this.registerEmbeddable(core, plugins);

    setupDeps.urlForwarding.forwardApp('doc', 'discover', (path) => {
      return `#${path}`;
    });
    setupDeps.urlForwarding.forwardApp('context', 'discover', (path) => {
      const urlParts = path.split('/');
      // take care of urls containing legacy url, those split in the following way
      // ["", "context", indexPatternId, _type, id + params]
      if (urlParts[4]) {
        // remove _type part
        const newPath = [...urlParts.slice(0, 3), ...urlParts.slice(4)].join('/');
        return `#${newPath}`;
      }
      return `#${path}`;
    });
    setupDeps.urlForwarding.forwardApp('discover', 'discover', (path) => {
      const [, id, tail] = /discover\/([^\?]+)(.*)/.exec(path) || [];
      if (!id) {
        return `#${path.replace('/discover', '') || '/'}`;
      }
      return `#/view/${id}${tail || ''}`;
    });

    /* if (setupDeps.home) {
      registerFeature(setupDeps.home);
    } */

    const viewServiceSetup = this.viewService.setup();
    viewServiceSetup.registerView<DiscoverState>({
      id: LOGS_VIEW_ID,
      title: 'Logs',
      defaultPath: '#/',
      appExtentions: {
        savedObject: {
          docTypes: ['search'],
          toListItem: (obj) => ({
            id: obj.id,
            label: obj.title,
          }),
        },
      },
      ui: {
        defaults: async () => {
          this.initializeServices?.();
          const services = getServices();
          return await getPreloadedState(services);
        },
        slice: discoverSlice,
      },
      shouldShow: () => true,
      // ViewComponent
      Canvas: lazy(
        () => import('./application/legacy/discover/application/view_components/canvas')
      ),
      Panel: lazy(() => import('./application/legacy/discover/application/view_components/panel')),
      Context: lazy(
        () => import('./application/legacy/discover/application/view_components/context')
      ),
    });

    return {
      ...viewServiceSetup,
      docViews: {
        addDocView: this.docViewsRegistry.addDocView.bind(this.docViewsRegistry),
      },
      docViewsLinks: {
        addDocViewLink: this.docViewsLinksRegistry.addDocViewLink.bind(this.docViewsLinksRegistry),
      },
    };
  }

  public start(core: CoreStart, plugins: ExploreStartDependencies): ExplorePluginStart {
    setUiActions(plugins.uiActions);

    this.initializeServices = () => {
      if (this.servicesInitialized) {
        return { core, plugins };
      }
      const services = buildServices(core, plugins, this.initializerContext);
      setServices(services);
      this.servicesInitialized = true;

      return { core, plugins };
    };

    this.initializeServices();

    return {
      urlGenerator: this.urlGenerator,
      savedSearchLoader: createSavedSearchesLoader({
        savedObjectsClient: core.savedObjects.client,
        indexPatterns: plugins.data.indexPatterns,
        search: plugins.data.search,
        chrome: core.chrome,
        overlays: core.overlays,
      }),
    };
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
