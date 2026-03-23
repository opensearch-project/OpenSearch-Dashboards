/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiStat,
  EuiText,
  EuiTextColor,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TraceMetrics } from './hooks/use_trace_metrics';
import { formatDuration } from './hooks/span_transforms';
import './trace_metrics_bar.scss';

interface TraceMetricsBarProps {
  metrics: TraceMetrics | null;
  onErrorClick?: (target: 'traces' | 'spans') => void;
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

export const TraceMetricsBar: React.FC<TraceMetricsBarProps> = ({ metrics, onErrorClick }) => {
  const [showMetrics, setShowMetrics] = useState(true);
  const showLoading = !metrics;

  const toggleLabel = i18n.translate('agentTraces.metricsBar.toggleMetrics', {
    defaultMessage: 'Toggle metrics',
  });

  return (
    <div className="agentTracesMetrics__bar">
      <EuiFlexGroup
        gutterSize="s"
        alignItems={showMetrics ? 'flexStart' : 'center'}
        responsive={false}
        wrap={false}
      >
        <EuiFlexItem grow={false}>
          <EuiToolTip content={toggleLabel}>
            <EuiButtonIcon
              aria-expanded={showMetrics}
              aria-label={toggleLabel}
              data-test-subj="agentTracesMetricsCollapseBtn"
              onClick={() => setShowMetrics(!showMetrics)}
              iconType={showMetrics ? 'arrowDown' : 'arrowRight'}
            />
          </EuiToolTip>
        </EuiFlexItem>
        {showMetrics ? (
          <EuiFlexItem grow className="agentTracesMetrics__content">
            <EuiFlexGroup gutterSize="xl" alignItems="flexStart" responsive={false} wrap>
              <EuiFlexItem grow={false}>
                <EuiStat
                  title={metrics ? formatNumber(metrics.totalTraces) : '—'}
                  description={
                    <EuiTextColor color="subdued">
                      {i18n.translate('agentTraces.metricsBar.totalTraces', {
                        defaultMessage: 'Total Traces',
                      })}
                    </EuiTextColor>
                  }
                  titleSize="s"
                  isLoading={showLoading}
                  data-test-subj="agentTracesMetricsTotalTraces"
                >
                  {metrics && metrics.errorTraces > 0 && (
                    <EuiLink
                      color="danger"
                      onClick={() => onErrorClick?.('traces')}
                      data-test-subj="agentTracesMetricsErrorTracesLink"
                    >
                      <EuiText size="xs" color="danger">
                        <strong>
                          {i18n.translate('agentTraces.metricsBar.errorTraces', {
                            defaultMessage:
                              '{formattedCount} {count, plural, one {error} other {errors}}',
                            values: {
                              count: metrics.errorTraces,
                              formattedCount: formatNumber(metrics.errorTraces),
                            },
                          })}
                        </strong>
                      </EuiText>
                    </EuiLink>
                  )}
                </EuiStat>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiStat
                  title={metrics ? formatNumber(metrics.totalSpans) : '—'}
                  description={
                    <EuiTextColor color="subdued">
                      {i18n.translate('agentTraces.metricsBar.totalSpans', {
                        defaultMessage: 'Total Spans',
                      })}
                    </EuiTextColor>
                  }
                  titleSize="s"
                  isLoading={showLoading}
                  data-test-subj="agentTracesMetricsTotalSpans"
                >
                  {metrics && metrics.errorSpans > 0 && (
                    <EuiLink
                      color="danger"
                      onClick={() => onErrorClick?.('spans')}
                      data-test-subj="agentTracesMetricsErrorSpansLink"
                    >
                      <EuiText size="xs" color="danger">
                        <strong>
                          {i18n.translate('agentTraces.metricsBar.errorSpans', {
                            defaultMessage:
                              '{formattedCount} {count, plural, one {error} other {errors}}',
                            values: {
                              count: metrics.errorSpans,
                              formattedCount: formatNumber(metrics.errorSpans),
                            },
                          })}
                        </strong>
                      </EuiText>
                    </EuiLink>
                  )}
                </EuiStat>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiStat
                  title={metrics ? formatNumber(metrics.totalTokens) : '—'}
                  description={
                    <EuiTextColor color="subdued">
                      {i18n.translate('agentTraces.metricsBar.totalTokens', {
                        defaultMessage: 'Total Tokens',
                      })}
                    </EuiTextColor>
                  }
                  titleSize="s"
                  isLoading={showLoading}
                  data-test-subj="agentTracesMetricsTotalTokens"
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiStat
                  title={metrics ? formatDuration(metrics.latencyP50Nanos) : '—'}
                  description={
                    <EuiTextColor color="subdued">
                      {i18n.translate('agentTraces.metricsBar.latencyP50', {
                        defaultMessage: 'Latency P50',
                      })}
                    </EuiTextColor>
                  }
                  titleSize="s"
                  isLoading={showLoading}
                  data-test-subj="agentTracesMetricsLatencyP50"
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiStat
                  title={metrics ? formatDuration(metrics.latencyP99Nanos) : '—'}
                  description={
                    <EuiTextColor color="subdued">
                      {i18n.translate('agentTraces.metricsBar.latencyP99', {
                        defaultMessage: 'Latency P99',
                      })}
                    </EuiTextColor>
                  }
                  titleSize="s"
                  isLoading={showLoading}
                  data-test-subj="agentTracesMetricsLatencyP99"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        ) : (
          <EuiFlexItem grow={false}>
            <EuiText size="s">
              <strong>
                {i18n.translate('agentTraces.metricsBar.metricsLabel', {
                  defaultMessage: 'Metrics',
                })}
              </strong>
            </EuiText>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </div>
  );
};
