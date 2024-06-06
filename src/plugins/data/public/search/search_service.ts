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

import { Plugin, CoreSetup, CoreStart, PluginInitializerContext } from 'src/core/public';
import { BehaviorSubject } from 'rxjs';
import { ISearchSetup, ISearchStart, SearchEnhancements } from './types';

import { handleResponse } from './fetch';
import {
  IOpenSearchSearchRequest,
  IOpenSearchSearchResponse,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchGeneric,
  ISearchOptions,
  SearchSourceService,
  SearchSourceDependencies,
} from '../../common/search';
import { getCallMsearch } from './legacy';
import { AggsService, AggsStartDependencies } from './aggs';
import { IndexPatternsContract } from '../index_patterns/index_patterns';
import { ISearchInterceptor, SearchInterceptor } from './search_interceptor';
import { SearchUsageCollector, createUsageCollector } from './collectors';
import { UsageCollectionSetup } from '../../../usage_collection/public';
import { opensearchdsl, opensearchRawResponse } from './expressions';
import { ExpressionsSetup } from '../../../expressions/public';
import { ConfigSchema } from '../../config';
import {
  SHARD_DELAY_AGG_NAME,
  getShardDelayBucketAgg,
} from '../../common/search/aggs/buckets/shard_delay';
import { aggShardDelay } from '../../common/search/aggs/buckets/shard_delay_fn';
import {
  DataFramesService,
  DataFrameService,
  IDataFrame,
  IDataFrameResponse,
  createDataFrameCache,
  createDataFramesCache,
  createSessionCache,
  dataFrameToSpec,
  SessionService,
} from '../../common/data_frames';

/** @internal */
export interface SearchServiceSetupDependencies {
  expressions: ExpressionsSetup;
  usageCollection?: UsageCollectionSetup;
}

/** @internal */
export interface SearchServiceStartDependencies {
  fieldFormats: AggsStartDependencies['fieldFormats'];
  indexPatterns: IndexPatternsContract;
}

export class SearchService implements Plugin<ISearchSetup, ISearchStart> {
  private readonly aggsService = new AggsService();
  private readonly searchSourceService = new SearchSourceService();
  private readonly dfCache = createDataFrameCache();
  private readonly dfsCache = createDataFramesCache();
  private readonly sessionCache = createSessionCache();
  private searchInterceptor!: ISearchInterceptor;
  private defaultSearchInterceptor!: ISearchInterceptor;
  private usageCollector?: SearchUsageCollector;

  constructor(private initializerContext: PluginInitializerContext<ConfigSchema>) {}

  public setup(
    { http, getStartServices, notifications, uiSettings }: CoreSetup,
    { expressions, usageCollection }: SearchServiceSetupDependencies
  ): ISearchSetup {
    this.usageCollector = createUsageCollector(getStartServices, usageCollection);

    /**
     * A global object that intercepts all searches and provides convenience methods for cancelling
     * all pending search requests, as well as getting the number of pending search requests.
     */
    this.searchInterceptor = new SearchInterceptor({
      toasts: notifications.toasts,
      http,
      uiSettings,
      startServices: getStartServices(),
      usageCollector: this.usageCollector!,
    });
    this.defaultSearchInterceptor = this.searchInterceptor;

    expressions.registerFunction(opensearchdsl);
    expressions.registerType(opensearchRawResponse);

    const aggs = this.aggsService.setup({
      registerFunction: expressions.registerFunction,
      uiSettings,
    });

    if (this.initializerContext.config.get().search.aggs.shardDelay.enabled) {
      aggs.types.registerBucket(SHARD_DELAY_AGG_NAME, getShardDelayBucketAgg);
      expressions.registerFunction(aggShardDelay);
    }

    return {
      aggs,
      usageCollector: this.usageCollector!,
      __enhance: (enhancements: SearchEnhancements) => {
        this.searchInterceptor = enhancements.searchInterceptor;
      },
    };
  }

  public start(
    { application, http, notifications, uiSettings }: CoreStart,
    { fieldFormats, indexPatterns }: SearchServiceStartDependencies
  ): ISearchStart {
    const search = ((request, options) => {
      return this.searchInterceptor.search(request, options);
    }) as ISearchGeneric;

    const loadingCount$ = new BehaviorSubject(0);
    http.addLoadingCountSource(loadingCount$);

    const sessionService: SessionService = {
      get: (datasource: string) => this.sessionCache.get(datasource),
      set: async (datasource: string, session: string) =>
        this.sessionCache.set(datasource, session),
      clear: () => this.sessionCache.clear(),
    };

    const dfService: DataFrameService = {
      get: () => {
        const df = this.dfCache.get();
        if (df) {
          const sessionId = this.sessionCache.get(df?.name);
          if (sessionId) {
            df.meta = { ...df.meta, sessionId };
          }
        }
        return df;
      },
      set: async (dataFrame: IDataFrame) => {
        if (this.dfCache.get() && this.dfCache.get()?.name !== dataFrame.name) {
          indexPatterns.clearCache(this.dfCache.get()!.name, false);
        }
        this.dfCache.set(dataFrame);
        // TODO: MQL async: make sure to update the server search service
        // We should likely consolidate the d cache and caches
        if (dataFrame?.name && dataFrame?.meta?.sessionId) {
          this.sessionCache.set(dataFrame.name, dataFrame.meta.sessionId);
        }
        const existingIndexPattern = indexPatterns.getByTitle(dataFrame.name!, true);
        const dataSet = await indexPatterns.create(
          dataFrameToSpec(dataFrame, existingIndexPattern?.id),
          !existingIndexPattern?.id
        );
        // save to cache by title because the id is not unique for temporary index pattern created
        indexPatterns.saveToCache(dataSet.title, dataSet);
      },
      clear: () => {
        if (this.dfCache.get() === undefined) return;
        // name because the id is not unique for temporary index pattern created
        indexPatterns.clearCache(this.dfCache.get()!.name, false);
        this.dfCache.clear();
      },
    };

    const dfsService: DataFramesService = {
      get: (name: string) => {
        const df = this.dfsCache.get(name);
        if (df) {
          const sessionId = this.sessionCache.get(df?.name);
          if (sessionId) {
            df.meta = { ...df.meta, sessionId };
          }
        }
        return df;
      },
      set: async (dataFrame: IDataFrame) => {
        // if (this.dfsCache.get() && this.dfsCache.get()?.name !== dataFrame.name) {
        //   indexPatterns.clearCache(this.dfCache.get()!.name, false);
        // }
        this.dfsCache.set(dataFrame.name!, dataFrame);
        if (dataFrame?.name && dataFrame?.meta?.sessionId) {
          this.sessionCache.set(dataFrame.name, dataFrame.meta.sessionId);
        }
        const existingIndexPattern = indexPatterns.getByTitle(dataFrame.name!, true);
        const dataSet = await indexPatterns.create(
          dataFrameToSpec(dataFrame, existingIndexPattern?.id),
          !existingIndexPattern?.id
        );
        // save to cache by title because the id is not unique for temporary index pattern created
        indexPatterns.saveToCache(dataSet.title, dataSet);
      },
      clear: (name: string) => {
        if (this.dfsCache.get(name) === undefined) return;
        // name because the id is not unique for temporary index pattern created
        indexPatterns.clearCache(this.dfsCache.get(name)!.name, false);
        this.dfsCache.clear(name);
        // TODO: MQL async might need a clear by id for session cache
      },
    };

    const searchSourceDependencies: SearchSourceDependencies = {
      getConfig: uiSettings.get.bind(uiSettings),
      search: <
        SearchStrategyRequest extends IOpenSearchDashboardsSearchRequest = IOpenSearchSearchRequest,
        SearchStrategyResponse extends
          | IOpenSearchDashboardsSearchResponse
          | IDataFrameResponse = IOpenSearchSearchResponse
      >(
        request: SearchStrategyRequest,
        options: ISearchOptions
      ) => {
        return search(request, options).toPromise() as Promise<SearchStrategyResponse>;
      },
      onResponse: handleResponse,
      legacy: {
        callMsearch: getCallMsearch({ http }),
        loadingCount$,
      },
      df: dfService,
      // TODO: MQL better name or if it works perfectly just update the existing df to new logic
      dfs: dfsService,
      session: sessionService,
    };

    return {
      aggs: this.aggsService.start({ fieldFormats, uiSettings }),
      search,
      showError: (e: Error) => {
        this.searchInterceptor.showError(e);
      },
      searchSource: this.searchSourceService.start(indexPatterns, searchSourceDependencies),
      __enhance: (enhancements: SearchEnhancements) => {
        this.searchInterceptor = enhancements.searchInterceptor;
      },
      getDefaultSearchInterceptor: () => this.defaultSearchInterceptor,
      df: dfService,
      dfs: dfsService,
      session: sessionService,
    };
  }

  public stop() {
    this.aggsService.stop();
    this.searchSourceService.stop();
  }
}
