/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin,
  PluginInitializerContext,
  SharedGlobalConfig,
} from '../../../src/core/server';
import { SEARCH_STRATEGY } from '../common';
import { defineRoutes } from './routes';
import { pplSearchStrategyProvider, sqlSearchStrategyProvider } from './search';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
} from './types';
import { OpenSearchPPLPlugin, OpenSearchObservabilityPlugin } from './utils';

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
      plugins: [OpenSearchPPLPlugin, OpenSearchObservabilityPlugin],
    });

    const pplSearchStrategy = pplSearchStrategyProvider(this.config$, this.logger, client);
    const sqlSearchStrategy = sqlSearchStrategyProvider(this.config$, this.logger, client);

    data.search.registerSearchStrategy(SEARCH_STRATEGY.PPL, pplSearchStrategy);
    data.search.registerSearchStrategy(SEARCH_STRATEGY.SQL, sqlSearchStrategy);

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
