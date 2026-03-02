/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TraceMetricsBar } from './trace_metrics_bar';
import { TraceMetrics } from './hooks/use_trace_metrics';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_key: string, opts: { defaultMessage: string }) => opts.defaultMessage,
  },
}));

const mockMetrics: TraceMetrics = {
  totalTraces: 1500,
  totalSpans: 2500000,
  totalTokens: 500,
  latencyP50Nanos: 250_000_000,
  latencyP99Nanos: 3_500_000_000,
};

describe('TraceMetricsBar', () => {
  it('renders loading placeholders when loading', () => {
    render(<TraceMetricsBar metrics={null} loading={true} />);
    const dashes = screen.getAllByText('——');
    expect(dashes.length).toBe(5);
  });

  it('renders metric values when loaded', () => {
    render(<TraceMetricsBar metrics={mockMetrics} loading={false} />);
    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getByText('2.50M')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('250ms')).toBeInTheDocument();
    expect(screen.getByText('3.50s')).toBeInTheDocument();
  });

  it('renders labels', () => {
    render(<TraceMetricsBar metrics={mockMetrics} loading={false} />);
    expect(screen.getByText('Total Traces')).toBeInTheDocument();
    expect(screen.getByText('Total Spans')).toBeInTheDocument();
    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
    expect(screen.getByText('Latency P50')).toBeInTheDocument();
    expect(screen.getByText('Latency P99')).toBeInTheDocument();
  });

  it('formats small latency as ms', () => {
    const metrics = { ...mockMetrics, latencyP50Nanos: 5_000_000 };
    render(<TraceMetricsBar metrics={metrics} loading={false} />);
    expect(screen.getByText('5ms')).toBeInTheDocument();
  });

  it('formats sub-ms latency with decimals', () => {
    const metrics = { ...mockMetrics, latencyP50Nanos: 500_000 };
    render(<TraceMetricsBar metrics={metrics} loading={false} />);
    expect(screen.getByText('0.50ms')).toBeInTheDocument();
  });

  it('formats zero latency as dash', () => {
    const metrics = { ...mockMetrics, latencyP50Nanos: 0 };
    render(<TraceMetricsBar metrics={metrics} loading={false} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats large numbers with K suffix', () => {
    const metrics = { ...mockMetrics, totalTraces: 15000 };
    render(<TraceMetricsBar metrics={metrics} loading={false} />);
    expect(screen.getByText('15K')).toBeInTheDocument();
  });
});
