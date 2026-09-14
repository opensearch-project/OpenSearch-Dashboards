/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ApplicationSetup,
  ApplicationStart,
  IUiSettingsClient,
  NotificationsSetup,
  NotificationsStart,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/public';
import { Observable } from 'rxjs';
import { Dataset, DataStorage } from '../../common';
import { IndexPattern, IndexPatternsService } from '../index_patterns';
import { ISearchInterceptor } from '../search';
import { FilterManager } from './filter_manager';
import { QueryStringContract } from './query_string';
import { QueryStateChange, QueryState } from './state_sync';
import { createAddToQueryLog } from './lib';
import { createSavedQueryService } from './saved_query';
import { TimefilterSetup } from './timefilter';

export interface IQuerySetup {
  filterManager: FilterManager;
  timefilter: TimefilterSetup;
  queryString: QueryStringContract;
  state$: Observable<{ changes: QueryStateChange; state: QueryState }>;
}

export interface IQueryStart {
  addToQueryLog: ReturnType<typeof createAddToQueryLog>;
  filterManager: FilterManager;
  /**
   * Returns the default dataset after DatasetService initialization completes. Applications decide
   * whether to adopt the dataset and its generated query before restoring their own query state.
   */
  getDefaultDataset: () => Promise<Dataset | undefined>;
  queryString: QueryStringContract;
  savedQueries: ReturnType<typeof createSavedQueryService>;
  state$: Observable<{ changes: QueryStateChange; state: QueryState }>;
  timefilter: TimefilterSetup;
  getOpenSearchQuery: (indexPattern: IndexPattern) => any;
}

/** @internal */
export interface QueryServiceSetupDependencies {
  uiSettings: IUiSettingsClient;
  storage: DataStorage;
  sessionStorage: DataStorage;
  defaultSearchInterceptor: ISearchInterceptor;
  application: ApplicationSetup;
  notifications: NotificationsSetup;
}

/** @internal */
export interface QueryServiceStartDependencies {
  savedObjectsClient: SavedObjectsClientContract;
  storage: DataStorage;
  uiSettings: IUiSettingsClient;
  indexPatterns: IndexPatternsService;
  application: ApplicationStart;
  notifications: NotificationsStart;
}
