/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  Capabilities,
  CoreSetup,
  CoreStart,
  Logger,
  OpenSearchDashboardsRequest,
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
  promqlSearchStrategyProvider,
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
import { queryManagerService } from './connections/query_manager_service';
import { BaseConnectionManager } from './connections/managers/base_connection_manager';
import { prometheusManager } from './connections/managers/prometheus_manager';
import { getIndexPruningSettings, getPplLintRuleSettings } from './ui_settings';
import { defaultFeatureFlags, readFeatureFlags } from './utils/feature_flags';

export class QueryEnhancementsPlugin implements Plugin<
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginStart
> {
  private readonly logger: Logger;
  private readonly config$: Observable<SharedGlobalConfig>;
  private capabilitiesResolver?: (request: OpenSearchDashboardsRequest) => Promise<Capabilities>;

  constructor(private initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.legacy.globalConfig$;
  }

  public async setup(
    core: CoreSetup,
    { data, dataSource }: QueryEnhancementsPluginSetupDependencies
  ) {
    this.logger.debug('queryEnhancements: Setup');

    // Feature capabilities — all disabled by default. Each is declared once in
    // QUERY_ENHANCEMENTS_FEATURE_FLAGS; consumers read
    // capabilities.queryEnhancements.<name>. The switcher below overrides these
    // defaults from DynamicConfigService.
    core.capabilities.registerProvider(() => ({
      queryEnhancements: defaultFeatureFlags(),
    }));

    // Override the defaults with the values from DynamicConfigService.
    core.capabilities.registerSwitcher(async (request, capabilities) => {
      try {
        const dynamicConfigServiceStart = await core.dynamicConfigService.getStartService();
        const client = dynamicConfigServiceStart.getClient();
        const store = dynamicConfigServiceStart.getAsyncLocalStore();

        // Return only the changed subtree; recursiveApplyChanges merges it onto
        // the resolved capabilities.
        return {
          queryEnhancements: {
            ...(capabilities.queryEnhancements || {}),
            ...(await readFeatureFlags(client, store)),
          },
        };
      } catch (error) {
        this.logger.error('Failed to load queryEnhancements dynamic config, using defaults', error);
        return capabilities;
      }
    });

    core.uiSettings.register(getPplLintRuleSettings(core.workspace.isWorkspaceEnabled()));
    core.uiSettings.register(getIndexPruningSettings(core.workspace.isWorkspaceEnabled()));

    const router = core.http.createRouter();
    // Register server side APIs
    const client = core.opensearch.legacy.createClient('opensearch_enhancements', {
      plugins: [OpenSearchEnhancements],
    });

    if (dataSource) {
      dataSource.registerCustomApiSchema(OpenSearchEnhancements);
    }

    // Initialize the default query executor for prometheus
    prometheusManager.initializeDefaultQueryExecutor(client);

    // Read the scoped config flag that gates legacy Elasticsearch compatibility (Open Distro
    // endpoint routing). Await the first emission so the strategies below are always constructed
    // with the resolved value rather than relying on synchronous observable emission.
    const queryEnhancementsConfig = await this.initializerContext.config
      .create<ConfigSchema>()
      .pipe(first())
      .toPromise();
    const legacyEsCompatEnabled =
      queryEnhancementsConfig.legacyElasticsearchCompatibility?.enabled ?? false;

    const pplSearchStrategy = pplSearchStrategyProvider(
      this.config$,
      this.logger,
      client,
      undefined,
      legacyEsCompatEnabled
    );
    const pplRawSearchStrategy = pplRawSearchStrategyProvider(this.config$, this.logger, client);
    const promqlSearchStrategy = promqlSearchStrategyProvider(this.config$, this.logger);
    const sqlSearchStrategy = sqlSearchStrategyProvider(
      this.config$,
      this.logger,
      client,
      undefined,
      legacyEsCompatEnabled
    );
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
    data.search.registerSearchStrategy(SEARCH_STRATEGY.PROMQL, promqlSearchStrategy);

    const getCapabilitiesResolver = () => this.capabilitiesResolver;

    // @ts-ignore https://github.com/opensearch-project/openSearch-Dashboards/issues/4274
    core.http.registerRouteHandlerContext('query_assist', () => ({
      logger: this.logger,
      configPromise: this.initializerContext.config
        .create<ConfigSchema>()
        .pipe(first())
        .toPromise(),
      dataSourceEnabled: !!dataSource,
      getCapabilitiesResolver,
    }));

    // @ts-ignore https://github.com/opensearch-project/openSearch-Dashboards/issues/4274
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
      promql: promqlSearchStrategy,
      sqlasync: sqlAsyncSearchStrategy,
      pplasync: pplAsyncSearchStrategy,
    });

    resourceManagerService.register('prometheus', prometheusManager);
    queryManagerService.register('prometheus', prometheusManager);

    this.logger.info('queryEnhancements: Setup complete');
    return {
      defineSearchStrategyRoute: defineSearchStrategyRouteProvider(this.logger, router),
      registerResourceManager: (dataConnectionType: string, manager: BaseConnectionManager) =>
        resourceManagerService.register(dataConnectionType, manager),
      registerQueryManager: (dataConnectionType: string, manager: BaseConnectionManager) =>
        queryManagerService.register(dataConnectionType, manager),
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('queryEnhancements: Started');

    this.capabilitiesResolver = (request: OpenSearchDashboardsRequest) =>
      core.capabilities.resolveCapabilities(request);

    return {};
  }

  public stop() {}
}
