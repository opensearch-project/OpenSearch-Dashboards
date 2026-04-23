/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCodeBlock, EuiEmptyPrompt, EuiPanel, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import './metrics_empty_state.scss';

interface SampleQuery {
  label: string;
  query: string;
}

const SAMPLE_QUERIES: SampleQuery[] = [
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
    query: 'histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))',
  },
];

export interface MetricsEmptyStateProps {
  title: string;
  body: string;
  iconType?: string;
  onSelectQuery?: (query: string) => void;
}

export const MetricsEmptyState: React.FC<MetricsEmptyStateProps> = ({
  title,
  body,
  iconType = 'metricsApp',
  onSelectQuery,
}) => {
  return (
    <EuiEmptyPrompt
      iconType={iconType}
      title={<h2>{title}</h2>}
      body={
        <>
          <EuiText size="s" color="subdued">
            <p>{body}</p>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiPanel paddingSize="m" color="subdued" hasShadow={false} hasBorder={false}>
            <EuiTitle size="xxs">
              <h3>
                {i18n.translate('explore.metricsExplore.sampleQueriesTitle', {
                  defaultMessage: 'Sample PromQL queries',
                })}
              </h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            {SAMPLE_QUERIES.map((sample) => {
              const codeBlock = (
                <EuiCodeBlock
                  language="promql"
                  fontSize="s"
                  paddingSize="s"
                  isCopyable
                  transparentBackground={false}
                >
                  {sample.query}
                </EuiCodeBlock>
              );
              return (
                <div key={sample.label} style={{ textAlign: 'left' }}>
                  <EuiText size="xs">
                    <strong>{sample.label}</strong>
                  </EuiText>
                  <EuiSpacer size="xs" />
                  {onSelectQuery ? (
                    <button
                      type="button"
                      className="metricsEmptyState__sampleTrigger"
                      onClick={() => onSelectQuery(sample.query)}
                      aria-label={i18n.translate('explore.metricsExplore.useSampleQuery', {
                        defaultMessage: 'Use sample query: {label}',
                        values: { label: sample.label },
                      })}
                    >
                      {codeBlock}
                    </button>
                  ) : (
                    codeBlock
                  )}
                  <EuiSpacer size="s" />
                </div>
              );
            })}
          </EuiPanel>
        </>
      }
    />
  );
};
