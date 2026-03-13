/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Reporter, Storage } from '@osd/analytics';
import { HttpSetup } from 'opensearch-dashboards/public';
import { REPORT_URL } from '../../common/constants';

interface AnalyicsReporterConfig {
  localStorage: Storage;
  debug: boolean;
  fetch: HttpSetup;
  checkInterval: number;
}

export function createReporter(config: AnalyicsReporterConfig): Reporter {
  const { localStorage, debug, fetch, checkInterval } = config;

  return new Reporter({
    debug,
    storage: localStorage,
    async http(report) {
      const response = await fetch.post(REPORT_URL, {
        body: JSON.stringify({ report }),
      });

      if (response.status !== 'ok') {
        throw Error('Unable to store report.');
      }
      return response;
    },
    checkInterval,
    storageKey: 'metricsReporter',
  });
}
