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
import { CoreStart, NotificationsSetup } from 'opensearch-dashboards/public';
import { isEqual } from 'lodash';
import { i18n } from '@osd/i18n';
import { Dataset, DataStorage, Query, TimeRange, UI_SETTINGS } from '../../../common';
import { createHistory, QueryHistory } from './query_history';
import { DatasetService, DatasetServiceContract } from './dataset_service';
import { LanguageService, LanguageServiceContract } from './language_service';
import { ISearchInterceptor } from '../../search';
import { getApplication } from '../../services';

export class QueryStringManager {
  private query$: BehaviorSubject<Query>;
  private queryHistory: QueryHistory;
  private datasetService!: DatasetServiceContract;
  private languageService!: LanguageServiceContract;

  constructor(
    private readonly storage: DataStorage,
    private readonly sessionStorage: DataStorage,
    private readonly uiSettings: CoreStart['uiSettings'],
    private readonly defaultSearchInterceptor: ISearchInterceptor,
    private readonly notifications: NotificationsSetup
  ) {
    this.query$ = new BehaviorSubject<Query>(this.getDefaultQuery());
    this.queryHistory = createHistory({ storage: this.sessionStorage });
    this.datasetService = new DatasetService(uiSettings, this.sessionStorage);
    this.languageService = new LanguageService(this.defaultSearchInterceptor, this.storage);
  }

  private getDefaultQueryString() {
    return this.storage.get('userQueryString') || '';
  }

  private getInitialDatasetQueryString(query: Query) {
    const { language, dataset } = query;

    const languageConfig = this.languageService.getLanguage(language);
    let typeConfig;

    if (dataset) {
      typeConfig = this.datasetService.getType(dataset.type);
    }

    return (
      typeConfig?.getInitialQueryString?.(query) ?? (languageConfig?.getQueryString(query) || '')
    );
  }

  public getDefaultQuery(): Query {
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
      const newQuery = { ...query, dataset: defaultDataset };

      return {
        ...newQuery,
        query: this.getInitialDatasetQueryString(newQuery),
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
    const currentAppId = this.getCurrentAppId();
    const query = this.query$.getValue();

    if (currentAppId) {
      const currentLanguage = query.language;
      if (
        containsWildcardOrValue(
          this.languageService.getLanguage(currentLanguage)?.supportedAppNames,
          currentAppId
        )
      ) {
        return this.query$.getValue();
      }

      const defaultLanguage = this.uiSettings.get('search:queryLanguage');
      const defaultLanguageTitle = this.languageService.getLanguage(defaultLanguage)?.title;

      showWarning(this.notifications, {
        title: i18n.translate('data.unSupportedLanguageTitle', {
          defaultMessage: 'Unsupported Language Selected',
        }),
        text: i18n.translate('data.unSupportedLanguageBody', {
          defaultMessage:
            'Selected language {currentLanguage} is not supported. Defaulting to {defaultLanguage}.',
          values: {
            currentLanguage,
            defaultLanguage: defaultLanguageTitle,
          },
        }),
      });

      const updatedQuery = this.getInitialQueryByLanguage(defaultLanguage);
      this.setQuery(updatedQuery);
    }
    return this.query$.getValue();
  };

  /**
   * Updates the query.
   * @param {Query} query
   */
  public setQuery = (query: Partial<Query>) => {
    const curQuery = this.query$.getValue();
    let newQuery = { ...curQuery, ...query };
    if (!isEqual(curQuery, newQuery)) {
      // Check if dataset changed and if new dataset has language restrictions
      if (newQuery.dataset && !isEqual(curQuery.dataset, newQuery.dataset)) {
        // Get supported languages for the dataset
        const supportedLanguages = this.datasetService
          .getType(newQuery.dataset.type)
          ?.supportedLanguages(newQuery.dataset);

        // If we have supported languages and current language isn't supported
        if (supportedLanguages && !supportedLanguages.includes(newQuery.language)) {
          // Get initial query with first supported language and new dataset
          newQuery = this.getInitialQuery({
            language: supportedLanguages[0],
            dataset: newQuery.dataset,
          });

          // Show warning about language change
          showWarning(this.notifications, {
            title: i18n.translate('data.languageChangeTitle', {
              defaultMessage: 'Language Changed',
            }),
            text: i18n.translate('data.languageChangeBody', {
              defaultMessage: 'Query language changed to {supportedLanguage}.',
              values: {
                supportedLanguage:
                  this.languageService.getLanguage(supportedLanguages[0])?.title ||
                  supportedLanguages[0],
              },
            }),
          });
        }

        // Add to recent datasets
        this.datasetService.addRecentDataset(newQuery.dataset);
      }
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

  /**
   * Gets the initial query based on the provided partial query object.
   * If both language and dataset are provided, generates a new query without using current state
   * If only language is provided, uses current dataset
   * If only dataset is provided, uses current or dataset's preferred language
   */
  public getInitialQuery = (partialQuery?: Partial<Query>) => {
    if (!partialQuery) {
      return this.getInitialQueryByLanguage(this.query$.getValue().language);
    }

    const { language, dataset } = partialQuery;
    const currentQuery = this.query$.getValue();

    // Both language and dataset provided - generate fresh query
    if (language && dataset) {
      const newQuery = {
        language,
        dataset,
        query: '',
      };
      newQuery.query = this.getInitialDatasetQueryString(newQuery);
      return newQuery;
    }

    // Only dataset provided - use dataset's preferred language or current language
    if (dataset) {
      return this.getInitialQueryByDataset(dataset);
    }

    // Only language provided - use current dataset
    if (language) {
      return this.getInitialQueryByLanguage(language);
    }

    // Fallback to current query
    return currentQuery;
  };

  /**
   * Gets initial query for a language, preserving current dataset
   * Called by getInitialQuery when only language changes
   */
  public getInitialQueryByLanguage = (languageId: string) => {
    const curQuery = this.query$.getValue();
    const newQuery = {
      ...curQuery,
      language: languageId,
    };

    const queryString = this.getInitialDatasetQueryString(newQuery);
    this.languageService.setUserQueryString(queryString);

    return {
      ...newQuery,
      query: queryString,
    };
  };

  /**
   * Gets initial query for a dataset, using dataset's preferred language or current language
   * Called by getInitialQuery when only dataset changes
   */
  public getInitialQueryByDataset = (newDataset: Dataset) => {
    const curQuery = this.query$.getValue();
    // Use dataset's preferred language or fallback to current language
    const languageId = newDataset.language || curQuery.language;
    const newQuery = {
      ...curQuery,
      language: languageId,
      dataset: newDataset,
    };

    return {
      ...newQuery,
      query: this.getInitialDatasetQueryString(newQuery),
    };
  };

  private isLanguageSupported(languageId: string) {
    const currentAppId = this.getCurrentAppId();
    if (!currentAppId) {
      return false;
    }

    return containsWildcardOrValue(
      this.languageService.getLanguage(languageId)?.supportedAppNames,
      currentAppId
    );
  }

  private getDefaultLanguage() {
    const lastUsedLanguage = this.storage.get('userQueryLanguage');
    if (lastUsedLanguage && this.isLanguageSupported(lastUsedLanguage)) {
      return lastUsedLanguage;
    }

    return this.uiSettings.get(UI_SETTINGS.SEARCH_QUERY_LANGUAGE);
  }

  private getCurrentAppId = () => {
    let appId;
    try {
      const application = getApplication();
      if (application) {
        application.currentAppId$.subscribe((val) => (appId = val)).unsubscribe();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Application Not available.');
    }

    return appId;
  };
}

const showWarning = (
  notifications: NotificationsSetup,
  { title, text }: { title: string; text: string }
) => {
  notifications.toasts.addWarning({ title, text, id: 'unsupported_language_selected' });
};

const containsWildcardOrValue = (arr: string[] | undefined, value: string) => {
  return arr ? arr.includes('*') || arr.includes(value) : true;
};

export type QueryStringContract = PublicMethodsOf<QueryStringManager>;
