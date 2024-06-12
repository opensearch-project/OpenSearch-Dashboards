import { Observable } from 'rxjs';
import {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin,
  PluginInitializerContext,
  SharedGlobalConfig,
} from '../../../src/core/server';
import { PPL_SEARCH_STRATEGY, SQL_ASYNC_SEARCH_STRATEGY, SQL_SEARCH_STRATEGY } from '../common';
import { defineRoutes } from './routes';
import { EnginePlugin } from './search/engine_plugin';
import { PPLPlugin } from './search/ppl/ppl_plugin';
import { pplSearchStrategyProvider } from './search/ppl/ppl_search_strategy';
import { sqlSearchStrategyProvider } from './search/sql/sql_search_strategy';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
} from './types';
import { uiSettings } from './ui_settings';

export class QueryEnhancementsPlugin
  implements Plugin<QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart> {
  private readonly logger: Logger;
  private readonly config$: Observable<SharedGlobalConfig>;
  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.legacy.globalConfig$;
  }

  public setup(core: CoreSetup, { data, dataSource }: QueryEnhancementsPluginSetupDependencies) {
    this.logger.debug('queryEnhancements: Setup');
    const router = core.http.createRouter();
    // Register server side APIs
    const client = core.opensearch.legacy.createClient('opensearch_observability', {
      plugins: [PPLPlugin, EnginePlugin],
    });

    core.uiSettings.register(uiSettings);

    const pplSearchStrategy = pplSearchStrategyProvider(this.config$, this.logger, client);
    const sqlSearchStrategy = sqlSearchStrategyProvider(this.config$, this.logger, client);

    data.search.registerSearchStrategy(PPL_SEARCH_STRATEGY, pplSearchStrategy);
    data.search.registerSearchStrategy(SQL_SEARCH_STRATEGY, sqlSearchStrategy);

    defineRoutes(this.logger, router, {
      ppl: pplSearchStrategy,
      sql: sqlSearchStrategy,
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
