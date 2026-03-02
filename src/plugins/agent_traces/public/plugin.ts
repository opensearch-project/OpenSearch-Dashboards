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
  AppNavLinkStatus,
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
import { AgentTracesFlavor, PLUGIN_ID, PLUGIN_NAME } from '../common';
import {
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
import { createSavedAgentTracesLoader } from './saved_agent_traces';
import { TabRegistryService } from './services/tab_registry/tab_registry_service';
import { setUsageCollector } from './services/usage_collector';
import { QueryPanelActionsRegistryService } from './services/query_panel_actions_registry';
import {
  AgentTracesPluginSetup,
  AgentTracesPluginStart,
  AgentTracesSetupDependencies,
  AgentTracesStartDependencies,
} from './types';
import { DocViewsRegistry } from './types/doc_views_types';
import { AgentTracesEmbeddableFactory } from './embeddable';
import { createAbortDataQueryAction } from './application/utils/state_management/actions/abort_controller';
import { ABORT_DATA_QUERY_TRIGGER } from '../../ui_actions/public';
import { abortAllActiveQueries } from './application/utils/state_management/actions/query_actions';
import { setServices } from './services/services';
import { SlotRegistryService } from './services/slot_registry';

// Log Actions
import { logActionRegistry } from './services/log_action_registry';
import { createAskAiAction } from './actions/ask_ai_action';
import { importDataActionConfig } from './actions/import_data_action';

export class AgentTracesPlugin
  implements
    Plugin<
      AgentTracesPluginSetup,
      AgentTracesPluginStart,
      AgentTracesSetupDependencies,
      AgentTracesStartDependencies
    > {
  private stateUpdaterByApp: Partial<
    Record<AgentTracesFlavor | 'agentTraces', BehaviorSubject<AppUpdater>>
  > = {
    agentTraces: new BehaviorSubject<AppUpdater>(() => ({})),
  };

  private stopUrlTrackingCallbackByApp: Partial<
    Record<AgentTracesFlavor | 'agentTraces', () => void>
  > = {};
  private currentHistory?: ScopedHistory;

  /** discover */
  private docViewsRegistry: DocViewsRegistry | null = null;
  private servicesInitialized: boolean = false;
  private urlGenerator?: import('./types').AgentTracesPluginStart['urlGenerator'];
  private initializeServices?: () => {
    core: CoreStart;
    plugins: AgentTracesStartDependencies;
  };
  private isDatasetManagementEnabled: boolean = false;
  private dataImporterConfig?: import('./types').AgentTracesServices['dataImporterConfig'];
  private dataSourceEnabled: boolean = false;
  private hideLocalCluster: boolean = false;
  private dataSourceManagement?: import('./types').AgentTracesServices['dataSourceManagement'];

  // Registries
  private tabRegistry: TabRegistryService = new TabRegistryService();
  private queryPanelActionsRegistryService = new QueryPanelActionsRegistryService();
  private slotRegistryService = new SlotRegistryService();

  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup<AgentTracesStartDependencies, AgentTracesPluginStart>,
    setupDeps: AgentTracesSetupDependencies
  ): AgentTracesPluginSetup {
    // Check if dataset management plugin is enabled
    this.isDatasetManagementEnabled = !!setupDeps.datasetManagement;

    // Store data importer config if available
    this.dataImporterConfig = setupDeps.dataImporter?.config;

    // Store data source configuration
    this.dataSourceEnabled = !!setupDeps.dataSource;
    this.hideLocalCluster = setupDeps.dataSource?.hideLocalCluster || false;
    this.dataSourceManagement = setupDeps.dataSourceManagement;

    // Set usage collector
    setUsageCollector(setupDeps.usageCollection);

    // Setup query panel actions registry
    const queryPanelActionsRegistry = this.queryPanelActionsRegistryService.setup();

    // Register import data action if data importer is available
    if (this.dataImporterConfig) {
      queryPanelActionsRegistry.register(importDataActionConfig);
    }

    this.docViewsRegistry = new DocViewsRegistry();
    setDocViewsRegistry(this.docViewsRegistry);

    this.docViewsRegistry.addDocView({
      title: i18n.translate('agentTraces.discover.docViews.table.tableTitle', {
        defaultMessage: 'Table',
      }),
      order: 10,
      component: DocViewTable,
    });

    this.docViewsRegistry.addDocView({
      title: i18n.translate('agentTraces.discover.docViews.json.jsonTitle', {
        defaultMessage: 'JSON',
      }),
      order: 20,
      component: JsonCodeBlock,
    });
    const createAgentTracesApp = (options: Partial<App> = {}): App => {
      const appStateUpdater = this.stateUpdaterByApp.agentTraces as BehaviorSubject<AppUpdater>;

      const { appMounted, appUnMounted, stop: stopUrlTracker } = createOsdUrlTracker({
        baseUrl: core.http.basePath.prepend(`/app/${PLUGIN_ID}`),
        defaultSubUrl: '#/',
        storageKey: `lastUrl:${core.http.basePath.get()}:${PLUGIN_ID}`,
        navLinkUpdater$: appStateUpdater,
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
              }))
            ),
          },
        ],
        getHistory: () => {
          return this.currentHistory!;
        },
      });
      this.stopUrlTrackingCallbackByApp.agentTraces = stopUrlTracker;

      return {
        id: PLUGIN_ID,
        title: PLUGIN_NAME,
        updater$: appStateUpdater.asObservable(),
        order: 1000,
        workspaceAvailability: WorkspaceAvailability.insideWorkspace,
        euiIconType: 'inputOutput',
        defaultPath: '#/',
        category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
        mount: async (params: AppMountParameters) => {
          if (!this.initializeServices) {
            throw Error('Agent Traces plugin method initializeServices is undefined');
          }

          // Get start services
          const { core: coreStart, plugins: pluginsStart } = await this.initializeServices();
          const isAgentTracesEnabledWorkspace = await this.getIsAgentTracesEnabledWorkspace(
            coreStart
          );

          // Only show in observability-enabled workspaces
          if (!isAgentTracesEnabledWorkspace) {
            coreStart.application.navigateToApp('discover', { replace: true });
            return () => {};
          }

          this.currentHistory = params.history;

          // make sure the index pattern list is up to date
          pluginsStart.data.indexPatterns.clearCache();

          // For main routes, load the full application
          const { renderApp } = await import('./application');
          const { registerTabs } = await import('./application/register_tabs');

          // Build services
          const services = buildServices(
            coreStart,
            pluginsStart,
            this.initializerContext,
            this.tabRegistry,
            this.queryPanelActionsRegistryService,
            this.isDatasetManagementEnabled,
            this.slotRegistryService,
            this.dataImporterConfig,
            this.dataSourceEnabled,
            this.hideLocalCluster,
            this.dataSourceManagement
          );

          // Add osdUrlStateStorage to services
          services.osdUrlStateStorage = createOsdUrlStateStorage({
            history: this.currentHistory,
            useHash: coreStart.uiSettings.get('state:storeInSessionStorage'),
            ...withNotifyOnErrors(coreStart.notifications.toasts),
          });

          // Add scopedHistory to services
          services.scopedHistory = this.currentHistory;

          // Register tabs (always Traces for Agent Traces)
          registerTabs(services);

          // Instantiate the store
          const {
            store,
            unsubscribe: unsubscribeStore,
            reset: resetStore,
          } = await getPreloadedStore(services);
          services.store = store;

          // Register abort action
          const abortActionId = `${PLUGIN_ID}`;
          const abortAction = createAbortDataQueryAction(abortActionId);
          services.uiActions.addTriggerAction(ABORT_DATA_QUERY_TRIGGER, abortAction);
          setServices(services);

          appMounted();

          // Call renderApp with params, services, and store
          const unmount = renderApp(params, services, store);

          return () => {
            abortAllActiveQueries();
            services.uiActions.detachAction(ABORT_DATA_QUERY_TRIGGER, abortActionId);
            appUnMounted();
            unmount();
            unsubscribeStore();
            resetStore();
            pluginsStart.data.query.queryString.clearQuery();
          };
        },
        ...options,
      };
    };

    // Register single Agent Traces application
    core.application.register(createAgentTracesApp());

    // Register nav link - single entry
    const navLinks = [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
      },
    ];

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, navLinks);
    this.registerEmbeddable(core, setupDeps);

    return {
      docViews: {
        addDocView: (docViewSpec: unknown) => this.docViewsRegistry?.addDocView(docViewSpec as any),
      },
      queryPanelActionsRegistry,
      logActionRegistry: {
        registerAction: (action) => logActionRegistry.registerAction(action),
      },
    };
  }

  public start(core: CoreStart, plugins: AgentTracesStartDependencies): AgentTracesPluginStart {
    setUiActions(plugins.uiActions);
    setDashboard(plugins.dashboard);
    const opensearchDashboardsVersion = this.initializerContext.env.packageInfo.version;
    setDashboardVersion({ version: opensearchDashboardsVersion });

    if (plugins.expressions) {
      setExpressionLoader(plugins.expressions.ExpressionLoader);
    }

    // Update Agent Traces nav link visibility based on dynamic capabilities
    const capabilities = core.application.capabilities;
    if (this.stateUpdaterByApp.agentTraces) {
      this.stateUpdaterByApp.agentTraces.next((app) => {
        if (app.id === PLUGIN_ID) {
          return {
            navLinkStatus: capabilities.agentTraces?.agentTracesEnabled
              ? AppNavLinkStatus.visible
              : AppNavLinkStatus.hidden,
          };
        }
        return {};
      });
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
        this.queryPanelActionsRegistryService,
        this.isDatasetManagementEnabled,
        this.slotRegistryService,
        this.dataImporterConfig,
        this.dataSourceEnabled,
        this.hideLocalCluster,
        this.dataSourceManagement
      );
      setLegacyServices(services);
      this.servicesInitialized = true;

      return { core, plugins };
    };

    this.initializeServices();

    // Register Log Actions
    // Always register Ask AI action - let isCompatible handle enablement logic
    const askAiAction = createAskAiAction(core.chat);
    logActionRegistry.registerAction(askAiAction);

    const savedAgentTracesLoader = createSavedAgentTracesLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns: plugins.data.indexPatterns,
      search: plugins.data.search,
      chrome: core.chrome,
      overlays: core.overlays,
    });

    return {
      urlGenerator: this.urlGenerator,
      savedSearchLoader: savedAgentTracesLoader, // For backward compatibility
      savedAgentTracesLoader,
      slotRegistry: this.slotRegistryService.start(),
    };
  }

  public stop() {
    Object.values(this.stopUrlTrackingCallbackByApp).forEach((callback) => callback());
  }

  private registerEmbeddable(
    core: CoreSetup<AgentTracesStartDependencies>,
    plugins: AgentTracesSetupDependencies
  ) {
    const getStartServices = async () => {
      const [coreStart, deps] = await core.getStartServices();
      return {
        executeTriggerActions: deps.uiActions.executeTriggerActions,
        isEditable: () => coreStart.application.capabilities.discover?.save as boolean,
      };
    };

    const factory = new AgentTracesEmbeddableFactory(getStartServices);
    plugins.embeddable.registerEmbeddableFactory(factory.type, factory);
  }

  private async getIsAgentTracesEnabledWorkspace(core: CoreStart) {
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
