/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import type { SourceTypeLanguageGuide } from './source_type_registry_service';

/**
 * What the query panel says about Explore's own languages on the built-in source: no label or
 * description of their own, so the panel reads as it did before sources could describe their
 * languages. A registered source that lists one of these languages describes it itself.
 */
export const BUILT_IN_LANGUAGE_GUIDES: Record<string, SourceTypeLanguageGuide> = {
  SQL: { codeLanguage: 'sql' },
  PROMQL: {
    codeLanguage: 'promql',
    sampleQueries: [
      {
        label: i18n.translate('explore.metricsExplore.samples.requestRate', {
          defaultMessage: 'HTTP request rate by status code',
        }),
        query: 'sum by (status_code) (rate(http_requests_total[5m]))',
      },
      {
        label: i18n.translate('explore.metricsExplore.samples.cpuUsage', {
          defaultMessage: 'CPU usage per instance',
        }),
        query: '100 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m]) * 100)',
      },
      {
        label: i18n.translate('explore.metricsExplore.samples.errorRate', {
          defaultMessage: 'Error rate (5xx)',
        }),
        query:
          'sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))',
      },
      {
        label: i18n.translate('explore.metricsExplore.samples.latencyP95', {
          defaultMessage: 'p95 request latency',
        }),
        query:
          'histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))',
      },
    ],
  },
};
