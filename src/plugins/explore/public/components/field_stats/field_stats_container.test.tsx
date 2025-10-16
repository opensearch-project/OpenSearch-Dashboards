/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Mock the data plugin before any imports that use it
jest.mock('../../../../data/public', () => ({
  indexPatterns: {
    isDefault: jest.fn(() => true),
  },
}));

jest.mock('../../application/context/dataset_context/dataset_context');
jest.mock('../../../../opensearch_dashboards_react/public');
jest.mock('./utils/field_stats_utils');
jest.mock('./field_stats_queries');
jest.mock('./field_stats_table', () => ({
  FieldStatsTable: jest.fn(() => <div data-test-subj="field-stats-table">Mocked Table</div>),
}));

import { FieldStatsContainer } from './field_stats_container';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import {
  filterDatasetFields,
  transformFieldStatsResult,
  createRowExpandHandler,
} from './utils/field_stats_utils';
import {
  getTotalDocCountQuery,
  getFieldStatsQuery,
  executeFieldStatsQuery,
} from './field_stats_queries';
import { FieldStatsTable } from './field_stats_table';
import {
  createMockServices,
  createMockDataset,
  createMockFieldStatsItem,
} from './utils/field_stats.stubs';

const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockFilterDatasetFields = filterDatasetFields as jest.MockedFunction<
  typeof filterDatasetFields
>;
const mockTransformFieldStatsResult = transformFieldStatsResult as jest.MockedFunction<
  typeof transformFieldStatsResult
>;
const mockCreateRowExpandHandler = createRowExpandHandler as jest.MockedFunction<
  typeof createRowExpandHandler
>;
const mockGetTotalDocCountQuery = getTotalDocCountQuery as jest.MockedFunction<
  typeof getTotalDocCountQuery
>;
const mockGetFieldStatsQuery = getFieldStatsQuery as jest.MockedFunction<typeof getFieldStatsQuery>;
const mockExecuteFieldStatsQuery = executeFieldStatsQuery as jest.MockedFunction<
  typeof executeFieldStatsQuery
>;

describe('FieldStatsContainer', () => {
  const mockServices = createMockServices();
  const mockDataset = createMockDataset({ id: 'test-dataset-id', title: 'test-index' });

  const mockFields = [
    { name: 'field1', type: 'string', scripted: false },
    { name: 'field2', type: 'number', scripted: false },
  ];

  const mockFieldStatsItem = createMockFieldStatsItem({
    name: 'field1',
    type: 'string',
    docPercentage: 75,
  });

  beforeEach(() => {
    mockUseOpenSearchDashboards.mockReturnValue({
      services: mockServices,
    } as any);

    mockFilterDatasetFields.mockReturnValue(mockFields);
    mockTransformFieldStatsResult.mockReturnValue(mockFieldStatsItem);
    mockGetTotalDocCountQuery.mockReturnValue('source = test-index | stats count() as total_count');
    mockGetFieldStatsQuery.mockReturnValue(
      'source = test-index | where isnotnull(`field`) | stats count() as field_count, distinct_count(`field`) as distinct_count'
    );

    mockExecuteFieldStatsQuery.mockImplementation((services, query) => {
      if (query.includes('total_count')) {
        return Promise.resolve({
          hits: {
            hits: [
              {
                _source: {
                  total_count: 1000,
                },
              },
            ],
          },
        });
      } else {
        // Field stats query
        return Promise.resolve({
          hits: {
            hits: [
              {
                _source: {
                  field_count: 100,
                  distinct_count: 50,
                },
              },
            ],
          },
        });
      }
    });

    mockCreateRowExpandHandler.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    const { container } = render(<FieldStatsContainer />);
    expect(container).toBeTruthy();

    await waitFor(() => {
      expect(mockExecuteFieldStatsQuery).toHaveBeenCalled();
    });
  });

  it('displays "No dataset selected" when dataset is null', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: null,
    } as any);

    const { getByText } = render(<FieldStatsContainer />);
    expect(getByText('No dataset selected')).toBeTruthy();
  });

  it('calls filterDatasetFields when dataset is available', async () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    render(<FieldStatsContainer />);
    expect(mockFilterDatasetFields).toHaveBeenCalledWith(mockDataset);

    await waitFor(() => {
      expect(mockExecuteFieldStatsQuery).toHaveBeenCalled();
    });
  });

  it('fetches field stats on mount', async () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    render(<FieldStatsContainer />);

    await waitFor(() => {
      expect(mockGetTotalDocCountQuery).toHaveBeenCalledWith('test-index');
    });

    await waitFor(() => {
      expect(mockGetFieldStatsQuery).toHaveBeenCalledWith('test-index', 'field1');
      expect(mockGetFieldStatsQuery).toHaveBeenCalledWith('test-index', 'field2');
    });

    await waitFor(() => {
      expect(mockExecuteFieldStatsQuery).toHaveBeenCalled();
      expect(mockExecuteFieldStatsQuery.mock.calls[0][1]).toContain('total_count');
    });
  });

  it('handles errors during field stats fetching gracefully', async () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    mockExecuteFieldStatsQuery.mockRejectedValueOnce(new Error('Query failed'));

    render(<FieldStatsContainer />);

    await waitFor(() => {
      expect(mockExecuteFieldStatsQuery).toHaveBeenCalled();
    });

    await waitFor(() => {
      const callArgs = (FieldStatsTable as jest.Mock).mock.calls[
        (FieldStatsTable as jest.Mock).mock.calls.length - 1
      ][0];
      expect(callArgs.isLoading).toBe(false);
    });
  });

  it('sorts field stats alphabetically by name', async () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    const mockFieldStats2 = createMockFieldStatsItem({
      name: 'field2',
      type: 'number',
      docCount: 200,
      distinctCount: 100,
      docPercentage: 80,
    });

    mockTransformFieldStatsResult
      .mockReturnValueOnce(mockFieldStats2)
      .mockReturnValueOnce(mockFieldStatsItem);

    render(<FieldStatsContainer />);

    await waitFor(() => {
      expect(mockExecuteFieldStatsQuery).toHaveBeenCalled();
    });

    await waitFor(() => {
      const callArgs = (FieldStatsTable as jest.Mock).mock.calls[
        (FieldStatsTable as jest.Mock).mock.calls.length - 1
      ][0];
      expect(callArgs.items).toBeDefined();
    });
  });

  it('creates row expand handler with correct parameters', async () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    render(<FieldStatsContainer />);

    await waitFor(() => {
      expect(mockExecuteFieldStatsQuery).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockCreateRowExpandHandler).toHaveBeenCalled();
    });

    const callArgs =
      mockCreateRowExpandHandler.mock.calls[mockCreateRowExpandHandler.mock.calls.length - 1];
    expect(callArgs[7]).toBe(mockDataset);
    expect(callArgs[8]).toBe(mockServices);
  });

  it('does not fetch stats when fields array is empty', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    mockFilterDatasetFields.mockReturnValue([]);

    render(<FieldStatsContainer />);

    expect(mockGetFieldStatsQuery).not.toHaveBeenCalled();
    expect(mockExecuteFieldStatsQuery).not.toHaveBeenCalled();
  });

  it('handles failed total count query gracefully', async () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    mockExecuteFieldStatsQuery.mockImplementation((services, query) => {
      if (query.includes('total_count')) {
        return Promise.reject(new Error('Total count query failed'));
      } else {
        return Promise.resolve({
          hits: {
            hits: [
              {
                _source: {
                  field_count: 100,
                  distinct_count: 50,
                },
              },
            ],
          },
        });
      }
    });

    render(<FieldStatsContainer />);

    await waitFor(() => {
      expect(mockGetTotalDocCountQuery).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetFieldStatsQuery).toHaveBeenCalledWith('test-index', 'field1');
      expect(mockGetFieldStatsQuery).toHaveBeenCalledWith('test-index', 'field2');
    });

    await waitFor(() => {
      expect(mockTransformFieldStatsResult).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        undefined
      );
    });
  });
});
