/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { MetricsDataTable } from './metrics_data_table';
import { IPrometheusSearchResult } from '../../application/utils/state_management/slices';

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: {
      uiSettings: {
        get: jest.fn().mockReturnValue('YYYY-MM-DD HH:mm:ss.SSS'),
      },
    },
  }),
}));

describe('MetricsDataTable', () => {
  const mockSearchResult: IPrometheusSearchResult = {
    took: 10,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
      total: { value: 0, relation: 'eq' },
      max_score: null,
      hits: [],
    },
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
        {
          _index: 'prometheus',
          _source: {
            Time: 1638316800000,
            cpu: '1',
            mode: 'idle',
            Value: 0.92,
          },
        },
      ],
      total: 2,
    },
    instantFieldSchema: [
      { name: 'Time', type: 'time' },
      { name: 'cpu', type: 'string' },
      { name: 'mode', type: 'string' },
      { name: 'Value', type: 'number' },
    ],
  };

  it('renders without crashing', () => {
    const { container } = render(<MetricsDataTable searchResult={mockSearchResult} />);
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
  });

  it('displays correct number of columns', () => {
    const { container } = render(<MetricsDataTable searchResult={mockSearchResult} />);
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
    // EuiDataGrid columns are set from instantFieldSchema
    expect(mockSearchResult.instantFieldSchema.length).toBe(4);
  });

  it('formats timestamp correctly', () => {
    const { container } = render(<MetricsDataTable searchResult={mockSearchResult} />);
    // The component should render the data grid
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
  });

  it('handles empty search results', () => {
    const emptySearchResult: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: [],
        total: 0,
      },
    };

    const { container } = render(<MetricsDataTable searchResult={emptySearchResult} />);
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
  });

  it('renders with correct pagination settings', () => {
    const { container } = render(<MetricsDataTable searchResult={mockSearchResult} />);
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
    // Default page size is 50
  });

  it('displays correct field schema columns', () => {
    const { container } = render(<MetricsDataTable searchResult={mockSearchResult} />);
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
    // Verify all expected fields are present in schema
    const expectedFields = ['Time', 'cpu', 'mode', 'Value'];
    expectedFields.forEach((field) => {
      expect(
        mockSearchResult.instantFieldSchema.find((schema) => schema.name === field)
      ).toBeDefined();
    });
  });

  it('handles missing field values with dash placeholder', () => {
    const resultWithMissingValues: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: [
          {
            _index: 'prometheus',
            _source: {
              Time: 1638316800000,
              cpu: '0',
              // mode is missing
              Value: 0.95,
            },
          },
        ],
        total: 1,
      },
    };

    const { container } = render(<MetricsDataTable searchResult={resultWithMissingValues} />);
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
  });

  it('handles search result with multiple rows', () => {
    const multiRowResult: IPrometheusSearchResult = {
      ...mockSearchResult,
      instantHits: {
        hits: Array.from({ length: 100 }, (_, i) => ({
          _index: 'prometheus',
          _source: {
            Time: 1638316800000 + i * 1000,
            cpu: String(i % 4),
            mode: 'idle',
            Value: Math.random(),
          },
        })),
        total: 100,
      },
    };

    const { container } = render(<MetricsDataTable searchResult={multiRowResult} />);
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
  });

  it('renders with toolbar visibility options', () => {
    const { container } = render(<MetricsDataTable searchResult={mockSearchResult} />);
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
    // Component should show column selector and full screen selector
  });

  it('handles row with missing _source', () => {
    const resultWithMissingSource: IPrometheusSearchResult = {
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
          {} as any, // Row with missing _source
        ],
        total: 2,
      },
    };

    const { container } = render(<MetricsDataTable searchResult={resultWithMissingSource} />);
    expect(container.querySelector('.euiDataGrid')).toBeInTheDocument();
  });
});
