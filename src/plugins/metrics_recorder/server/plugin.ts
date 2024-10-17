/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { first } from 'rxjs/operators';
import {
  PluginInitializerContext,
  Logger,
  CoreSetup,
  CoreStart,
  Plugin,
} from 'opensearch-dashboards/server';
import { ConfigType } from './config';
import { setupRoutes } from './routes';
import { MetricsRecorderFactory } from './types';

export interface MetricsRecorderSetup {
  setMetricsRecorderFactory: (factory: MetricsRecorderFactory) => void;
}

export class MetricsRecorderPlugin implements Plugin<MetricsRecorderSetup> {
  private readonly logger: Logger;
  private metricsRecorderFactory?: MetricsRecorderFactory;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = this.initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    const config = await this.initializerContext.config
      .create<ConfigType>()
      .pipe(first())
      .toPromise();

    const globalConfig = await this.initializerContext.config.legacy.globalConfig$
      .pipe(first())
      .toPromise();

    const router = core.http.createRouter();
    setupRoutes({
      router,
      logger: this.logger,
      getMetricsRecorder: () => {
        if (!this.metricsRecorderFactory) {
          throw new Error('Metrics recorder factory not set');
        }
        return this.metricsRecorderFactory();
      },
      config: {
        allowAnonymous: core.status.isStatusPageAnonymous(),
        opensearchDashboardsIndex: globalConfig.opensearchDashboards.index,
        opensearchDashboardsVersion: this.initializerContext.env.packageInfo.version,
        server: core.http.getServerInfo(),
        uuid: this.initializerContext.env.instanceUuid,
        batchingInterval: config.record.batchingIntervalInS,
      },
      metrics: core.metrics,
      overallStatus$: core.status.overall$,
    });

    return {
      setMetricsRecorderFactory: (factory: MetricsRecorderFactory) => {
        if (this.metricsRecorderFactory) {
          throw new Error('Metrics recorder factory is already set');
        }
        this.metricsRecorderFactory = factory;
      },
    };
  }

  public start({}: CoreStart) {}

  public stop() {
    this.logger.debug('Stopping plugin');
  }
}
