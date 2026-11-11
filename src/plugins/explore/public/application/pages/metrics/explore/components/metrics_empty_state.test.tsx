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

  it('renders sample triggers as native <button> for built-in keyboard activation', () => {
    render(<MetricsEmptyState title="t" body="b" onSelectQuery={jest.fn()} />);

    const trigger = screen.getByRole('button', {
      name: 'Use sample query: CPU usage per instance',
    });

    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('type', 'button');
  });

  it("shows a language's own description and samples in place of Prometheus's", () => {
    render(
      <MetricsEmptyState
        title="t"
        body="b"
        description="Query another store"
        sampleQueries={[{ label: 'Top CPU', query: 'SELECT AVG(CPUUtilization) FROM x' }]}
        sampleQueriesTitle="Sample SQL queries"
        codeLanguage="sql"
      />
    );
    expect(screen.getByText('Query another store')).toBeInTheDocument();
    expect(screen.getByText('Sample SQL queries')).toBeInTheDocument();
    expect(screen.getByText('Top CPU')).toBeInTheDocument();
    expect(screen.queryByText('CPU usage per instance')).not.toBeInTheDocument();
  });

  it('hides the samples section when there are none', () => {
    render(<MetricsEmptyState title="t" body="b" sampleQueries={[]} />);
    expect(screen.queryByText('Sample PromQL queries')).not.toBeInTheDocument();
  });
});
