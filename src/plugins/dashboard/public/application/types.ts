/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { History } from 'history';
import {
  ChromeStart,
  IUiSettingsClient,
  CoreStart,
  SavedObjectsClientContract,
  PluginInitializerContext,
  ScopedHistory,
  AppMountParameters,
} from 'opensearch-dashboards/public';
import { UsageCollectionSetup } from 'src/plugins/usage_collection/public';
import { DashboardProvider } from '../types';
import { IOsdUrlStateStorage, Storage } from '../../../opensearch_dashboards_utils/public';
// @ts-ignore
import { initDashboardApp } from './legacy_app';
import { EmbeddableStart } from '../../../embeddable/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../../navigation/public';
import { DataPublicPluginStart } from '../../../data/public';
import { SharePluginStart } from '../../../share/public';
import { OpenSearchDashboardsLegacyStart } from '../../../opensearch_dashboards_legacy/public';
import { UrlForwardingStart } from '../../../url_forwarding/public';
import { SavedObjectLoader, SavedObjectsStart } from '../../../saved_objects/public';

export interface DashboardServices extends CoreStart {
  pluginInitializerContext: PluginInitializerContext;
  history: History;
  osdUrlStateStorage: IOsdUrlStateStorage;
  core: CoreStart;
  data: DataPublicPluginStart;
  navigation: NavigationStart;
  savedObjectsClient: SavedObjectsClientContract;
  savedDashboards: SavedObjectLoader;
  dashboardProviders: () => { [key: string]: DashboardProvider };
  dashboardConfig: OpenSearchDashboardsLegacyStart['dashboardConfig'];
  dashboardCapabilities: any;
  embeddableCapabilities: {
    visualizeCapabilities: any;
    mapsCapabilities: any;
  };
  uiSettings: IUiSettingsClient;
  chrome: ChromeStart;
  savedQueryService: DataPublicPluginStart['query']['savedQueries'];
  embeddable: EmbeddableStart;
  localStorage: Storage;
  share?: SharePluginStart;
  usageCollection?: UsageCollectionSetup;
  navigateToDefaultApp: UrlForwardingStart['navigateToDefaultApp'];
  navigateToLegacyOpenSearchDashboardsUrl: UrlForwardingStart['navigateToLegacyOpenSearchDashboardsUrl'];
  scopedHistory: () => ScopedHistory;
  setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  savedObjectsPublic: SavedObjectsStart;
  restorePreviousUrl: () => void;
  addBasePath?: (url: string) => string;
}
