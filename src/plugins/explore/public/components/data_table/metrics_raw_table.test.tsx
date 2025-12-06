/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MetricsRawTable } from './metrics_raw_table';
import { IPrometheusSearchResult } from '../../application/utils/state_management/slices';

describe('MetricsRawTable', () => {
  const mockSearchResult: IPrometheusSearchResult = {
    took: 10,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
      total: { value: 0, relation: 'eq' },
      max_score: null,
      hits: [],
    },
    elapsedMs: 10,
    instantHits: {
      hits: [
        {
          _index: 'prometheus',
          _source: {
            __name__: 'node_cpu_seconds_total',
            Time: 1638316800000,
            cpu: '0',
            instance: 'node_exporter:9100',
            job: 'node-exporter',
            mode: 'idle',
            Value: 15276.26,
          },
        },
        {
          _index: 'prometheus',
          _source: {
            __name__: 'node_cpu_seconds_total',
            Time: 1638316800000,
            cpu: '0',
            instance: 'node_exporter:9100',
            job: 'node-exporter',
            mode: 'iowait',
            Value: 14.84,
          },
        },
      ],
      total: 2,
    },
    instantFieldSchema: [
      { name: '__name__', type: 'string' },
      { name: 'Time', type: 'time' },
      { name: 'cpu', type: 'string' },
      { name: 'instance', type: 'string' },
      { name: 'job', type: 'string' },
      { name: 'mode', type: 'string' },
      { name: 'Value', type: 'number' },
    ],
  };

  it('renders without crashing', () => {
    const { container } = render(<MetricsRawTable searchResult={mockSearchResult} />);
    expect(container.querySelector('.euiBasicTable')).toBeInTheDocument();
  });

  it('displays metric in raw format', () => {
    render(<MetricsRawTable searchResult={mockSearchResult} />);
    // Multiple rows will have the metric name
    const metricElements = screen.getAllByText(/node_cpu_seconds_total\{/);
    expect(metricElements.length).toBeGreaterThan(0);
  });

  it('displays value right-aligned', () => {
    render(<MetricsRawTable searchResult={mockSearchResult} />);
    expect(screen.getByText('15276.26')).toBeInTheDocument();
    expect(screen.getByText('14.84')).toBeInTheDocument();
  });

  it('renders expand toggle', () => {
    render(<MetricsRawTable searchResult={mockSearchResult} />);
    expect(screen.getByText('Expand results')).toBeInTheDocument();
  });

  it('expands labels on toggle', () => {
    render(<MetricsRawTable searchResult={mockSearchResult} />);
    const toggle = screen.getByRole('switch');

    // Initially collapsed - check toggle is not checked
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Click to expand
    fireEvent.click(toggle);

    // Check toggle is now checked
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Should now show expanded format with newlines
    const metricElements = screen.getAllByText(/node_cpu_seconds_total\{/);
    expect(metricElements.length).toBeGreaterThan(0);
    // The expanded format should have newlines in the text
    expect(metricElements[0].textContent).toContain('\n');
  });

  it('handles empty search results', () => {
    const emptySearchResult: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: [],
        total: 0,
      },
    };

    const { container } = render(<MetricsRawTable searchResult={emptySearchResult} />);
    expect(container.querySelector('.euiBasicTable')).toBeInTheDocument();
  });

  it('handles missing __name__ field', () => {
    const resultWithoutName: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: [
          {
            _index: 'prometheus',
            _source: {
              Time: 1638316800000,
              cpu: '0',
              mode: 'idle',
              Value: 0.95,
            },
          },
        ],
        total: 1,
      },
    };

    render(<MetricsRawTable searchResult={resultWithoutName} />);
    // Should still render labels without metric name
    expect(screen.getByText(/cpu="0"/)).toBeInTheDocument();
  });

  it('handles missing _source', () => {
    const resultWithMissingSource: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: [
          {
            _index: 'prometheus',
            _source: {
              __name__: 'test_metric',
              Time: 1638316800000,
              Value: 0.95,
            },
          },
          {} as any, // Row with missing _source
        ],
        total: 2,
      },
    };

    const { container } = render(<MetricsRawTable searchResult={resultWithMissingSource} />);
    expect(container.querySelector('.euiBasicTable')).toBeInTheDocument();
  });

  it('handles missing Value field', () => {
    const resultWithMissingValue: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: [
          {
            _index: 'prometheus',
            _source: {
              __name__: 'test_metric',
              Time: 1638316800000,
              cpu: '0',
              // Value is missing
            },
          },
        ],
        total: 1,
      },
    };

    render(<MetricsRawTable searchResult={resultWithMissingValue} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('handles pagination', () => {
    const manyHits = Array.from({ length: 100 }, (_, i) => ({
      _index: 'prometheus',
      _source: {
        __name__: 'test_metric',
        Time: 1638316800000 + i * 1000,
        index: String(i),
        Value: i,
      },
    }));

    const largeResult: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: manyHits,
        total: 100,
      },
    };

    const { container } = render(<MetricsRawTable searchResult={largeResult} />);
    expect(container.querySelector('.euiBasicTable')).toBeInTheDocument();
    // Default page size is 50, so should show pagination
    expect(container.querySelector('.euiPagination')).toBeInTheDocument();
  });
});
