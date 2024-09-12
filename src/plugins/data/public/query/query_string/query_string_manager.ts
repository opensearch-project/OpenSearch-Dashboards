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
import { isEqual } from 'lodash';
import { Dataset, DataStorage, Query, TimeRange, UI_SETTINGS } from '../../../common';
import { createHistory, QueryHistory } from './query_history';
import { DatasetService, DatasetServiceContract } from './dataset_service';
import { LanguageService, LanguageServiceContract } from './language_service';
import { ISearchInterceptor } from '../../search';

export class QueryStringManager {
  private query$: BehaviorSubject<Query>;
  private queryHistory: QueryHistory;
  private datasetService!: DatasetServiceContract;
  private languageService!: LanguageServiceContract;

  constructor(
    private readonly storage: DataStorage,
    private readonly sessionStorage: DataStorage,
    private readonly uiSettings: CoreStart['uiSettings'],
    private readonly defaultSearchInterceptor: ISearchInterceptor
  ) {
    this.query$ = new BehaviorSubject<Query>(this.getDefaultQuery());
    this.queryHistory = createHistory({ storage });
    this.datasetService = new DatasetService(uiSettings, this.sessionStorage);
    this.languageService = new LanguageService(this.defaultSearchInterceptor, this.storage);
  }

  private getDefaultQueryString() {
    return this.storage.get('userQueryString') || '';
  }

  public getDefaultQuery() {
    const defaultLanguageId = this.getDefaultLanguage();
    const defaultQuery = this.getDefaultQueryString();
    const defaultDataset = this.datasetService?.getDefault();

    const query = {
      query: defaultQuery,
      language: defaultLanguageId,
    };

    if (
      this.uiSettings &&
      this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED) &&
      defaultDataset &&
      this.languageService
    ) {
      const language = this.languageService.getLanguage(defaultLanguageId);
      const newQuery = { ...query, dataset: defaultDataset };
      const newQueryString = language?.getQueryString(newQuery) || '';

      return {
        ...newQuery,
        query: newQueryString,
      };
    }

    return query;
  }

  public formatQuery(query: Query | string | undefined): Query {
    if (!query) {
      return this.getDefaultQuery();
    } else if (typeof query === 'string') {
      return {
        query,
        language: this.getDefaultLanguage(),
        dataset: this.datasetService?.getDefault(),
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
  public setQuery = (query: Partial<Query>) => {
    const curQuery = this.query$.getValue();
    const newQuery = { ...curQuery, ...query };
    if (!isEqual(curQuery, newQuery)) {
      this.query$.next(newQuery);
    }
  };

  /**
   * Resets the query to the default one.
   */
  public clearQuery = () => {
    this.setQuery(this.getDefaultQuery());
  };

  // Todo: update this function to use the Query object when it is udpated, Query object should include time range and dataset
  public addToQueryHistory(query: Query, timeRange?: TimeRange) {
    if (query.query) {
      this.queryHistory.addQueryToHistory(query, timeRange);
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

  public getDatasetService = () => {
    return this.datasetService;
  };

  public getLanguageService = () => {
    return this.languageService;
  };

  public getInitialQuery = () => {
    return this.getInitialQueryByLanguage(this.query$.getValue().language);
  };

  public getInitialQueryByLanguage = (languageId: string) => {
    const curQuery = this.query$.getValue();
    const language = this.languageService.getLanguage(languageId);
    const dataset = curQuery.dataset;
    const input = language?.getQueryString(curQuery) || '';
    this.languageService.setUserQueryString(input);

    return {
      query: input,
      language: languageId,
      dataset,
    };
  };

  public getInitialQueryByDataset = (newDataset: Dataset) => {
    const curQuery = this.query$.getValue();
    const languageId = newDataset.language || curQuery.language;
    const language = this.languageService.getLanguage(languageId);
    const newQuery = { ...curQuery, language: languageId, dataset: newDataset };
    const newQueryString = language?.getQueryString(newQuery) || '';

    return {
      ...newQuery,
      query: newQueryString,
    };
  };

  private getDefaultLanguage() {
    return (
      this.storage.get('userQueryLanguage') ||
      this.uiSettings.get(UI_SETTINGS.SEARCH_QUERY_LANGUAGE)
    );
  }
}

export type QueryStringContract = PublicMethodsOf<QueryStringManager>;
