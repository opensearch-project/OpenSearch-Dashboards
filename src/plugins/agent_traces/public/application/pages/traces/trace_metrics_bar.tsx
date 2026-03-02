/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TraceMetrics } from './hooks/use_trace_metrics';
import { formatDuration } from './hooks/span_transforms';
import './trace_metrics_bar.scss';

interface TraceMetricsBarProps {
  metrics: TraceMetrics | null;
  loading: boolean;
}

const formatNumber = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  }
  return value.toLocaleString();
};

const MetricItem: React.FC<{ label: string; value: string; loading?: boolean }> = ({
  label,
  value,
  loading,
}) => (
  <EuiFlexGroup gutterSize="s" alignItems="baseline" responsive={false}>
    <EuiFlexItem grow={false}>
      <EuiText size="s" color="subdued">
        {label}
      </EuiText>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiText size="s" color={loading ? 'subdued' : 'default'}>
        <strong>{loading ? '——' : value}</strong>
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

export const TraceMetricsBar: React.FC<TraceMetricsBarProps> = ({ metrics, loading }) => {
  const showLoading = loading || !metrics;

  return (
    <div className="agentTracesMetrics__bar">
      <EuiFlexGroup gutterSize="l" alignItems="center" responsive={false} wrap>
        <EuiFlexItem grow={false}>
          <MetricItem
            label={i18n.translate('agentTraces.metricsBar.totalTraces', {
              defaultMessage: 'Total Traces',
            })}
            value={metrics ? formatNumber(metrics.totalTraces) : '—'}
            loading={showLoading}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <MetricItem
            label={i18n.translate('agentTraces.metricsBar.totalSpans', {
              defaultMessage: 'Total Spans',
            })}
            value={metrics ? formatNumber(metrics.totalSpans) : '—'}
            loading={showLoading}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <MetricItem
            label={i18n.translate('agentTraces.metricsBar.totalTokens', {
              defaultMessage: 'Total Tokens',
            })}
            value={metrics ? formatNumber(metrics.totalTokens) : '—'}
            loading={showLoading}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <MetricItem
            label={i18n.translate('agentTraces.metricsBar.latencyP50', {
              defaultMessage: 'Latency P50',
            })}
            value={metrics ? formatDuration(metrics.latencyP50Nanos) : '—'}
            loading={showLoading}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <MetricItem
            label={i18n.translate('agentTraces.metricsBar.latencyP99', {
              defaultMessage: 'Latency P99',
            })}
            value={metrics ? formatDuration(metrics.latencyP99Nanos) : '—'}
            loading={showLoading}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
