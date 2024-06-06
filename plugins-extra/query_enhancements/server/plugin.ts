import { Observable } from 'rxjs';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  SharedGlobalConfig,
} from '../../../src/core/server';

import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
} from './types';
import { defineRoutes } from './routes';
import { PPLPlugin } from './search/ppl/ppl_plugin';
import { EnginePlugin } from './search/engine_plugin';
import { PPL_SEARCH_STRATEGY, SQL_SEARCH_STRATEGY, SQL_ASYNC_SEARCH_STRATEGY } from '../common';
import { pplSearchStrategyProvider } from './search/ppl/ppl_search_strategy';
import { sqlSearchStrategyProvider } from './search/sql/sql_search_strategy';
import { sqlAsyncSearchStrategyProvider } from './search/sql/sql_async_search_strategy';

// import { logsPPLSpecProvider } from './sample_data/ppl';
// const pplSampleDateSet = logsPPLSpecProvider();

export class QueryEnhancementsPlugin
  implements Plugin<QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart> {
  private readonly logger: Logger;
  private readonly config$: Observable<SharedGlobalConfig>;
  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.legacy.globalConfig$;
  }

  public setup(core: CoreSetup, { data, home }: QueryEnhancementsPluginSetupDependencies) {
    this.logger.debug('queryEnhancements: Setup');
    const router = core.http.createRouter();
    // Register server side APIs
    const client = core.opensearch.legacy.createClient('opensearch_observability', {
      plugins: [PPLPlugin, EnginePlugin],
    });

    const pplSearchStrategy = pplSearchStrategyProvider(this.config$, this.logger, client);
    const sqlSearchStrategy = sqlSearchStrategyProvider(this.config$, this.logger, client);
    const sqlAsyncSearchStrategy = sqlAsyncSearchStrategyProvider(
      this.config$,
      this.logger,
      client
    );

    data.search.registerSearchStrategy(PPL_SEARCH_STRATEGY, pplSearchStrategy);
    data.search.registerSearchStrategy(SQL_SEARCH_STRATEGY, sqlSearchStrategy);
    data.search.registerSearchStrategy(SQL_ASYNC_SEARCH_STRATEGY, sqlAsyncSearchStrategy);

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
