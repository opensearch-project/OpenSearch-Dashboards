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

import { share } from 'rxjs/operators';
import { FilterManager } from './filter_manager';
import { createAddToQueryLog } from './lib';
import { TimefilterService, TimefilterSetup } from './timefilter';
import { createSavedQueryService } from './saved_query/saved_query_service';
import { createQueryStateObservable } from './state_sync/create_global_query_observable';
import { QueryStringManager, QueryStringContract } from './query_string';
import { buildOpenSearchQuery, getOpenSearchQueryConfig } from '../../common';
import { getUiSettings } from '../services';
import { IndexPattern } from '..';
import {
  IQuerySetup,
  IQueryStart,
  QueryServiceSetupDependencies,
  QueryServiceStartDependencies,
} from './types';

/**
 * Query Service
 * @internal
 */

export class QueryService {
  filterManager!: FilterManager;
  timefilter!: TimefilterSetup;
  queryStringManager!: QueryStringContract;

  state$!: ReturnType<typeof createQueryStateObservable>;

  public setup({
    uiSettings,
    storage,
    sessionStorage,
    defaultSearchInterceptor,
    notifications,
  }: QueryServiceSetupDependencies): IQuerySetup {
    this.filterManager = new FilterManager(uiSettings);

    const timefilterService = new TimefilterService();
    this.timefilter = timefilterService.setup({
      uiSettings,
      storage,
    });

    this.queryStringManager = new QueryStringManager(
      storage,
      sessionStorage,
      uiSettings,
      defaultSearchInterceptor,
      notifications
    );

    this.state$ = createQueryStateObservable({
      filterManager: this.filterManager,
      timefilter: this.timefilter,
      queryString: this.queryStringManager,
    }).pipe(share());

    return {
      filterManager: this.filterManager,
      timefilter: this.timefilter,
      queryString: this.queryStringManager,
      state$: this.state$,
    };
  }

  public start({
    savedObjectsClient,
    storage,
    uiSettings,
    indexPatterns,
    application,
  }: QueryServiceStartDependencies): IQueryStart {
    this.queryStringManager.getDatasetService().init(indexPatterns);
    return {
      addToQueryLog: createAddToQueryLog({
        storage,
        uiSettings,
      }),
      filterManager: this.filterManager,
      queryString: this.queryStringManager,
      savedQueries: createSavedQueryService(
        savedObjectsClient,
        { application, uiSettings },
        this.queryStringManager
      ),
      state$: this.state$,
      timefilter: this.timefilter,
      getOpenSearchQuery: (indexPattern: IndexPattern) => {
        const timeFilter = this.timefilter.timefilter.createFilter(indexPattern);

        return buildOpenSearchQuery(
          indexPattern,
          this.queryStringManager.getQuery(),
          [...this.filterManager.getFilters(), ...(timeFilter ? [timeFilter] : [])],
          getOpenSearchQueryConfig(getUiSettings())
        );
      },
    };
  }

  public stop() {
    // nothing to do here yet
  }
}

/** @public */
export type QuerySetup = ReturnType<QueryService['setup']>;
export type QueryStart = ReturnType<QueryService['start']>;
