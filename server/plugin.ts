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
} from '../../../src/core/server';
import { SEARCH_STRATEGY } from '../common';
import { ConfigSchema } from '../common/config';
import { defineRoutes } from './routes';
import {
  pplSearchStrategyProvider,
  sqlSearchStrategyProvider,
  sqlAsyncSearchStrategyProvider,
} from './search';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
} from './types';
import { OpenSearchObservabilityPlugin, OpenSearchPPLPlugin } from './utils';

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
    const client = core.opensearch.legacy.createClient('opensearch_observability', {
      plugins: [OpenSearchPPLPlugin, OpenSearchObservabilityPlugin],
    });

    if (dataSource) {
      dataSource.registerCustomApiSchema(OpenSearchPPLPlugin);
      dataSource.registerCustomApiSchema(OpenSearchObservabilityPlugin);
    }

    const pplSearchStrategy = pplSearchStrategyProvider(this.config$, this.logger, client);
    const sqlSearchStrategy = sqlSearchStrategyProvider(this.config$, this.logger, client);
    const sqlAsyncSearchStrategy = sqlAsyncSearchStrategyProvider(
      this.config$,
      this.logger,
      client
    );

    data.search.registerSearchStrategy(SEARCH_STRATEGY.PPL, pplSearchStrategy);
    data.search.registerSearchStrategy(SEARCH_STRATEGY.SQL, sqlSearchStrategy);
    data.search.registerSearchStrategy(SEARCH_STRATEGY.SQLAsync, sqlAsyncSearchStrategy);

    core.http.registerRouteHandlerContext('query_assist', () => ({
      logger: this.logger,
      configPromise: this.initializerContext.config
        .create<ConfigSchema>()
        .pipe(first())
        .toPromise(),
      dataSourceEnabled: !!dataSource,
    }));

    defineRoutes(this.logger, router, {
      ppl: pplSearchStrategy,
      sql: sqlSearchStrategy,
      sqlasync: sqlAsyncSearchStrategy,
    });

    this.logger.info('queryEnhancements: Setup complete');
    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('queryEnhancements: Started');
    return {};
  }

  public stop() {}
}
