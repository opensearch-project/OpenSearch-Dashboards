/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin,
  PluginInitializerContext,
  SharedGlobalConfig,
} from '../../../core/server';
import { SEARCH_STRATEGY } from '../common';
import { ConfigSchema } from '../common/config';
import { defineRoutes, defineSearchStrategyRouteProvider } from './routes';
import {
  pplAsyncSearchStrategyProvider,
  pplRawSearchStrategyProvider,
  pplSearchStrategyProvider,
  sqlAsyncSearchStrategyProvider,
  sqlSearchStrategyProvider,
} from './search';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
} from './types';
import { OpenSearchEnhancements } from './utils';
import { resourceManagerService } from './connections/resource_manager_service';
import { BaseConnectionManager } from './connections/managers/base_connection_manager';

export class QueryEnhancementsPlugin
  implements Plugin<QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart> {
  private readonly logger: Logger;
  private readonly config$: Observable<SharedGlobalConfig>;
  constructor(private initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.legacy.globalConfig$;
  }

  public setup(core: CoreSetup, { data, dataSource }: QueryEnhancementsPluginSetupDependencies) {
    this.logger.debug('queryEnhancements: Setup');
    const router = core.http.createRouter();
    // Register server side APIs
    const client = core.opensearch.legacy.createClient('opensearch_enhancements', {
      plugins: [OpenSearchEnhancements],
    });

    if (dataSource) {
      dataSource.registerCustomApiSchema(OpenSearchEnhancements);
    }

    const pplSearchStrategy = pplSearchStrategyProvider(this.config$, this.logger, client);
    const pplRawSearchStrategy = pplRawSearchStrategyProvider(this.config$, this.logger, client);
    const sqlSearchStrategy = sqlSearchStrategyProvider(this.config$, this.logger, client);
    const sqlAsyncSearchStrategy = sqlAsyncSearchStrategyProvider(
      this.config$,
      this.logger,
      client
    );
    const pplAsyncSearchStrategy = pplAsyncSearchStrategyProvider(
      this.config$,
      this.logger,
      client
    );

    data.search.registerSearchStrategy(SEARCH_STRATEGY.PPL, pplSearchStrategy);
    data.search.registerSearchStrategy(SEARCH_STRATEGY.PPL_RAW, pplRawSearchStrategy);
    data.search.registerSearchStrategy(SEARCH_STRATEGY.SQL, sqlSearchStrategy);
    data.search.registerSearchStrategy(SEARCH_STRATEGY.SQL_ASYNC, sqlAsyncSearchStrategy);
    data.search.registerSearchStrategy(SEARCH_STRATEGY.PPL_ASYNC, pplAsyncSearchStrategy);

    core.http.registerRouteHandlerContext('query_assist', () => ({
      logger: this.logger,
      configPromise: this.initializerContext.config
        .create<ConfigSchema>()
        .pipe(first())
        .toPromise(),
      dataSourceEnabled: !!dataSource,
    }));

    core.http.registerRouteHandlerContext('data_source_connection', () => ({
      logger: this.logger,
      configPromise: this.initializerContext.config
        .create<ConfigSchema>()
        .pipe(first())
        .toPromise(),
      dataSourceEnabled: !!dataSource,
    }));

    defineRoutes(this.logger, router, client, {
      ppl: pplSearchStrategy,
      sql: sqlSearchStrategy,
      sqlasync: sqlAsyncSearchStrategy,
      pplasync: pplAsyncSearchStrategy,
    });

    this.logger.info('queryEnhancements: Setup complete');
    return {
      defineSearchStrategyRoute: defineSearchStrategyRouteProvider(this.logger, router),
      registerResourceManager: (dataConnectionType: string, manager: BaseConnectionManager) =>
        resourceManagerService.register(dataConnectionType, manager),
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('queryEnhancements: Started');
    return {};
  }

  public stop() {}
}
