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

import { BehaviorSubject } from 'rxjs';
import { skip } from 'rxjs/operators';
import { CoreStart } from 'opensearch-dashboards/public';
import { DataStorage, Query, SimpleDataSet, TimeRange, UI_SETTINGS } from '../../../common';
import { createHistory, QueryHistory } from './query_history';

export class QueryStringManager {
  private query$: BehaviorSubject<Query>;
  private queryHistory: QueryHistory;

  constructor(
    private readonly storage: DataStorage,
    private readonly uiSettings: CoreStart['uiSettings']
  ) {
    this.query$ = new BehaviorSubject<Query>(this.getDefaultQuery());
    this.queryHistory = createHistory({ storage });
  }

  private getDefaultQueryString() {
    return this.storage.get('userQueryString') || '';
  }

  private getDefaultLanguage() {
    return (
      this.storage.get('userQueryLanguage') ||
      this.uiSettings.get(UI_SETTINGS.SEARCH_QUERY_LANGUAGE)
    );
  }

  public getDefaultQuery() {
    return {
      query: this.getDefaultQueryString(),
      language: this.getDefaultLanguage(),
    };
  }

  public formatQuery(query: Query | string | undefined): Query {
    if (!query) {
      return this.getDefaultQuery();
    } else if (typeof query === 'string') {
      return {
        query,
        language: this.getDefaultLanguage(),
      };
    } else {
      return query;
    }
  }

  public getUpdates$ = () => {
    return this.query$.asObservable().pipe(skip(1));
  };

  public getQuery = (): Query => {
    return this.query$.getValue();
  };

  /**
   * Updates the query.
   * @param {Query} query
   */
  public setQuery = (query: Query) => {
    const curQuery = this.query$.getValue();
    if (query?.language !== curQuery.language || query?.query !== curQuery.query) {
      this.query$.next(query);
    }
  };

  /**
   * Resets the query to the default one.
   */
  public clearQuery = () => {
    this.setQuery(this.getDefaultQuery());
  };

  // Todo: update this function to use the Query object when it is udpated, Query object should include time range and dataset
  public addToQueryHistory(dataSet: SimpleDataSet, query: Query, timeRange?: TimeRange) {
    if (query.query) {
      this.queryHistory.addQueryToHistory(dataSet, query, timeRange);
    }
  }

  public getQueryHistory() {
    return this.queryHistory.getHistory();
  }

  public clearQueryHistory() {
    this.queryHistory.clearHistory();
  }

  public changeQueryHistory(listener: (reqs: any[]) => void) {
    return this.queryHistory.change(listener);
  }
}

export type QueryStringContract = PublicMethodsOf<QueryStringManager>;
