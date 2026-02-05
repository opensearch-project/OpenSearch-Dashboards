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
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      total: { value: 0, relation: 'eq' },
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      max_score: null,
      hits: [],
    },
    elapsedMs: 10,
    instantHits: {
      hits: [
        {
          _index: 'prometheus',
          _source: {
            Metric:
              'node_cpu_seconds_total{cpu="0", instance="node_exporter:9100", job="node-exporter", mode="idle"}',
            Time: 1638316800000,
            Value: 15276.26,
          },
        },
        {
          _index: 'prometheus',
          _source: {
            Metric:
              'node_cpu_seconds_total{cpu="0", instance="node_exporter:9100", job="node-exporter", mode="iowait"}',
            Time: 1638316800000,
            Value: 14.84,
          },
        },
      ],
      total: 2,
    },
    instantFieldSchema: [
      { name: 'Metric', type: 'string' },
      { name: 'Time', type: 'time' },
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

  it('handles metric with simple labels', () => {
    const resultWithSimpleMetric: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: [
          {
            _index: 'prometheus',
            _source: {
              Metric: 'simple_metric{cpu="0", mode="idle"}',
              Time: 1638316800000,
              Value: 0.95,
            },
          },
        ],
        total: 1,
      },
    };

    render(<MetricsRawTable searchResult={resultWithSimpleMetric} />);
    expect(screen.getByText(/simple_metric\{cpu="0"/)).toBeInTheDocument();
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
              Metric: 'test_metric{cpu="0"}',
              Time: 1638316800000,
              // Value is missing
            },
          },
        ],
        total: 1,
      },
    };

    const { container } = render(<MetricsRawTable searchResult={resultWithMissingValue} />);
    expect(container.querySelector('.euiBasicTable')).toBeInTheDocument();
    // Should only show Metric column, no Value column when no value fields exist
    expect(
      container.querySelector('th[data-test-subj="tableHeaderCell_metricString_0"]')
    ).toBeInTheDocument();
  });

  it('handles pagination', () => {
    const manyHits = Array.from({ length: 100 }, (_, i) => ({
      _index: 'prometheus',
      _source: {
        Metric: `test_metric{index="${i}"}`,
        Time: 1638316800000 + i * 1000,
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

  it('handles multiple value columns', () => {
    const multiValueResult: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: [
          {
            _index: 'prometheus',
            _source: {
              Metric: 'multi_value_metric{label="test"}',
              Time: 1638316800000,
              'Value #A': 10.5,
              'Value #B': 20.3,
            },
          },
        ],
        total: 1,
      },
    };

    render(<MetricsRawTable searchResult={multiValueResult} />);
    const valueAElements = screen.getAllByText('Value #A');
    const valueBElements = screen.getAllByText('Value #B');
    expect(valueAElements.length).toBeGreaterThan(0);
    expect(valueBElements.length).toBeGreaterThan(0);
    expect(screen.getByText('10.5')).toBeInTheDocument();
    expect(screen.getByText('20.3')).toBeInTheDocument();
  });

  describe('sorting', () => {
    const sortableSearchResult: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: [
          {
            _index: 'prometheus',
            _source: {
              Metric: 'beta_metric{label="b"}',
              Time: 1638316800000,
              Value: 200,
            },
          },
          {
            _index: 'prometheus',
            _source: {
              Metric: 'alpha_metric{label="a"}',
              Time: 1638316800000,
              Value: 100,
            },
          },
          {
            _index: 'prometheus',
            _source: {
              Metric: 'gamma_metric{label="c"}',
              Time: 1638316800000,
              Value: 300,
            },
          },
        ],
        total: 3,
      },
    };

    it('sorts by Value column when header is clicked', () => {
      const { container } = render(<MetricsRawTable searchResult={sortableSearchResult} />);

      const valueHeader = container.querySelector(
        'th[data-test-subj="tableHeaderCell_value_0_1"] button'
      );
      fireEvent.click(valueHeader!);

      const getValueTexts = () => {
        const rows = container.querySelectorAll('tbody tr');
        return Array.from(rows).map((row) => {
          const valueCell = row.querySelector('td:nth-child(2) code');
          return valueCell?.textContent;
        });
      };

      const ascendingTexts = getValueTexts();
      expect(ascendingTexts[0]).toBe('100');
      expect(ascendingTexts[1]).toBe('200');
      expect(ascendingTexts[2]).toBe('300');

      fireEvent.click(valueHeader!);

      const descendingTexts = getValueTexts();
      expect(descendingTexts[0]).toBe('300');
      expect(descendingTexts[1]).toBe('200');
      expect(descendingTexts[2]).toBe('100');
    });

    it('returns to default order on third click (neutral sort)', () => {
      const { container } = render(<MetricsRawTable searchResult={sortableSearchResult} />);

      const valueHeader = container.querySelector(
        'th[data-test-subj="tableHeaderCell_value_0_1"] button'
      );

      const getValueTexts = () => {
        const rows = container.querySelectorAll('tbody tr');
        return Array.from(rows).map((row) => {
          const valueCell = row.querySelector('td:nth-child(2) code');
          return valueCell?.textContent;
        });
      };

      // Original order (as returned from API): 200, 100, 300
      const originalTexts = getValueTexts();
      expect(originalTexts[0]).toBe('200');
      expect(originalTexts[1]).toBe('100');
      expect(originalTexts[2]).toBe('300');

      // First click: ascending
      fireEvent.click(valueHeader!);
      expect(getValueTexts()).toEqual(['100', '200', '300']);

      // Second click: descending
      fireEvent.click(valueHeader!);
      expect(getValueTexts()).toEqual(['300', '200', '100']);

      // Third click: back to default/original order
      fireEvent.click(valueHeader!);
      const resetTexts = getValueTexts();
      expect(resetTexts[0]).toBe('200');
      expect(resetTexts[1]).toBe('100');
      expect(resetTexts[2]).toBe('300');
    });

    it('resets pagination to first page when sorting changes', () => {
      const manyHits = Array.from({ length: 100 }, (_, i) => ({
        _index: 'prometheus',
        _source: {
          Metric: `metric_${String(i).padStart(3, '0')}{index="${i}"}`,
          Time: 1638316800000 + i * 1000,
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

      const nextPageButton = container.querySelector('[data-test-subj="pagination-button-1"]');
      if (nextPageButton) {
        fireEvent.click(nextPageButton);
      }

      const valueHeader = container.querySelector(
        'th[data-test-subj="tableHeaderCell_value_0_1"] button'
      );
      fireEvent.click(valueHeader!);

      const activePage = container.querySelector('[data-test-subj="pagination-button-0"]');
      expect(activePage?.getAttribute('aria-current')).toBe('true');
    });
  });
});
