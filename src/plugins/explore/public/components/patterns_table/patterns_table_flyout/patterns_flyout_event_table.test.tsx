/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PatternsFlyoutEventTable } from './patterns_flyout_event_table';
import { useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn((Component) => Component),
}));

describe('PatternsFlyoutEventTable', () => {
  const mockPatternString = 'test-pattern';
  const mockTotalItemCount = 25;
  const mockDataset = {
    id: 'test-dataset',
    title: 'Test Dataset',
    type: 'INDEX_PATTERN',
    timeFieldName: 'timestamp',
  };
  const mockQuery = { query: 'test query', language: 'kuery' };
  const mockPatternsField = 'message';
  const mockUsingRegexPatterns = false;

  const mockSearchResults = {
    hits: {
      hits: [
        {
          _source: {
            timestamp: '2023-01-01T00:00:00Z',
            message: 'Test message 1',
          },
        },
        {
          _source: {
            timestamp: '2023-01-01T00:01:00Z',
            message: 'Test message 2',
          },
        },
      ],
    },
  };

  const mockServices = {
    data: {
      search: {
        searchSource: {
          create: jest.fn().mockResolvedValue({
            setFields: jest.fn().mockReturnThis(),
            fetch: jest.fn().mockResolvedValue(mockSearchResults),
          }),
        },
      },
      dataViews: {
        get: jest.fn().mockResolvedValue({ id: 'test-dataset' }),
      },
      query: {
        filterManager: {
          getFilters: jest.fn().mockReturnValue([]),
        },
      },
    },
    uiSettings: {
      get: jest.fn().mockReturnValue(10),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useSelector as jest.Mock).mockImplementation((selector) => {
      const {
        selectDataset,
        selectQuery,
        selectPatternsField,
        selectUsingRegexPatterns,
      } = jest.requireActual('../../../application/utils/state_management/selectors');

      if (selector === selectDataset) return mockDataset;
      if (selector === selectQuery) return mockQuery;
      if (selector === selectPatternsField) return mockPatternsField;
      if (selector === selectUsingRegexPatterns) return mockUsingRegexPatterns;

      return undefined;
    });

    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: mockServices,
    });
  });

  it('renders the event table with data', async () => {
    render(
      <PatternsFlyoutEventTable
        patternString={mockPatternString}
        totalItemCount={mockTotalItemCount}
      />
    );

    await waitFor(() => {
      expect(mockServices.data.search.searchSource.create).toHaveBeenCalled();
    });

    expect(screen.getByText('2023-01-01T00:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('Test message 1')).toBeInTheDocument();
    expect(screen.getByText('2023-01-01T00:01:00Z')).toBeInTheDocument();
    expect(screen.getByText('Test message 2')).toBeInTheDocument();
  });

  it('calls eventResults with correct parameters', async () => {
    render(
      <PatternsFlyoutEventTable
        patternString={mockPatternString}
        totalItemCount={mockTotalItemCount}
      />
    );

    await waitFor(() => {
      expect(mockServices.data.search.searchSource.create).toHaveBeenCalled();
    });

    expect(mockServices.data.dataViews.get).toHaveBeenCalledWith(
      mockDataset.id,
      mockDataset.type !== 'INDEX_PATTERN'
    );

    const searchSourceInstance = await mockServices.data.search.searchSource.create();
    expect(searchSourceInstance.setFields).toHaveBeenCalled();
    expect(searchSourceInstance.fetch).toHaveBeenCalled();
  });

  it('handles pagination correctly', async () => {
    const mockSearchSourceInstance = {
      setFields: jest.fn().mockReturnThis(),
      fetch: jest.fn().mockResolvedValue(mockSearchResults),
    };

    mockServices.data.search.searchSource.create.mockResolvedValue(mockSearchSourceInstance);

    render(
      <PatternsFlyoutEventTable
        patternString={mockPatternString}
        totalItemCount={mockTotalItemCount}
      />
    );

    await waitFor(() => {
      expect(mockServices.data.search.searchSource.create).toHaveBeenCalled();
    });

    const paginationElement = screen.getByTestId('pagination-button-0');
    expect(paginationElement).toBeInTheDocument();
    expect(paginationElement).toHaveTextContent('1');

    const prevButton = screen.getByLabelText('Previous page');
    const nextButton = screen.getByLabelText(/Next page/);
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    const paginationButtons = screen.getAllByTestId(/pagination-button-\d+/);
    expect(paginationButtons).toHaveLength(3);

    const setFieldsCalls = mockSearchSourceInstance.setFields.mock.calls;
    expect(setFieldsCalls.length).toEqual(1);

    const lastSetFieldsCall = setFieldsCalls[setFieldsCalls.length - 1][0];
    expect(lastSetFieldsCall).toHaveProperty('query');
    expect(lastSetFieldsCall.query).toHaveProperty('query');
    expect(lastSetFieldsCall.query.query).toContain(mockPatternString);
  });

  it('throws an error when dataset or patterns field is missing', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (useSelector as jest.Mock).mockImplementation(() => undefined);

    expect(() => {
      render(
        <PatternsFlyoutEventTable
          patternString={mockPatternString}
          totalItemCount={mockTotalItemCount}
        />
      );
    }).toThrow('Dataset, patterns field, or time field is not appearing for event table');

    consoleErrorSpy.mockRestore();
  });

  it('renders error callout when fetch fails', async () => {
    const mockError = {
      message: 'Failed to fetch data',
      statusCode: 500,
      body: {
        error: {
          type: 'search_phase_execution_exception',
          reason: 'Error executing search',
        },
      },
      toString() {
        return `Error: ${this.message} (${this.statusCode})`;
      },
    };

    const mockSearchSourceInstance = {
      setFields: jest.fn().mockReturnThis(),
      fetch: jest.fn().mockRejectedValue(mockError),
    };

    mockServices.data.search.searchSource.create.mockResolvedValue(mockSearchSourceInstance);

    render(
      <PatternsFlyoutEventTable
        patternString={mockPatternString}
        totalItemCount={mockTotalItemCount}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error fetching events')).toBeInTheDocument();
      expect(screen.getByText(mockError.toString())).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Pattern event table')).not.toBeInTheDocument();
  });
});
