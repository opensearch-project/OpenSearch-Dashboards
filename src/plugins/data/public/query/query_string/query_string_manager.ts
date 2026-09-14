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
    private readonly notifications: NotificationsSetup,
    private readonly currentAppIdProvider: () => string | undefined = () => undefined
  ) {
    this.datasetService = new DatasetService(uiSettings, this.sessionStorage);
    this.languageService = new LanguageService(this.defaultSearchInterceptor, this.storage);
    this.query$ = new BehaviorSubject<Query>(this.getDefaultQuery());
    this.queryHistory = createHistory({ storage: this.sessionStorage });
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

  /**
   * Builds a default query for an explicitly selected dataset.
   *
   * Do not implicitly read DatasetService's default here: its asynchronous initialization used to
   * replace application-restored queries with a generated dataset query.
   */
  public getDefaultQuery(dataset?: Dataset): Query {
    const { language: defaultLanguage, useUserQuery } = this.resolveDefaultLanguage();
    const query: Query = {
      query: useUserQuery ? this.getDefaultQueryString() : '',
      language: defaultLanguage,
    };

    if (
      this.uiSettings &&
      this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED) &&
      dataset &&
      this.languageService
    ) {
      let language = defaultLanguage;
      const supportedLanguages = this.datasetService
        .getType(dataset.type)
        ?.supportedLanguages(dataset);
      if (supportedLanguages && !supportedLanguages.includes(language)) {
        language =
          supportedLanguages.find((languageId) => this.isLanguageSupported(languageId)) ??
          supportedLanguages[0];
      }
      const datasetQuery = { ...query, language, dataset };

      return {
        ...datasetQuery,
        query: this.getInitialDatasetQueryString(datasetQuery),
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
      };
    } else {
      return query;
    }
  }

  public getUpdates$ = () => {
    return this.query$.asObservable().pipe(skip(1));
  };

  // Reading query state must not apply app-specific fallbacks. Applications such as Explore keep
  // their own query state and call getQuery() while building requests; mutating the shared query
  // here can combine an app-level PPL query with a newly defaulted DQL language. Applications
  // normalize unsupported restored queries when initializing their own state instead.
  public getQuery = (): Query => this.query$.getValue();

  /**
   * Updates the query.
   * @param {Query} query
   */
  public setQuery = (
    query: Partial<Query>,
    force: boolean = false,
    mergeCurrentQuery: boolean = true
  ) => {
    const curQuery = this.query$.getValue();
    let newQuery = mergeCurrentQuery ? { ...curQuery, ...query } : (query as Query);
    // If the current query is different from the new query, or the user explicitly set force to true,
    // then proceed with updating the query.
    if (!isEqual(curQuery, newQuery) || force) {
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
    const force = false;
    const mergeCurrentQuery = false;
    this.setQuery(this.getDefaultQuery(), force, mergeCurrentQuery);
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

    return isAppSupported(
      this.languageService.getLanguage(languageId)?.supportedAppNames,
      currentAppId
    );
  }

  private resolveDefaultLanguage(): { language: string; useUserQuery: boolean } {
    const lastUsedLanguage = this.storage.get('userQueryLanguage');
    // userQueryLanguage and userQueryString are persisted as a pair. Reuse the string only when
    // that language is still supported by the active app; otherwise PPL could be parsed as DQL.
    if (lastUsedLanguage && this.isLanguageSupported(lastUsedLanguage)) {
      return { language: lastUsedLanguage, useUserQuery: true };
    }

    const configuredLanguage = this.uiSettings.get(UI_SETTINGS.SEARCH_QUERY_LANGUAGE) || 'kuery';
    if (!this.getCurrentAppId() || this.isLanguageSupported(configuredLanguage)) {
      return { language: configuredLanguage, useUserQuery: false };
    }

    // The UI setting can also reference a language unsupported by the active app. Use an empty
    // kuery instead of carrying a query string across languages.
    return { language: 'kuery', useUserQuery: false };
  }

  private getDefaultLanguage() {
    return this.resolveDefaultLanguage().language;
  }

  private getCurrentAppId(): string | undefined {
    return this.currentAppIdProvider();
  }
}

const showWarning = (
  notifications: NotificationsSetup,
  { title, text }: { title: string; text: string }
) => {
  notifications.toasts.addWarning({ title, text, id: 'unsupported_language_selected' });
};

const isAppSupported = (supportedAppNames: string[] | undefined, currentAppId: string) => {
  if (!supportedAppNames) {
    return true;
  }

  // Language registrations use the owning app name (for example, `explore`), while Core may
  // expose a namespaced app ID for one of its experiences (for example, `explore/logs`).
  return supportedAppNames.some(
    (appName) =>
      appName === '*' || currentAppId === appName || currentAppId.startsWith(`${appName}/`)
  );
};

export type QueryStringContract = PublicMethodsOf<QueryStringManager>;
