/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { History } from 'history';
import {
  Capabilities,
  ChromeStart,
  CoreStart,
  DocLinksStart,
  ToastsStart,
  IUiSettingsClient,
  KeyboardShortcutStart,
} from 'opensearch-dashboards/public';
import { ChartsPluginStart } from 'src/plugins/charts/public';
import {
  DataPublicPluginSetup,
  DataPublicPluginStart,
  DataViewsContract,
  IndexPatternsContract,
  FilterManager,
  TimefilterContract,
} from 'src/plugins/data/public';
import { EmbeddableSetup, EmbeddableStart } from 'src/plugins/embeddable/public';
import { DashboardSetup, DashboardStart } from 'src/plugins/dashboard/public';
import { HomePublicPluginSetup } from 'src/plugins/home/public';
import { RequestAdapter, Start as InspectorPublicPluginStart } from 'src/plugins/inspector/public';
import {
  OpenSearchDashboardsLegacySetup,
  OpenSearchDashboardsLegacyStart,
} from 'src/plugins/opensearch_dashboards_legacy/public';
import { SharePluginSetup, SharePluginStart, UrlGeneratorContract } from 'src/plugins/share/public';
import { UiActionsSetup, UiActionsStart } from 'src/plugins/ui_actions/public';
import { UrlForwardingSetup, UrlForwardingStart } from 'src/plugins/url_forwarding/public';
import { VisualizationsSetup, VisualizationsStart } from 'src/plugins/visualizations/public';
import { UsageCollectionSetup } from 'src/plugins/usage_collection/public';
import { ExpressionsPublicPlugin, ExpressionsStart } from 'src/plugins/expressions/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../navigation/public';
import { ContextProviderStart } from '../../context_provider/public';
import { DatasetManagementSetup } from '../../dataset_management/public';
import { DataImporterPluginSetup } from '../../data_importer/public';
import { DataSourcePluginSetup } from '../../data_source/public';
import { DataSourceManagementPluginSetup } from '../../data_source_management/public';
import { Storage, IOsdUrlStateStorage } from '../../opensearch_dashboards_utils/public';
import { ScopedHistory } from '../../../core/public';
import { SavedAgentTracesLoader, SavedAgentTraces } from './saved_agent_traces';
import { TabRegistryService } from './services/tab_registry/tab_registry_service';

import { AppStore } from './application/utils/state_management/store';
import {
  QueryPanelActionsRegistryService,
  QueryPanelActionsRegistryServiceSetup,
} from './services/query_panel_actions_registry';
import { SlotRegistryService, SlotRegistryServiceStart } from './services/slot_registry';

// ============================================================================
// PLUGIN INTERFACES - What Agent Traces provides to other plugins
// ============================================================================

export interface AgentTracesPluginSetup {
  queryPanelActionsRegistry: QueryPanelActionsRegistryServiceSetup;
  logActionRegistry: {
    registerAction: (action: import('./types/log_actions').LogActionDefinition) => void;
  };
  docViews: {
    addDocView: (docViewSpec: unknown) => void;
  };
}

export interface AgentTracesPluginStart {
  urlGenerator?: UrlGeneratorContract<'AGENT_TRACES_APP_URL_GENERATOR'>;
  savedSearchLoader: SavedAgentTracesLoader;
  savedAgentTracesLoader: SavedAgentTracesLoader;
  slotRegistry: SlotRegistryServiceStart;
}

// ============================================================================
// PLUGIN DEPENDENCIES - What Agent Traces needs from other plugins
// ============================================================================

/**
 * @internal
 */
export interface AgentTracesSetupDependencies {
  navigation: NavigationStart;
  share?: SharePluginSetup;
  uiActions: UiActionsSetup;
  embeddable: EmbeddableSetup;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacySetup;
  urlForwarding: UrlForwardingSetup;
  home?: HomePublicPluginSetup;
  contextProvider?: ContextProviderStart;
  visualizations: VisualizationsSetup;
  data: DataPublicPluginSetup;
  usageCollection: UsageCollectionSetup;
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  dashboard: DashboardSetup;
  datasetManagement?: DatasetManagementSetup;
  dataImporter?: DataImporterPluginSetup;
  dataSource?: DataSourcePluginSetup;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

/**
 * @internal
 */
export interface AgentTracesStartDependencies {
  uiActions: UiActionsStart;
  embeddable: EmbeddableStart;
  navigation: NavigationStart;
  charts: ChartsPluginStart;
  data: DataPublicPluginStart;
  share?: SharePluginStart;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacyStart;
  urlForwarding: UrlForwardingStart;
  inspector: InspectorPublicPluginStart;
  visualizations: VisualizationsStart;
  expressions: ExpressionsStart;
  dashboard: DashboardStart;
  contextProvider?: ContextProviderStart;
}

// ============================================================================
// INTERNAL SERVICES - For Agent Traces's internal components
// ============================================================================

/**
 * Services interface for the Agent Traces plugin's internal components
 * Based on DiscoverViewServices (DiscoverServices & DataExplorerServices) plus Agent Traces-specific services
 * Since Explore incorporates DataExplorer functionality directly, it needs all DataExplorer services
 */
export interface AgentTracesServices {
  // From DiscoverServices
  addBasePath: (path: string) => string;
  capabilities: Capabilities;
  chrome: ChromeStart;
  core: CoreStart;
  data: DataPublicPluginStart;
  docLinks: DocLinksStart;
  history: () => History;
  theme: ChartsPluginStart['theme'];
  filterManager: FilterManager;
  dataViews: DataViewsContract;
  indexPatterns: IndexPatternsContract;
  inspector: InspectorPublicPluginStart;
  inspectorAdapters: {
    requests: RequestAdapter;
  };
  metadata: { branch: string };
  navigation: NavigationStart;
  share?: SharePluginStart;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacyStart;
  urlForwarding: UrlForwardingStart;
  timefilter: TimefilterContract;
  toastNotifications: ToastsStart;
  getSavedAgentTracesById: (id?: string) => Promise<SavedAgentTraces>;
  getSavedAgentTracesUrlById: (id: string) => Promise<string>;
  uiSettings: IUiSettingsClient;
  visualizations: VisualizationsStart;
  storage: Storage;
  uiActions: UiActionsStart;
  appName: string;

  // Additional CoreStart properties that are accessed directly
  savedObjects: CoreStart['savedObjects'];
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  overlays: CoreStart['overlays'];

  // From DataExplorerServices (since Explore incorporates DataExplorer functionality)
  store: AppStore; // Redux store
  viewRegistry?: Record<string, unknown>; // ViewServiceStart - will be replaced with tabRegistry
  embeddable: EmbeddableStart; // EmbeddableStart
  scopedHistory?: ScopedHistory; // ScopedHistory
  osdUrlStateStorage?: IOsdUrlStateStorage; // IOsdUrlStateStorage

  // Agent Traces-specific services
  tabRegistry: TabRegistryService;
  queryPanelActionsRegistry: QueryPanelActionsRegistryService;
  slotRegistry?: SlotRegistryService;
  expressions: ExpressionsStart;
  contextProvider?: ContextProviderStart;

  dashboard: DashboardStart;
  keyboardShortcut?: KeyboardShortcutStart;

  supportedTypes?: string[];
  isDatasetManagementEnabled: boolean;
  dataImporterConfig?: DataImporterPluginSetup['config'];
  dataSourceEnabled: boolean;
  hideLocalCluster: boolean;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}
