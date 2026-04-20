/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { MetricsEmptyState } from './metrics_empty_state';

describe('MetricsEmptyState', () => {
  it('renders title, body, and sample queries section', () => {
    render(<MetricsEmptyState title="Empty title" body="Empty body" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Empty title' })).toBeInTheDocument();
    expect(screen.getByText('Empty body')).toBeInTheDocument();
    expect(screen.getByText('Sample PromQL queries')).toBeInTheDocument();
  });

  it('renders all sample query labels and code blocks', () => {
    render(<MetricsEmptyState title="t" body="b" />);

    expect(screen.getByText('HTTP request rate by status code')).toBeInTheDocument();
    expect(screen.getByText('CPU usage per instance')).toBeInTheDocument();
    expect(screen.getByText('Error rate (5xx)')).toBeInTheDocument();
    expect(screen.getByText('p95 request latency')).toBeInTheDocument();
  });

  it('does not render sample triggers when onSelectQuery is omitted', () => {
    render(<MetricsEmptyState title="t" body="b" />);
    expect(screen.queryAllByRole('button', { name: /Use sample query/ })).toHaveLength(0);
  });

  it('invokes onSelectQuery with the sample query on click', () => {
    const onSelectQuery = jest.fn();
    render(<MetricsEmptyState title="t" body="b" onSelectQuery={onSelectQuery} />);

    const trigger = screen.getByRole('button', {
      name: 'Use sample query: HTTP request rate by status code',
    });
    fireEvent.click(trigger);

    expect(onSelectQuery).toHaveBeenCalledWith(
      'sum by (status_code) (rate(http_requests_total[5m]))'
    );
  });

  it('invokes onSelectQuery on Enter and Space keydown', () => {
    const onSelectQuery = jest.fn();
    render(<MetricsEmptyState title="t" body="b" onSelectQuery={onSelectQuery} />);

    const trigger = screen.getByRole('button', {
      name: 'Use sample query: CPU usage per instance',
    });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: ' ' });
    fireEvent.keyDown(trigger, { key: 'a' });

    expect(onSelectQuery).toHaveBeenCalledTimes(2);
  });
});
