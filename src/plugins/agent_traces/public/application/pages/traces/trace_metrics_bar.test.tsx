/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceMetricsBar } from './trace_metrics_bar';
import { TraceMetrics } from './hooks/use_trace_metrics';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_key: string, opts: { defaultMessage: string; values?: Record<string, any> }) => {
      let msg = opts.defaultMessage;
      if (opts.values) {
        // Handle ICU plural format: {key, plural, one {singular} other {plural}}
        msg = msg.replace(
          /\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/g,
          (_match, key, singular, plural) => {
            const val = opts.values![key];
            return val === 1 ? singular : plural;
          }
        );
        Object.entries(opts.values).forEach(([k, v]) => {
          msg = msg.replace(`{${k}}`, String(v));
        });
      }
      return msg;
    },
  },
}));

const mockMetrics: TraceMetrics = {
  totalTraces: 1500,
  totalSpans: 2500000,
  filteredTraces: 1500,
  filteredSpans: 2500000,
  totalTokens: 500,
  latencyP50Nanos: 250_000_000,
  latencyP99Nanos: 3_500_000_000,
  errorTraces: 23,
  errorSpans: 89,
};

describe('TraceMetricsBar', () => {
  it('renders loading state when loading', () => {
    render(<TraceMetricsBar metrics={null} />);
    expect(screen.getByText('Total Traces')).toBeInTheDocument();
    expect(screen.getByText('Total Spans')).toBeInTheDocument();
    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
    expect(screen.getByText('Latency P50')).toBeInTheDocument();
    expect(screen.getByText('Latency P99')).toBeInTheDocument();
  });

  it('renders metric values when loaded', () => {
    render(<TraceMetricsBar metrics={mockMetrics} />);
    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getByText('2.50M')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('250ms')).toBeInTheDocument();
    expect(screen.getByText('3.50s')).toBeInTheDocument();
  });

  it('renders labels', () => {
    render(<TraceMetricsBar metrics={mockMetrics} />);
    expect(screen.getByText('Total Traces')).toBeInTheDocument();
    expect(screen.getByText('Total Spans')).toBeInTheDocument();
    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
    expect(screen.getByText('Latency P50')).toBeInTheDocument();
    expect(screen.getByText('Latency P99')).toBeInTheDocument();
  });

  it('renders error counts when present', () => {
    render(<TraceMetricsBar metrics={mockMetrics} />);
    expect(screen.getByText('23 errors')).toBeInTheDocument();
    expect(screen.getByText('89 errors')).toBeInTheDocument();
  });

  it('does not render error counts when zero', () => {
    const metricsNoErrors = { ...mockMetrics, errorTraces: 0, errorSpans: 0 };
    render(<TraceMetricsBar metrics={metricsNoErrors} />);
    expect(screen.queryByText(/errors/)).not.toBeInTheDocument();
  });

  it('formats error counts with K suffix for large numbers', () => {
    const metricsLargeErrors = { ...mockMetrics, errorTraces: 15000, errorSpans: 2500000 };
    render(<TraceMetricsBar metrics={metricsLargeErrors} />);
    expect(screen.getByText('15K errors')).toBeInTheDocument();
    expect(screen.getByText('2.50M errors')).toBeInTheDocument();
  });

  it('formats small latency as ms', () => {
    const metrics = { ...mockMetrics, latencyP50Nanos: 5_000_000 };
    render(<TraceMetricsBar metrics={metrics} />);
    expect(screen.getByText('5ms')).toBeInTheDocument();
  });

  it('formats sub-ms latency with decimals', () => {
    const metrics = { ...mockMetrics, latencyP50Nanos: 500_000 };
    render(<TraceMetricsBar metrics={metrics} />);
    expect(screen.getByText('0.50ms')).toBeInTheDocument();
  });

  it('formats zero latency as dash', () => {
    const metrics = { ...mockMetrics, latencyP50Nanos: 0 };
    render(<TraceMetricsBar metrics={metrics} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats large numbers with K suffix', () => {
    const metrics = { ...mockMetrics, totalTraces: 15000 };
    render(<TraceMetricsBar metrics={metrics} />);
    expect(screen.getByText('15K')).toBeInTheDocument();
  });

  it('calls onErrorClick with traces when trace error link is clicked', () => {
    const onErrorClick = jest.fn();
    render(<TraceMetricsBar metrics={mockMetrics} onErrorClick={onErrorClick} />);
    fireEvent.click(screen.getByTestId('agentTracesMetricsErrorTracesLink'));
    expect(onErrorClick).toHaveBeenCalledWith('traces');
  });

  it('calls onErrorClick with spans when span error link is clicked', () => {
    const onErrorClick = jest.fn();
    render(<TraceMetricsBar metrics={mockMetrics} onErrorClick={onErrorClick} />);
    fireEvent.click(screen.getByTestId('agentTracesMetricsErrorSpansLink'));
    expect(onErrorClick).toHaveBeenCalledWith('spans');
  });

  it('renders error counts as links', () => {
    render(<TraceMetricsBar metrics={mockMetrics} />);
    expect(screen.getByTestId('agentTracesMetricsErrorTracesLink')).toBeInTheDocument();
    expect(screen.getByTestId('agentTracesMetricsErrorSpansLink')).toBeInTheDocument();
  });
});
