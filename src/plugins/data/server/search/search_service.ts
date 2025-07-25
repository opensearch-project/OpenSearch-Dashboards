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

import { BehaviorSubject, Observable } from 'rxjs';
import { pick } from 'lodash';
import {
  CoreSetup,
  CoreStart,
  OpenSearchDashboardsRequest,
  Logger,
  Plugin,
  PluginInitializerContext,
  RequestHandlerContext,
  SharedGlobalConfig,
  StartServicesAccessor,
} from 'src/core/server';
import { first } from 'rxjs/operators';
import { DataSourcePluginSetup } from 'src/plugins/data_source/server';
import { ISearchSetup, ISearchStart, ISearchStrategy, SearchEnhancements } from './types';

import { AggsService, AggsSetupDependencies } from './aggs';

import { FieldFormatsStart } from '../field_formats';
import { IndexPatternsServiceStart } from '../index_patterns';
import { getCallMsearch, registerMsearchRoute, registerSearchRoute } from './routes';
import { OPENSEARCH_SEARCH_STRATEGY, opensearchSearchStrategyProvider } from './opensearch_search';
import { DataPluginStart } from '../plugin';
import { UsageCollectionSetup } from '../../../usage_collection/server';
import { registerUsageCollector } from './collectors/register';
import { usageProvider } from './collectors/usage';
import { searchTelemetry } from '../saved_objects';
import {
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  IOpenSearchSearchRequest,
  IOpenSearchSearchResponse,
  ISearchOptions,
  SearchSourceDependencies,
  SearchSourceService,
  searchSourceRequiredUiSettings,
  OPENSEARCH_SEARCH_WITH_LONG_NUMERALS_STRATEGY,
} from '../../common/search';
import {
  getShardDelayBucketAgg,
  SHARD_DELAY_AGG_NAME,
} from '../../common/search/aggs/buckets/shard_delay';
import { aggShardDelay } from '../../common/search/aggs/buckets/shard_delay_fn';
import { ConfigSchema } from '../../config';
import {
  DataFrameService,
  IDataFrame,
  IDataFrameResponse,
  createDataFrameCache,
} from '../../common';

type StrategyMap = Record<string, ISearchStrategy<any, any>>;

/** @internal */
export interface SearchServiceSetupDependencies {
  registerFunction: AggsSetupDependencies['registerFunction'];
  usageCollection?: UsageCollectionSetup;
  dataSource?: DataSourcePluginSetup;
}

/** @internal */
export interface SearchServiceStartDependencies {
  fieldFormats: FieldFormatsStart;
  indexPatterns: IndexPatternsServiceStart;
}

/** @internal */
export interface SearchRouteDependencies {
  getStartServices: StartServicesAccessor<{}, DataPluginStart>;
  globalConfig$: Observable<SharedGlobalConfig>;
}

export class SearchService implements Plugin<ISearchSetup, ISearchStart> {
  private readonly aggsService = new AggsService();
  private readonly searchSourceService = new SearchSourceService();
  private readonly dfCache = createDataFrameCache();
  private defaultSearchStrategyName: string = OPENSEARCH_SEARCH_STRATEGY;
  private searchStrategies: StrategyMap = {};

  constructor(
    private initializerContext: PluginInitializerContext<ConfigSchema>,
    private readonly logger: Logger
  ) {}

  public async setup(
    core: CoreSetup<{}, DataPluginStart>,
    { registerFunction, usageCollection, dataSource }: SearchServiceSetupDependencies
  ): Promise<ISearchSetup> {
    const config = await this.initializerContext.config
      .create<ConfigSchema>()
      .pipe(first())
      .toPromise();
    const usage = usageCollection ? usageProvider(core, config) : undefined;

    const router = core.http.createRouter();
    const routeDependencies = {
      getStartServices: core.getStartServices,
      globalConfig$: this.initializerContext.config.legacy.globalConfig$,
    };
    registerSearchRoute(router, routeDependencies);
    registerMsearchRoute(router, routeDependencies);

    this.registerSearchStrategy(
      OPENSEARCH_SEARCH_STRATEGY,
      opensearchSearchStrategyProvider(
        this.initializerContext.config.legacy.globalConfig$,
        this.logger,
        usage,
        dataSource,
        core.opensearch
      )
    );

    this.registerSearchStrategy(
      OPENSEARCH_SEARCH_WITH_LONG_NUMERALS_STRATEGY,
      opensearchSearchStrategyProvider(
        this.initializerContext.config.legacy.globalConfig$,
        this.logger,
        usage,
        dataSource,
        core.opensearch,
        true
      )
    );

    core.savedObjects.registerType(searchTelemetry);
    if (usageCollection) {
      registerUsageCollector(usageCollection, this.initializerContext);
    }

    const aggs = this.aggsService.setup({ registerFunction });

    this.initializerContext.config
      .create<ConfigSchema>()
      .pipe(first())
      .toPromise()
      .then((value) => {
        if (value?.search?.aggs?.shardDelay?.enabled) {
          aggs.types.registerBucket(SHARD_DELAY_AGG_NAME, getShardDelayBucketAgg);
          registerFunction(aggShardDelay);
        }
      });

    return {
      __enhance: (enhancements?: SearchEnhancements) => {
        if (!enhancements) return;
        if (this.searchStrategies.hasOwnProperty(enhancements.defaultStrategy)) {
          this.defaultSearchStrategyName = enhancements.defaultStrategy;
        }
      },
      aggs,
      registerSearchStrategy: this.registerSearchStrategy,
      usage,
    };
  }
  public start(
    { opensearch, savedObjects, uiSettings }: CoreStart,
    { fieldFormats, indexPatterns }: SearchServiceStartDependencies
  ): ISearchStart {
    return {
      aggs: this.aggsService.start({ fieldFormats, uiSettings }),
      getSearchStrategy: this.getSearchStrategy,
      search: (
        context: RequestHandlerContext,
        searchRequest: IOpenSearchDashboardsSearchRequest,
        options: Record<string, any>
      ) => {
        return this.search(context, searchRequest, options);
      },
      searchSource: {
        asScoped: async (request: OpenSearchDashboardsRequest) => {
          const opensearchClient = opensearch.client.asScoped(request);
          const savedObjectsClient = savedObjects.getScopedClient(request);
          const scopedIndexPatterns = await indexPatterns.indexPatternsServiceFactory(request);
          const uiSettingsClient = uiSettings.asScopedToClient(savedObjectsClient);

          // cache ui settings, only including items which are explicitly needed by SearchSource
          const uiSettingsCache = pick(
            await uiSettingsClient.getAll(),
            searchSourceRequiredUiSettings
          );

          // @ts-expect-error TS2741 TODO(ts-error): fixme
          const dfService: DataFrameService = {
            get: () => this.dfCache.get(),
            set: (dataFrame: IDataFrame) => {
              this.dfCache.set(dataFrame);
            },
            clear: () => {
              if (this.dfCache.get() === undefined) return;
              this.dfCache.clear();
            },
          };

          const searchSourceDependencies: SearchSourceDependencies = {
            // @ts-expect-error TS7053 TODO(ts-error): fixme
            getConfig: <T = any>(key: string): T => uiSettingsCache[key],
            search: (searchRequest, options) => {
              /**
               * Unless we want all SearchSource users to provide both a OpenSearchDashboardsRequest
               * (needed for index patterns) AND the RequestHandlerContext (needed for
               * low-level search), we need to fake the context as it can be derived
               * from the request object anyway. This will pose problems for folks who
               * are registering custom search strategies as they are only getting a
               * subset of the entire context. Ideally low-level search should be
               * refactored to only require the needed dependencies: opensearchClient & uiSettings.
               */
              const fakeRequestHandlerContext = {
                core: {
                  opensearch: {
                    client: opensearchClient,
                  },
                  uiSettings: {
                    client: uiSettingsClient,
                  },
                },
              } as RequestHandlerContext;
              return this.search(fakeRequestHandlerContext, searchRequest, options);
            },
            // onResponse isn't used on the server, so we just return the original value
            onResponse: (req, res) => res,
            legacy: {
              callMsearch: getCallMsearch({
                opensearchClient,
                globalConfig$: this.initializerContext.config.legacy.globalConfig$,
                uiSettings: uiSettingsClient,
              }),
              loadingCount$: new BehaviorSubject(0),
            },
            df: dfService,
          };

          return this.searchSourceService.start(scopedIndexPatterns, searchSourceDependencies);
        },
      },
    };
  }

  public stop() {
    this.aggsService.stop();
  }

  private registerSearchStrategy = <
    SearchStrategyRequest extends IOpenSearchDashboardsSearchRequest = IOpenSearchSearchRequest,
    SearchStrategyResponse extends
      | IOpenSearchDashboardsSearchResponse
      | IDataFrameResponse = IOpenSearchSearchResponse
  >(
    name: string,
    strategy: ISearchStrategy<SearchStrategyRequest, SearchStrategyResponse>
  ) => {
    this.searchStrategies[name] = strategy;
  };

  private search = <
    SearchStrategyRequest extends IOpenSearchDashboardsSearchRequest = IOpenSearchSearchRequest,
    SearchStrategyResponse extends
      | IOpenSearchDashboardsSearchResponse
      | IDataFrameResponse = IOpenSearchSearchResponse
  >(
    context: RequestHandlerContext,
    searchRequest: SearchStrategyRequest,
    options: ISearchOptions
  ): Promise<SearchStrategyResponse> => {
    return this.getSearchStrategy<SearchStrategyRequest, SearchStrategyResponse>(
      options.strategy || this.defaultSearchStrategyName
    ).search(context, searchRequest, options);
  };

  private getSearchStrategy = <
    SearchStrategyRequest extends IOpenSearchDashboardsSearchRequest = IOpenSearchSearchRequest,
    SearchStrategyResponse extends
      | IOpenSearchDashboardsSearchResponse
      | IDataFrameResponse = IOpenSearchSearchResponse
  >(
    name: string
  ): ISearchStrategy<SearchStrategyRequest, SearchStrategyResponse> => {
    const strategy = this.searchStrategies[name];
    if (!strategy) {
      throw new Error(`Search strategy ${name} not found`);
    }
    return strategy;
  };
}
