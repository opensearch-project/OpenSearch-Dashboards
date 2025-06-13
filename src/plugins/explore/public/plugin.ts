/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { filter, map, take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { i18n } from '@osd/i18n';
import rison from 'rison-node';
import { stringify } from 'query-string';
import { VisualizationRegistryService } from './services/visualization_registry_service';
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
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { ConfigSchema } from '../common/config';
import {
  ExplorePluginSetup,
  ExplorePluginStart,
  ExploreSetupDependencies,
  ExploreStartDependencies,
} from './types';
import { DocViewsRegistry } from './types/doc_views_types';
import { DocViewsLinksRegistry } from './application/legacy/discover/application/doc_views_links/doc_views_links_registry';
import {
  getServices,
  setDocViewsLinksRegistry,
  setDocViewsRegistry,
  setServices as setLegacyServices,
  setUiActions,
} from './application/legacy/discover/opensearch_dashboards_services';
import { generateDocViewsUrl } from './application/legacy/discover/application/components/doc_views/generate_doc_views_url';
import { isNavGroupInFeatureConfigs } from '../../../core/public';
import {
  createQueryEditorExtensionConfig,
  SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY,
} from './components/experience_banners';
import { DocViewTable } from './components/doc_viewer/doc_viewer_table/table';
import { JsonCodeBlock } from './components/doc_viewer/json_code_block/json_code_block';
import { TabRegistryService } from './services/tab_registry/tab_registry_service';
import { setUsageCollector } from './services/usage_collector';
import { createSavedExploreLoader } from './saved_explore';
import { getPreloadedStore } from './application/utils/state_management/store';
import { buildServices } from './build_services';

export class ExplorePlugin
  implements
    Plugin<
      ExplorePluginSetup,
      ExplorePluginStart,
      ExploreSetupDependencies,
      ExploreStartDependencies
    > {
  // @ts-ignore
  private config: ConfigSchema;
  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private stopUrlTracking?: () => void;
  private currentHistory?: ScopedHistory;

  /** discover */
  private docViewsRegistry: DocViewsRegistry | null = null;
  private docViewsLinksRegistry: DocViewsLinksRegistry | null = null;
  private servicesInitialized: boolean = false;
  private urlGenerator?: import('./types').ExplorePluginStart['urlGenerator'];
  private initializeServices?: () => { core: CoreStart; plugins: ExploreStartDependencies };

  // Add a new property for the tab registry
  private tabRegistry: TabRegistryService = new TabRegistryService();

  /** visualization registry */
  private visualizationRegistryService = new VisualizationRegistryService();

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
  }

  public setup(
    core: CoreSetup<ExploreStartDependencies, ExplorePluginStart>,
    setupDeps: ExploreSetupDependencies
  ): ExplorePluginSetup {
    // Set usage collector
    setUsageCollector(setupDeps.usageCollection);
    const visualizationRegistryService = this.visualizationRegistryService.setup();

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
      generateCb: (renderProps: Record<string, unknown>) => {
        const queryString = getServices().data.query.queryString;
        const showDocLinks =
          queryString.getLanguageService().getLanguage(queryString.getQuery().language)
            ?.showDocLinks ?? undefined;

        // Note: Explore uses Redux for filter management, not filterManager
        // So we don't include filter state in URLs for context links
        const hash = stringify(
          url.encodeQuery({
            _g: rison.encode({}), // No global filters (explore uses Redux)
            _a: rison.encode({
              columns: (renderProps as any).columns,
              // No filters since explore uses Redux store instead of filterManager
            }),
          }),
          { encode: false, sort: false }
        );

        const contextUrl = `#/context/${encodeURIComponent(
          (renderProps as any).indexPattern.id
        )}/${encodeURIComponent((renderProps as any).hit._id)}?${hash}`;

        return {
          url: generateDocViewsUrl(contextUrl),
          hide:
            (showDocLinks !== undefined ? !showDocLinks : false) ||
            !(renderProps as any).indexPattern.isTimeBased(),
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
              (value: Record<string, unknown>) =>
                !!((value.changes as any)?.time || (value.changes as any)?.refreshInterval)
            ),
            map((value: Record<string, unknown>) => ({
              ...(value.state as Record<string, unknown>),
              // Note: We don't use data plugin's filterManager, filters are managed in Redux
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

    setupDeps.data.__enhance({
      editor: {
        queryEditorExtension: createQueryEditorExtensionConfig(core),
      },
    });

    // Register an application into the side navigation menu
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      updater$: this.appStateUpdater.asObservable(),
      order: 1000,
      workspaceAvailability: WorkspaceAvailability.insideWorkspace,
      euiIconType: 'inputOutput',
      defaultPath: '#/',
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      mount: async (params: AppMountParameters) => {
        if (!this.initializeServices) {
          throw Error('Explore plugin method initializeServices is undefined');
        }

        // Get start services
        const { core: coreStart, plugins: pluginsStart } = await this.initializeServices();

        const features = await core.workspaces.currentWorkspace$
          .pipe(take(1))
          .toPromise()
          .then((workspace) => workspace?.features);
        const isExploreEnabledWorkspace =
          (features && isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features)) ??
          false;
        // We want to limit explore UI to only show up under the explore-enabled
        // workspaces. If user lands in the explore plugin URL in a different
        // workspace, we will redirect them to classic discover. We will also redirect if
        // they have manually selected classic discover
        if (
          !isExploreEnabledWorkspace ||
          !!localStorage.getItem(SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY)
        ) {
          coreStart.application.navigateToApp('discover', { replace: true });
          return () => {};
        }

        this.currentHistory = params.history;

        // make sure the index pattern list is up to date
        pluginsStart.data.indexPatterns.clearCache();

        // Check if this is a context or doc route (following discover pattern)
        const path = window.location.hash;
        if (path.startsWith('#/context') || path.startsWith('#/doc')) {
          const { renderDocView } = await import(
            './application/legacy/discover/application/components/doc_views'
          );
          const unmount = renderDocView(params.element);
          return () => {
            unmount();
          };
        }

        // For main explore routes, load the full application
        const { renderApp } = await import('./application');
        const { registerTabs } = await import('./application/register_tabs');

        // Build services using the buildServices function
        const services = buildServices(
          coreStart,
          pluginsStart,
          this.initializerContext,
          this.tabRegistry,
          this.visualizationRegistryService
        );

        // Add osdUrlStateStorage to services (like VisBuilder and DataExplorer)
        services.osdUrlStateStorage = createOsdUrlStateStorage({
          history: this.currentHistory,
          useHash: coreStart.uiSettings.get('state:storeInSessionStorage'),
          ...withNotifyOnErrors(coreStart.notifications.toasts),
        });

        // Add scopedHistory to services
        services.scopedHistory = this.currentHistory;

        // Register tabs with the tab registry
        registerTabs(services);

        // Instantiate the store
        const { store, unsubscribe: unsubscribeStore } = await getPreloadedStore(services);

        appMounted();

        // Call renderApp with params, services, and store
        const unmount = renderApp(params, services, store);

        return () => {
          appUnMounted();
          unmount();
          unsubscribeStore();
        };
      },
    });

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
        showInAllNavGroup: false,
      },
    ]);

    // TODO: Register embeddable factory when ready
    // this.registerEmbeddable(core, plugins);

    setupDeps.urlForwarding.forwardApp('doc', PLUGIN_ID, (path) => {
      return `#${path}`;
    });
    setupDeps.urlForwarding.forwardApp('context', PLUGIN_ID, (path) => {
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
    setupDeps.urlForwarding.forwardApp('discover', PLUGIN_ID, (path) => {
      const [, id, tail] = /discover\/([^\?]+)(.*)/.exec(path) || [];
      if (!id) {
        return `#${path.replace('/discover', '') || '/'}`;
      }
      return `#/view/${id}${tail || ''}`;
    });

    /* if (setupDeps.home) {
      registerFeature(setupDeps.home);
    } */

    return {
      docViews: {
        addDocView: (docViewSpec: unknown) => this.docViewsRegistry?.addDocView(docViewSpec as any),
      },
      docViewsLinks: {
        addDocViewLink: (docViewLinkSpec: unknown) =>
          this.docViewsLinksRegistry?.addDocViewLink(docViewLinkSpec as any),
      },
      visualizationRegistry: visualizationRegistryService,
    };
  }

  public start(core: CoreStart, plugins: ExploreStartDependencies): ExplorePluginStart {
    setUiActions(plugins.uiActions);

    this.initializeServices = () => {
      if (this.servicesInitialized) {
        return { core, plugins };
      }
      const services = buildServices(
        core,
        plugins,
        this.initializerContext,
        this.tabRegistry,
        this.visualizationRegistryService
      );
      setLegacyServices(services);
      this.servicesInitialized = true;

      return { core, plugins };
    };

    this.initializeServices();

    const savedExploreLoader = createSavedExploreLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns: plugins.data.indexPatterns,
      search: plugins.data.search,
      chrome: core.chrome,
      overlays: core.overlays,
    });

    return {
      urlGenerator: this.urlGenerator,
      savedSearchLoader: savedExploreLoader, // For backward compatibility
      savedExploreLoader,
      visualizationRegistry: this.visualizationRegistryService.start(),
    };
  }

  public stop() {
    if (this.stopUrlTracking) {
      this.stopUrlTracking();
    }
  }
}
