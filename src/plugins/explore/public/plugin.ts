/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import {
  App,
  AppMountParameters,
  AppUpdater,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  isNavGroupInFeatureConfigs,
  Plugin,
  PluginInitializerContext,
  ScopedHistory,
  WorkspaceAvailability,
} from '../../../core/public';
import {
  createOsdUrlStateStorage,
  createOsdUrlTracker,
  withNotifyOnErrors,
} from '../../opensearch_dashboards_utils/public';
import { ExploreFlavor, PLUGIN_ID, PLUGIN_NAME } from '../common';
import { ConfigSchema } from '../common/config';
import { generateDocViewsUrl } from './application/legacy/discover/application/components/doc_views/generate_doc_views_url';
import { DocViewsLinksRegistry } from './application/legacy/discover/application/doc_views_links/doc_views_links_registry';
import {
  setDocViewsLinksRegistry,
  setDocViewsRegistry,
  setServices as setLegacyServices,
  setUiActions,
  setExpressionLoader,
  setDashboard,
  setDashboardVersion,
} from './application/legacy/discover/opensearch_dashboards_services';
import { getPreloadedStore } from './application/utils/state_management/store';
import { buildServices } from './build_services';
import { DocViewTable } from './components/doc_viewer/doc_viewer_table/table';
import { JsonCodeBlock } from './components/doc_viewer/json_code_block/json_code_block';
import { TraceDetailsView } from './components/doc_viewer/trace_details_view/trace_details_view';
import {
  createQueryEditorExtensionConfig,
  SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY,
} from './components/experience_banners';
import { createSavedExploreLoader } from './saved_explore';
import { TabRegistryService } from './services/tab_registry/tab_registry_service';
import { setUsageCollector } from './services/usage_collector';
import { QueryPanelActionsRegistryService } from './services/query_panel_actions_registry';
import { VisualizationRegistryService } from './services/visualization_registry_service';
import {
  ExplorePluginSetup,
  ExplorePluginStart,
  ExploreSetupDependencies,
  ExploreStartDependencies,
} from './types';
import { DocViewsRegistry } from './types/doc_views_types';
import { ExploreEmbeddableFactory } from './embeddable';
import { SAVED_OBJECT_TYPE } from './saved_explore/_saved_explore';
import { DASHBOARD_ADD_PANEL_TRIGGER } from '../../dashboard/public';
import { createAbortDataQueryAction } from './application/utils/state_management/actions/abort_controller';
import { ABORT_DATA_QUERY_TRIGGER } from '../../ui_actions/public';
import { abortAllActiveQueries } from './application/utils/state_management/actions/query_actions';
import { setServices } from './services/services';

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
  private readonly DISCOVER_VISUALIZATION_NAME = 'DiscoverVisualization';

  /** discover */
  private docViewsRegistry: DocViewsRegistry | null = null;
  private docViewsLinksRegistry: DocViewsLinksRegistry | null = null;
  private servicesInitialized: boolean = false;
  private urlGenerator?: import('./types').ExplorePluginStart['urlGenerator'];
  private initializeServices?: () => { core: CoreStart; plugins: ExploreStartDependencies };

  // Registries
  private tabRegistry: TabRegistryService = new TabRegistryService();
  private visualizationRegistryService = new VisualizationRegistryService();
  private queryPanelActionsRegistryService = new QueryPanelActionsRegistryService();

  constructor(private readonly initializerContext: PluginInitializerContext<ConfigSchema>) {
    this.config = this.initializerContext.config.get();
  }

  public setup(
    core: CoreSetup<ExploreStartDependencies, ExplorePluginStart>,
    setupDeps: ExploreSetupDependencies
  ): ExplorePluginSetup {
    // Use setupDeps directly instead of destructuring to avoid unused variable warnings
    const visualizationRegistryService = this.visualizationRegistryService;

    this.docViewsRegistry = new DocViewsRegistry();
    setDocViewsRegistry(this.docViewsRegistry);
    this.docViewsLinksRegistry = new DocViewsLinksRegistry();
    setDocViewsLinksRegistry(this.docViewsLinksRegistry);

    this.docViewsRegistry.addDocView({
      title: i18n.translate('explore.docViews.table.tableTitle', {
        defaultMessage: 'Table',
      }),
      order: 10,
      component: DocViewTable,
    });

    this.docViewsRegistry.addDocView({
      title: i18n.translate('explore.docViews.json.jsonTitle', {
        defaultMessage: 'JSON',
      }),
      order: 20,
      component: JsonCodeBlock,
    });

    this.docViewsRegistry.addDocView({
      title: i18n.translate('explore.docViews.trace.traceTitle', {
        defaultMessage: 'Trace',
      }),
      order: 30,
      component: TraceDetailsView,
    });

    this.docViewsLinksRegistry.addDocViewLink({
      order: 10,
      label: i18n.translate('explore.docTable.tableRow.viewSingleDocumentLinkTextSimple', {
        defaultMessage: 'View single document',
      }),
      generateCb: (renderProps: any) => ({ url: generateDocViewsUrl(renderProps) }),
      href: '#',
    });

    if (setupDeps.usageCollection) {
      setUsageCollector(setupDeps.usageCollection);
    }

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
        queryEditorExtension: createQueryEditorExtensionConfig(core as any),
      },
    });

    const createExploreApp = (flavor?: ExploreFlavor, options: Partial<App> = {}): App => ({
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
        const isExploreEnabledWorkspace = await this.getIsExploreEnabledWorkspace(coreStart);
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

        // If there's no flavor id, by default redirect to the logs flavor.
        if (!flavor) {
          coreStart.application.navigateToApp(`${PLUGIN_ID}/${ExploreFlavor.Logs}`, {
            path: '#/',
            replace: true,
          });
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
          this.visualizationRegistryService,
          this.queryPanelActionsRegistryService
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
        registerTabs(services, flavor);

        // Instantiate the store
        const { store, unsubscribe: unsubscribeStore, reset: resetStore } = await getPreloadedStore(
          services
        );
        services.store = store;

        // Register abort action
        const abortActionId = `${PLUGIN_ID}`;
        const abortAction = createAbortDataQueryAction(abortActionId);
        services.uiActions.addTriggerAction(ABORT_DATA_QUERY_TRIGGER, abortAction);
        setServices(services);

        appMounted();

        // Call renderApp with params, services, and store
        const unmount = renderApp(params, services, store, flavor);

        return () => {
          abortAllActiveQueries();
          services.uiActions.detachAction(ABORT_DATA_QUERY_TRIGGER, abortActionId);
          appUnMounted();
          unmount();
          unsubscribeStore();
          resetStore();
        };
      },
      ...options,
    });

    // Register applications into the side navigation menu
    core.application.register(
      createExploreApp(ExploreFlavor.Logs, {
        id: `${PLUGIN_ID}/${ExploreFlavor.Logs}`,
        title: 'Logs',
      })
    );
    core.application.register(
      createExploreApp(ExploreFlavor.Traces, {
        id: `${PLUGIN_ID}/${ExploreFlavor.Traces}`,
        title: 'Traces',
      })
    );
    core.application.register(
      createExploreApp(ExploreFlavor.Metrics, {
        id: `${PLUGIN_ID}/${ExploreFlavor.Metrics}`,
        title: 'Metrics',
      })
    );
    core.application.register(createExploreApp());

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
      },
      {
        id: `${PLUGIN_ID}/${ExploreFlavor.Logs}`,
        category: undefined,
        order: 300,
        parentNavLinkId: PLUGIN_ID,
      },
      {
        id: `${PLUGIN_ID}/${ExploreFlavor.Traces}`,
        category: undefined,
        order: 300,
        parentNavLinkId: PLUGIN_ID,
      },
      // uncomment when metrics is ready for launch
      /*
      {
        id: `${PLUGIN_ID}/${ExploreFlavor.Metrics}`,
        category: undefined,
        order: 300,
        parentNavLinkId: PLUGIN_ID,
      }, */
    ]);
    this.registerEmbeddable(core as any, setupDeps);

    setupDeps.urlForwarding.forwardApp('doc', PLUGIN_ID, (path: string) => {
      return `#${path}`;
    });
    setupDeps.urlForwarding.forwardApp('context', PLUGIN_ID, (path: string) => {
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
    setupDeps.urlForwarding.forwardApp('discover', PLUGIN_ID, (path: string) => {
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
      visualizationRegistry: visualizationRegistryService.setup(),
      queryPanelActionsRegistry: this.queryPanelActionsRegistryService.setup(),
    };
  }

  public start(core: CoreStart, plugins: ExploreStartDependencies): ExplorePluginStart {
    setUiActions(plugins.uiActions);
    setDashboard(plugins.dashboard);
    const opensearchDashboardsVersion = this.initializerContext.env.packageInfo.version;
    setDashboardVersion({ version: opensearchDashboardsVersion });

    if (plugins.expressions) {
      setExpressionLoader(plugins.expressions.ExpressionLoader);
    }

    this.initializeServices = () => {
      if (this.servicesInitialized) {
        return { core, plugins };
      }
      const services = buildServices(
        core,
        plugins,
        this.initializerContext,
        this.tabRegistry,
        this.visualizationRegistryService,
        this.queryPanelActionsRegistryService
      );
      setLegacyServices({
        ...services,
        visualizationRegistry: this.visualizationRegistryService,
      });
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

  private registerEmbeddable(
    core: CoreSetup<ExploreStartDependencies>,
    plugins: ExploreSetupDependencies
  ) {
    const getStartServices = async () => {
      const [coreStart, deps] = await core.getStartServices();
      return {
        executeTriggerActions: deps.uiActions.executeTriggerActions,
        isEditable: () => coreStart.application.capabilities.discover?.save as boolean,
      };
    };

    const factory = new ExploreEmbeddableFactory(
      getStartServices,
      this.visualizationRegistryService
    );
    plugins.embeddable.registerEmbeddableFactory(factory.type, factory);
  }

  private async registerExploreVisualization(
    core: CoreSetup<ExploreStartDependencies, ExplorePluginStart>,
    setupDeps: ExploreSetupDependencies
  ) {
    const exploreVisDisplayName = i18n.translate('explore.visualization.title', {
      defaultMessage: 'Visualize with Discover',
    });
    // Register explore visualization as visualization alias
    setupDeps.visualizations.registerAlias({
      name: this.DISCOVER_VISUALIZATION_NAME,
      aliasPath: '#/',
      aliasApp: PLUGIN_ID,
      title: exploreVisDisplayName,
      description: i18n.translate('explore.visualization.description', {
        defaultMessage: 'Create visualization with Discover',
      }),
      icon: 'visualizeApp',
      stage: 'production',
      promotion: {
        buttonText: exploreVisDisplayName,
        description: 'Build query-powered visualizations',
      },
      appExtensions: {
        visualizations: {
          docTypes: [SAVED_OBJECT_TYPE],
          toListItem: ({ id, attributes, updated_at: updatedAt }: any) => {
            let iconType = '';
            let chartName = '';
            try {
              const vis = JSON.parse(attributes.visualization as string);
              const chart = this.visualizationRegistryService
                .getRegistry()
                .getAvailableChartTypes()
                .find((t) => t.type === vis.chartType);
              if (chart) {
                iconType = chart.icon;
                chartName = chart.name;
              }
            } catch (e) {
              iconType = '';
            }
            return {
              description: `${attributes?.description || ''}`,
              // TODO: it should navigate to different explore flavor based on the `attributes.type`
              editApp: `${PLUGIN_ID}/${ExploreFlavor.Logs}`,
              editUrl: `#/view/${encodeURIComponent(id)}`,
              icon: iconType,
              id,
              savedObjectType: SAVED_OBJECT_TYPE,
              title: `${attributes?.title || ''}`,
              typeTitle: chartName,
              updated_at: updatedAt,
              stage: 'production',
            };
          },
        },
      },
    });

    const [coreStart, pluginsStart] = await core.getStartServices();
    const isExploreEnabledWorkspace = await this.getIsExploreEnabledWorkspace(coreStart);
    if (isExploreEnabledWorkspace) {
      const dashboardVisActions = pluginsStart.uiActions.getTriggerActions(
        DASHBOARD_ADD_PANEL_TRIGGER
      );
      const visTypes = pluginsStart.visualizations.all();
      const aliasTypes = pluginsStart.visualizations.getAliases();
      const allVisTypes = [...visTypes, ...aliasTypes];
      dashboardVisActions.forEach((action: any) => {
        const visOfAction = allVisTypes.find((vis) => action.id === `add_vis_action_${vis.name}`);
        if (visOfAction && visOfAction.isClassic) {
          action.grouping?.push({
            id: 'others',
            getDisplayName: () => 'More',
            getIconType: () => 'boxesHorizontal',
          });
        }
      });
    } else {
      const registeredVisAlias = pluginsStart.visualizations
        .getAliases()
        .find((v: any) => v.name === this.DISCOVER_VISUALIZATION_NAME);

      // if current workspace has NO explore enabled, the explore visualization ingress should be hidden
      if (registeredVisAlias) {
        // Do not display it in the create vis modal
        registeredVisAlias.hidden = true;
      }
    }
  }

  private async getIsExploreEnabledWorkspace(core: CoreStart) {
    const features = await core.workspaces.currentWorkspace$
      .pipe(take(1))
      .toPromise()
      .then((workspace) => workspace?.features);
    return (
      (features && isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features)) ??
      false
    );
  }
}
