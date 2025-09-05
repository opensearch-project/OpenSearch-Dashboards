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
import { Storage, IOsdUrlStateStorage } from '../../opensearch_dashboards_utils/public';
import { ScopedHistory } from '../../../core/public';
import { SavedExploreLoader, SavedExplore } from './saved_explore';
import { TabRegistryService } from './services/tab_registry/tab_registry_service';

import {
  VisualizationRegistryService,
  VisualizationRegistryServiceSetup,
  VisualizationRegistryServiceStart,
} from './services/visualization_registry_service';
import { AppStore } from './application/utils/state_management/store';
import {
  QueryPanelActionsRegistryService,
  QueryPanelActionsRegistryServiceSetup,
} from './services/query_panel_actions_registry';

// Context Provider Integration
import { ExploreContextContributor } from './context_contributor';

// ============================================================================
// PLUGIN INTERFACES - What Explore provides to other plugins
// ============================================================================

export interface ExplorePluginSetup {
  visualizationRegistry: VisualizationRegistryServiceSetup;
  queryPanelActionsRegistry: QueryPanelActionsRegistryServiceSetup;
  docViews: {
    addDocView: (docViewSpec: unknown) => void;
  };
  docViewsLinks: {
    addDocViewLink: (docViewLinkSpec: unknown) => void;
  };
}

export interface ExplorePluginStart {
  visualizationRegistry: VisualizationRegistryServiceStart;
  urlGenerator?: UrlGeneratorContract<'EXPLORE_APP_URL_GENERATOR'>;
  savedSearchLoader: SavedExploreLoader;
  savedExploreLoader: SavedExploreLoader;
  // Context Provider Integration
  getContextContributor(): ExploreContextContributor | null;
}

// ============================================================================
// PLUGIN DEPENDENCIES - What Explore needs from other plugins
// ============================================================================

/**
 * @internal
 */
export interface ExploreSetupDependencies {
  navigation: NavigationStart;
  share?: SharePluginSetup;
  uiActions: UiActionsSetup;
  embeddable: EmbeddableSetup;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacySetup;
  urlForwarding: UrlForwardingSetup;
  home?: HomePublicPluginSetup;
  visualizations: VisualizationsSetup;
  data: DataPublicPluginSetup;
  usageCollection: UsageCollectionSetup;
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  dashboard: DashboardSetup;
  // Context Provider Integration
  contextProvider?: any;
}

/**
 * @internal
 */
export interface ExploreStartDependencies {
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
  // Context Provider Integration
  contextProvider?: any;
}

// ============================================================================
// INTERNAL SERVICES - For Explore's internal components
// ============================================================================

/**
 * Services interface for the Explore plugin's internal components
 * Based on DiscoverViewServices (DiscoverServices & DataExplorerServices) plus Explore-specific services
 * Since Explore incorporates DataExplorer functionality directly, it needs all DataExplorer services
 */
export interface ExploreServices {
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
  getSavedExploreById: (id?: string) => Promise<SavedExplore>;
  getSavedExploreUrlById: (id: string) => Promise<string>;
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

  // Explore-specific services
  tabRegistry: TabRegistryService;
  visualizationRegistry: VisualizationRegistryService;
  queryPanelActionsRegistry: QueryPanelActionsRegistryService;
  expressions: ExpressionsStart;

  dashboard: DashboardStart;
  keyboardShortcut?: KeyboardShortcutStart;

  supportedTypes?: string[];
}
