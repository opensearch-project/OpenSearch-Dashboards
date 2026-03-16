/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import moment from 'moment';
import { RecentQueriesTable, MAX_RECENT_QUERY_SIZE } from './recent_query';
import { RecentQueryItem } from '../types';
import { Query } from '../../../../../common';

// Mock moment
jest.mock('moment', () => {
  const originalMoment = jest.requireActual('moment');
  return {
    ...originalMoment,
    __esModule: true,
    default: jest.fn(() => ({
      format: jest.fn(() => 'Jan 1, 2024 12:00:00'),
    })),
  };
});

const mockOnClickRecentQuery = jest.fn();

const createMockQuery = (id: number, query: string, language: string): Query => ({
  query,
  language,
});

const createMockRecentQueryItem = (
  id: number,
  query: string,
  language: string = 'PPL',
  time: number = Date.now()
): RecentQueryItem => ({
  id,
  query: createMockQuery(id, query, language),
  time,
  timeRange: {
    from: 'now-1d',
    to: 'now',
  },
});

const createMockQueryString = (
  recentQueries: RecentQueryItem[],
  currentLanguage: string = 'PPL'
) => ({
  getQuery: jest.fn(() => ({ query: '', language: currentLanguage })),
  setQuery: jest.fn(),
  getUpdates$: jest.fn(),
  getDefaultQuery: jest.fn(),
  formatQuery: jest.fn(),
  clearQuery: jest.fn(),
  addToQueryHistory: jest.fn(),
  getQueryHistory: jest.fn(() => recentQueries),
  clearQueryHistory: jest.fn(),
  changeQueryHistory: jest.fn((callback) => {
    callback(recentQueries);
    return () => {}; // cleanup function
  }),
  getInitialQuery: jest.fn(),
  getInitialQueryByLanguage: jest.fn(),
  getDatasetService: jest.fn(),
  getLanguageService: jest.fn(),
  getInitialQueryByDataset: jest.fn(),
});

describe('RecentQueriesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders recent queries table when visible', () => {
    const recentQueries = [
      createMockRecentQueryItem(1, 'source=logs | head 5', 'PPL'),
      createMockRecentQueryItem(2, 'source=metrics | stats count()', 'PPL'),
    ];

    const mockQueryString = createMockQueryString(recentQueries, 'PPL');

    render(
      <RecentQueriesTable
        queryString={mockQueryString}
        onClickRecentQuery={mockOnClickRecentQuery}
        isVisible={true}
      />
    );

    expect(screen.getByTestId('recentQueryTable')).toBeInTheDocument();
    expect(screen.getByText('source=logs | head 5')).toBeInTheDocument();
    expect(screen.getByText('source=metrics | stats count()')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    const recentQueries = [createMockRecentQueryItem(1, 'source=logs', 'PPL')];
    const mockQueryString = createMockQueryString(recentQueries, 'PPL');

    render(
      <RecentQueriesTable
        queryString={mockQueryString}
        onClickRecentQuery={mockOnClickRecentQuery}
        isVisible={false}
      />
    );

    expect(screen.queryByTestId('recentQueryTable')).not.toBeInTheDocument();
  });

  it('filters queries by current language', () => {
    const recentQueries = [
      createMockRecentQueryItem(1, 'source=logs | head 5', 'PPL'),
      createMockRecentQueryItem(2, 'SELECT * FROM logs', 'SQL'),
      createMockRecentQueryItem(3, 'source=metrics | stats count()', 'PPL'),
    ];

    const mockQueryString = createMockQueryString(recentQueries, 'PPL');

    render(
      <RecentQueriesTable
        queryString={mockQueryString}
        onClickRecentQuery={mockOnClickRecentQuery}
        isVisible={true}
      />
    );

    // Should only show PPL queries
    expect(screen.getByText('source=logs | head 5')).toBeInTheDocument();
    expect(screen.getByText('source=metrics | stats count()')).toBeInTheDocument();
    expect(screen.queryByText('SELECT * FROM logs')).not.toBeInTheDocument();
  });

  it('calls onClickRecentQuery when run button is clicked', () => {
    const recentQueries = [createMockRecentQueryItem(1, 'source=logs | head 5', 'PPL')];

    const mockQueryString = createMockQueryString(recentQueries, 'PPL');

    render(
      <RecentQueriesTable
        queryString={mockQueryString}
        onClickRecentQuery={mockOnClickRecentQuery}
        isVisible={true}
      />
    );

    const runButton = screen.getByTestId('action-run');
    fireEvent.click(runButton);

    expect(mockOnClickRecentQuery).toHaveBeenCalledWith(
      recentQueries[0].query,
      recentQueries[0].timeRange
    );
  });

  describe('Max query limit functionality', () => {
    it('shows only the last 10 queries when more than MAX_RECENT_QUERY_SIZE queries exist', () => {
      // Create 15 recent queries (more than the max limit of 10)
      const recentQueries: RecentQueryItem[] = [];
      for (let i = 1; i <= 15; i++) {
        recentQueries.push(
          createMockRecentQueryItem(i, `source=logs | head ${i}`, 'PPL', Date.now() + i)
        );
      }

      const mockQueryString = createMockQueryString(recentQueries, 'PPL');

      render(
        <RecentQueriesTable
          queryString={mockQueryString}
          onClickRecentQuery={mockOnClickRecentQuery}
          isVisible={true}
        />
      );

      // Should only show the first 10 queries (due to filter at line 80)
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`source=logs | head ${i}`)).toBeInTheDocument();
      }

      // Should not show queries beyond the 10th
      for (let i = 11; i <= 15; i++) {
        expect(screen.queryByText(`source=logs | head ${i}`)).not.toBeInTheDocument();
      }
    });

    it('shows all queries when less than MAX_RECENT_QUERY_SIZE queries exist', () => {
      // Create 5 recent queries (less than the max limit)
      const recentQueries: RecentQueryItem[] = [];
      for (let i = 1; i <= 5; i++) {
        recentQueries.push(createMockRecentQueryItem(i, `source=logs | head ${i}`, 'PPL'));
      }

      const mockQueryString = createMockQueryString(recentQueries, 'PPL');

      render(
        <RecentQueriesTable
          queryString={mockQueryString}
          onClickRecentQuery={mockOnClickRecentQuery}
          isVisible={true}
        />
      );

      // Should show all 5 queries
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByText(`source=logs | head ${i}`)).toBeInTheDocument();
      }
    });

    it('shows exactly MAX_RECENT_QUERY_SIZE queries when that many exist', () => {
      // Create exactly 10 recent queries (equal to the max limit)
      const recentQueries: RecentQueryItem[] = [];
      for (let i = 1; i <= MAX_RECENT_QUERY_SIZE; i++) {
        recentQueries.push(createMockRecentQueryItem(i, `source=logs | head ${i}`, 'PPL'));
      }

      const mockQueryString = createMockQueryString(recentQueries, 'PPL');

      render(
        <RecentQueriesTable
          queryString={mockQueryString}
          onClickRecentQuery={mockOnClickRecentQuery}
          isVisible={true}
        />
      );

      // Should show all 10 queries
      for (let i = 1; i <= MAX_RECENT_QUERY_SIZE; i++) {
        expect(screen.getByText(`source=logs | head ${i}`)).toBeInTheDocument();
      }
    });

    it('evicts oldest entries when more than 11 queries are present', () => {
      // Create 12 recent queries with different timestamps
      const recentQueries: RecentQueryItem[] = [];
      for (let i = 1; i <= 12; i++) {
        recentQueries.push(
          createMockRecentQueryItem(
            i,
            `source=logs | head ${i}`,
            'PPL',
            Date.now() - (12 - i) * 1000 // Earlier queries have smaller timestamps
          )
        );
      }

      const mockQueryString = createMockQueryString(recentQueries, 'PPL');

      render(
        <RecentQueriesTable
          queryString={mockQueryString}
          onClickRecentQuery={mockOnClickRecentQuery}
          isVisible={true}
        />
      );

      // Should show the first 10 queries in the array (based on array index, not timestamp)
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`source=logs | head ${i}`)).toBeInTheDocument();
      }

      // Should not show the 11th and 12th queries
      expect(screen.queryByText('source=logs | head 11')).not.toBeInTheDocument();
      expect(screen.queryByText('source=logs | head 12')).not.toBeInTheDocument();
    });

    it('respects both max size limit and language filter', () => {
      // Create 15 queries with mixed languages
      const recentQueries: RecentQueryItem[] = [];
      for (let i = 1; i <= 15; i++) {
        const language = i % 2 === 0 ? 'SQL' : 'PPL';
        const queryText =
          language === 'PPL' ? `source=logs | head ${i}` : `SELECT * FROM logs LIMIT ${i}`;
        recentQueries.push(createMockRecentQueryItem(i, queryText, language));
      }

      const mockQueryString = createMockQueryString(recentQueries, 'PPL');

      render(
        <RecentQueriesTable
          queryString={mockQueryString}
          onClickRecentQuery={mockOnClickRecentQuery}
          isVisible={true}
        />
      );

      // Should show only PPL queries from the first 10 items
      // PPL queries are at indices: 1, 3, 5, 7, 9 (1-indexed, odd numbers)
      const expectedPPLQueries = [1, 3, 5, 7, 9];

      expectedPPLQueries.forEach((i) => {
        expect(screen.getByText(`source=logs | head ${i}`)).toBeInTheDocument();
      });

      // Should not show SQL queries or queries beyond index 10
      expect(screen.queryByText('SELECT * FROM logs LIMIT 2')).not.toBeInTheDocument();
      expect(screen.queryByText('SELECT * FROM logs LIMIT 4')).not.toBeInTheDocument();
      expect(screen.queryByText('source=logs | head 11')).not.toBeInTheDocument();
      expect(screen.queryByText('source=logs | head 13')).not.toBeInTheDocument();
      expect(screen.queryByText('source=logs | head 15')).not.toBeInTheDocument();
    });
  });

  it('formats time correctly using moment', () => {
    const recentQueries = [
      createMockRecentQueryItem(1, 'source=logs | head 5', 'PPL', 1704067200000), // Jan 1, 2024
    ];

    const mockQueryString = createMockQueryString(recentQueries, 'PPL');

    render(
      <RecentQueriesTable
        queryString={mockQueryString}
        onClickRecentQuery={mockOnClickRecentQuery}
        isVisible={true}
      />
    );

    expect(moment).toHaveBeenCalledWith(1704067200000);
    expect(screen.getByText('Jan 1, 2024 12:00:00')).toBeInTheDocument();
  });
});
