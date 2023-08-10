/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Query, Filter, DataPublicPluginStart } from 'src/plugins/data/public';
import {
  SavedObject as SavedObjectType,
  SavedObjectAttributes,
  CoreStart,
  PluginInitializerContext,
  SavedObjectsClientContract,
  IUiSettingsClient,
  ChromeStart,
  ScopedHistory,
  AppMountParameters,
  ToastsStart,
} from 'src/core/public';
import {
  IOsdUrlStateStorage,
  ReduxLikeStateContainer,
  Storage,
} from 'src/plugins/opensearch_dashboards_utils/public';
import { SavedObjectLoader, SavedObjectsStart } from 'src/plugins/saved_objects/public';
import { OpenSearchDashboardsLegacyStart } from 'src/plugins/opensearch_dashboards_legacy/public';
import { SharePluginStart } from 'src/plugins/share/public';
import { UsageCollectionSetup } from 'src/plugins/usage_collection/public';
import { UrlForwardingStart } from 'src/plugins/url_forwarding/public';
import { History } from 'history';
import { EmbeddableStart, ViewMode } from '../../embeddable/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../navigation/public';
import { SavedDashboardPanel730ToLatest } from '../common';

export interface DashboardCapabilities {
  showWriteControls: boolean;
  createNew: boolean;
  showSavedQuery: boolean;
  saveQuery: boolean;
  createShortUrl: boolean;
}

// TODO: Replace Saved object interfaces by the ones Core will provide when it is ready.
export type SavedObjectAttribute =
  | string
  | number
  | boolean
  | null
  | undefined
  | SavedObjectAttributes
  | SavedObjectAttributes[];

export interface SimpleSavedObject<T extends SavedObjectAttributes> {
  attributes: T;
  _version?: SavedObjectType<T>['version'];
  id: SavedObjectType<T>['id'];
  type: SavedObjectType<T>['type'];
  migrationVersion: SavedObjectType<T>['migrationVersion'];
  error: SavedObjectType<T>['error'];
  references: SavedObjectType<T>['references'];
  get(key: string): any;
  set(key: string, value: any): T;
  has(key: string): boolean;
  save(): Promise<SimpleSavedObject<T>>;
  delete(): void;
}

interface FieldSubType {
  multi?: { parent: string };
  nested?: { path: string };
}

export interface Field {
  name: string;
  type: string;
  // esTypes might be undefined on old index patterns that have not been refreshed since we added
  // this prop. It is also undefined on scripted fields.
  esTypes?: string[];
  aggregatable: boolean;
  filterable: boolean;
  searchable: boolean;
  subType?: FieldSubType;
}

export type NavAction = (anchorElement?: any) => void;

/**
 * This should always represent the latest dashboard panel shape, after all possible migrations.
 */
export type SavedDashboardPanel = SavedDashboardPanel730ToLatest;

export interface DashboardAppState {
  panels: SavedDashboardPanel[];
  fullScreenMode: boolean;
  title: string;
  description: string;
  timeRestore: boolean;
  options: {
    hidePanelTitles: boolean;
    useMargins: boolean;
  };
  query: Query | string;
  filters: Filter[];
  viewMode: ViewMode;
  expandedPanelId?: string;
  savedQuery?: string;
}

export type DashboardAppStateDefaults = DashboardAppState & {
  description?: string;
};

/**
 * In URL panels are optional,
 * Panels are not added to the URL when in "view" mode
 */
export type DashboardAppStateInUrl = Omit<DashboardAppState, 'panels'> & {
  panels?: SavedDashboardPanel[];
};

export interface DashboardAppStateTransitions {
  set: (
    state: DashboardAppState
  ) => <T extends keyof DashboardAppState>(
    prop: T,
    value: DashboardAppState[T]
  ) => DashboardAppState;
  setOption: (
    state: DashboardAppState
  ) => <T extends keyof DashboardAppState['options']>(
    prop: T,
    value: DashboardAppState['options'][T]
  ) => DashboardAppState;
  setDashboard: (
    state: DashboardAppState
  ) => (dashboard: Partial<DashboardAppState>) => DashboardAppState;
}

export type DashboardAppStateContainer = ReduxLikeStateContainer<
  DashboardAppState,
  DashboardAppStateTransitions
>;

export interface SavedDashboardPanelMap {
  [key: string]: SavedDashboardPanel;
}

export interface StagedFilter {
  field: string;
  value: string;
  operator: string;
  index: string;
}

export interface DashboardProvider {
  // appId :
  // The appId used to register this Plugin application.
  // This value needs to be repeated here as the 'app' of this plugin
  // is not directly referenced in the details below, and the 'app' object
  // is not linked in the Dashboards List surrounding code.
  appId: string;

  // savedObjectstype :
  // This string should be the SavedObjects 'type' that you
  // have registered for your objects.  This must match the value
  // used by your Plugin's Server setup with `savedObjects.registerType()` call.
  savedObjectsType: string;

  // savedObjectsName :
  // This string should be the display-name that will be used on the
  // Dashboads / Dashboards table in a column named "Type".
  savedObjectsName: string;

  // savedObjectsId : Optional
  // If provided, this string will override the use of the `savedObjectsType`
  // for use with querying the SavedObjects index for your objects.
  // The default value for this string is implicitly set to the `savedObjectsType`
  savedObjectsId?: string;

  // createLinkText :
  // this is the string or Element that will be used to construct the
  // OUI MenuPopup of Create options.
  createLinkText: string | JSX.Element;

  // createSortText :
  // This string will be used in sorting the Create options.  Use
  // the verbatim string here, not any interpolation or function.
  createSortText: string;

  // createUrl :
  // This string should be the url-path for your plugin's Create
  // feature.
  createUrl: string;

  // viewUrlPathFn :
  // This function will be called on every iteratee of your objects
  // while querying the SavedObjects for Dashboards / Dashboards
  // This function should return the url-path to the View page
  // for your Plugin's objects, within the "app" basepath.
  // For instance :
  //   appId = "myplugin"
  //   app.basepath is then "/app/myplugin"
  // then
  //   viewUrlPathFn: (obj) => `#/view/${obj.id}`
  //
  // At onClick of rendered table "view" link for item {id: 'abc123', ...}, the navigated path will be:
  //   "http://../app/myplugin#/view/abc123"
  viewUrlPathFn: (obj: SavedObjectType) => string;

  // editUrlPathFn :
  // This function will be called on every iteratee of your objects
  // while querying the SavedObjects for Dashboards / Dashboards
  // This function should return the url-path to the Edit page
  // for your Plugin's objects, within the "app" basepath.
  // For instance :
  //   appId = "myplugin"
  //   app.basepath is then "/app/myplugin"
  // then
  //   editUrlPathFn: (obj) => `#/edit/${obj.id}`
  //
  // At onClick of rendered table "edit" link for item {id: 'abc123', ...}, the navigated path will be:
  //   "http://../app/myplugin#/edit/abc123"
  editUrlPathFn: (obj: SavedObjectType) => string;
}

export interface DashboardServices extends CoreStart {
  pluginInitializerContext: PluginInitializerContext;
  opensearchDashboardsVersion: string;
  history: History;
  osdUrlStateStorage: IOsdUrlStateStorage;
  core: CoreStart;
  data: DataPublicPluginStart;
  navigation: NavigationStart;
  savedObjectsClient: SavedObjectsClientContract;
  savedDashboards: SavedObjectLoader;
  dashboardProviders: () => { [key: string]: DashboardProvider } | undefined;
  dashboardConfig: OpenSearchDashboardsLegacyStart['dashboardConfig'];
  dashboardCapabilities: DashboardCapabilities;
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
  scopedHistory: ScopedHistory;
  setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  savedObjectsPublic: SavedObjectsStart;
  restorePreviousUrl: () => void;
  addBasePath?: (url: string) => string;
  toastNotifications: ToastsStart;
}
