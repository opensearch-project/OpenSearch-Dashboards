/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart, PluginInitializerContext } from 'opensearch-dashboards/public';
import { SavedObjectOpenSearchDashboardsServices } from 'src/plugins/saved_objects/public';
import { Storage } from '../../opensearch_dashboards_utils/public';
import { RequestAdapter } from '../../inspector/public';

import { ExploreStartDependencies, ExploreServices } from './types';
import { createSavedExploreLoader } from './saved_explore';
import { getHistory } from './application/legacy/discover/opensearch_dashboards_services';
import { TabRegistryService } from './services/tab_registry/tab_registry_service';
import { VisualizationRegistryService } from './services/visualization_registry_service';

export function buildServices(
  core: CoreStart,
  plugins: ExploreStartDependencies,
  context: PluginInitializerContext,
  tabRegistry: TabRegistryService,
  visualizationRegistry: VisualizationRegistryService
): ExploreServices {
  const services: SavedObjectOpenSearchDashboardsServices = {
    savedObjectsClient: core.savedObjects.client,
    indexPatterns: plugins.data.indexPatterns,
    search: plugins.data.search,
    chrome: core.chrome,
    overlays: core.overlays,
  };
  const savedObjectService = createSavedExploreLoader(services);
  const storage = new Storage(localStorage);

  return {
    addBasePath: core.http.basePath.prepend,
    appName: 'explore',
    capabilities: core.application.capabilities,
    chrome: core.chrome,
    core,
    data: plugins.data,
    docLinks: core.docLinks,
    theme: plugins.charts.theme,
    filterManager: plugins.data.query.filterManager,
    indexPatterns: plugins.data.indexPatterns, // Direct access for convenience
    getSavedExploreById: async (id?: string) => {
      return savedObjectService.get(id);
    },
    getSavedExploreUrlById: async (id: string) => savedObjectService.urlFor(id),
    history: getHistory,
    inspector: plugins.inspector,
    inspectorAdapters: {
      requests: new RequestAdapter(),
    },
    metadata: {
      branch: context.env.packageInfo.branch, // From discover - used for version info
    },
    navigation: plugins.navigation,
    share: plugins.share,
    opensearchDashboardsLegacy: plugins.opensearchDashboardsLegacy,
    urlForwarding: plugins.urlForwarding,
    timefilter: plugins.data.query.timefilter.timefilter,
    toastNotifications: core.notifications.toasts,
    uiSettings: core.uiSettings,
    visualizations: plugins.visualizations,
    storage,
    uiActions: plugins.uiActions,

    // Additional CoreStart properties that are accessed directly
    savedObjects: core.savedObjects,
    notifications: core.notifications,
    http: core.http,
    overlays: core.overlays,

    // From DataExplorerServices (since Explore incorporates DataExplorer functionality)
    store: undefined, // Will be set by the store
    viewRegistry: undefined, // Will be replaced with tabRegistry
    embeddable: plugins.embeddable,
    scopedHistory: undefined, // Will be set by the app
    osdUrlStateStorage: undefined, // Will be set by the app

    // Explore-specific services
    tabRegistry,
    visualizationRegistry,
    expressions: plugins.expressions,
  };
}
