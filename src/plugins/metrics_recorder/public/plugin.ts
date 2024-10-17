/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Reporter, METRIC_TYPE } from '@osd/analytics';
import { Storage } from '../../opensearch_dashboards_utils/public';
import { createReporter } from './services';
import {
  PluginInitializerContext,
  Plugin,
  CoreSetup,
  CoreStart,
  HttpSetup,
} from '../../../core/public';

interface PublicConfigType {
  record: {
    enabled: boolean;
    debug: boolean;
    reportIntervalInS: number;
  };
}

export interface MetricsRecorderSetup {
  recordCount: (appName: string, metricName: string, count?: number) => void;
}

export type MetricsRecorderStart = MetricsRecorderSetup;

export function isUnauthenticated(http: HttpSetup) {
  const { anonymousPaths } = http;
  return anonymousPaths.isAnonymous(window.location.pathname);
}

export class MetricsRecorderPlugin implements Plugin<MetricsRecorderSetup, MetricsRecorderStart> {
  private reporter?: Reporter;
  private config: PublicConfigType;
  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<PublicConfigType>();
  }

  public setup({ http }: CoreSetup): MetricsRecorderSetup {
    const localStorage = new Storage(window.localStorage);
    const debug = this.config.record.debug;

    this.reporter = createReporter({
      localStorage,
      debug,
      fetch: http,
      checkInterval: this.config.record.reportIntervalInS * 1000, // report uses milliseconds
    });

    return {
      recordCount: (appName: string, metricName: string, count: number = 1) => {
        this.reporter?.reportUiStats(appName, METRIC_TYPE.COUNT, metricName, count);
      },
    };
  }

  public start({ http, application }: CoreStart) {
    if (!this.reporter) {
      throw new Error('Metrics recorder not set up correctly');
    }

    if (this.config.record.enabled && !isUnauthenticated(http)) {
      this.reporter.start();
    }

    return {
      recordCount: (appName: string, metricName: string, count: number = 1) => {
        this.reporter?.reportUiStats(appName, METRIC_TYPE.COUNT, metricName, count);
      },
    };
  }

  public stop() {}
}
