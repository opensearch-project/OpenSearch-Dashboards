/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { DiscoverNoResults } from './no_results';
import { SavedQuery, Query, SavedQueryService } from '../../../../../data/public/';

// Mock the saved query service
const createMockSavedQueryService = (savedQueries: SavedQuery[] = []): SavedQueryService => ({
  findSavedQueries: jest.fn().mockResolvedValue({
    queries: savedQueries,
    total: savedQueries.length,
  }),
  saveQuery: jest.fn(),
  getAllSavedQueries: jest.fn(),
  getSavedQuery: jest.fn(),
  deleteSavedQuery: jest.fn(),
  getSavedQueryCount: jest.fn(),
});

// Mock the query string service
const createMockQueryString = () => ({
  getLanguageService: jest.fn().mockReturnValue({
    getLanguage: jest.fn().mockReturnValue({
      sampleQueries: [],
    }),
  }),
  getDatasetService: jest.fn().mockReturnValue({
    getType: jest.fn().mockReturnValue({
      getSampleQueries: jest.fn().mockReturnValue([]),
    }),
  }),
});

// Helper to create test saved queries
const createSavedQuery = (
  id: string,
  title: string,
  queryValue: string | { [key: string]: any },
  language = 'DQL'
): SavedQuery => ({
  id,
  attributes: {
    title,
    description: 'Test description',
    query: {
      query: queryValue,
      language,
    },
  },
});

describe('DiscoverNoResults - Saved Queries Mapping', () => {
  const defaultProps = {
    queryString: createMockQueryString(),
    query: { query: 'test', language: 'DQL' } as Query,
    savedQuery: createMockSavedQueryService(),
  };

  const renderComponent = (props = {}) => {
    return render(
      <IntlProvider locale="en">
        <DiscoverNoResults {...defaultProps} {...props} />
      </IntlProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('String query values', () => {
    it('should display saved queries with string query values directly', async () => {
      const savedQueries = [
        createSavedQuery('query-1', 'String Query 1', 'status:200'),
        createSavedQuery('query-2', 'String Query 2', 'user:john'),
      ];

      renderComponent({
        savedQuery: createMockSavedQueryService(savedQueries),
      });

      await waitFor(() => {
        expect(screen.getByText('Saved Queries')).toBeInTheDocument();
      });

      expect(screen.getByText('query-1')).toBeInTheDocument();
      expect(screen.getByText('status:200')).toBeInTheDocument();
      expect(screen.getByText('query-2')).toBeInTheDocument();
      expect(screen.getByText('user:john')).toBeInTheDocument();
    });
  });

  describe('Object query values', () => {
    it('should stringify object query values using JSON.stringify', async () => {
      const objectQuery = {
        bool: {
          must: [{ term: { status: 200 } }, { range: { timestamp: { gte: '2023-01-01' } } }],
        },
      };

      const savedQueries = [createSavedQuery('query-1', 'Object Query', objectQuery)];

      renderComponent({
        savedQuery: createMockSavedQueryService(savedQueries),
      });

      await waitFor(() => {
        expect(screen.getByText('Saved Queries')).toBeInTheDocument();
      });

      expect(screen.getByText('query-1')).toBeInTheDocument();

      // Check that the object was stringified
      const expectedJson = JSON.stringify(objectQuery);
      expect(screen.getByText(expectedJson)).toBeInTheDocument();
    });

    it('should handle complex nested objects', async () => {
      const complexQuery = {
        query: {
          bool: {
            must: [{ match: { title: 'test' } }, { terms: { tags: ['important', 'urgent'] } }],
            filter: [{ range: { date: { gte: '2023-01-01', lte: '2023-12-31' } } }],
          },
        },
        aggs: {
          status_counts: {
            terms: { field: 'status' },
          },
        },
      };

      const savedQueries = [createSavedQuery('complex-query', 'Complex Query', complexQuery)];

      renderComponent({
        savedQuery: createMockSavedQueryService(savedQueries),
      });

      await waitFor(() => {
        expect(screen.getByText('complex-query')).toBeInTheDocument();
      });

      const expectedJson = JSON.stringify(complexQuery);
      expect(screen.getByText(expectedJson)).toBeInTheDocument();
    });
  });

  describe('Mixed query types', () => {
    it('should handle both string and object query values in the same list', async () => {
      const savedQueries = [
        createSavedQuery('string-query', 'String Query', 'status:200'),
        createSavedQuery('object-query', 'Object Query', { term: { user: 'admin' } }),
        createSavedQuery('another-string', 'Another String', 'error AND critical'),
      ];

      renderComponent({
        savedQuery: createMockSavedQueryService(savedQueries),
      });

      await waitFor(() => {
        expect(screen.getByText('Saved Queries')).toBeInTheDocument();
      });

      // Check string queries are displayed directly
      expect(screen.getByText('status:200')).toBeInTheDocument();
      expect(screen.getByText('error AND critical')).toBeInTheDocument();

      // Check object query is stringified
      expect(screen.getByText('{"term":{"user":"admin"}}')).toBeInTheDocument();
    });
  });

  describe('Title vs ID fallback', () => {
    it('should use id as the displayed title', async () => {
      const savedQueries = [createSavedQuery('query-id-1', 'My Custom Title', 'status:200')];

      renderComponent({
        savedQuery: createMockSavedQueryService(savedQueries),
      });

      await waitFor(() => {
        expect(screen.getByText('query-id-1')).toBeInTheDocument();
      });
    });

    it('should fallback to ID when title is empty', async () => {
      const savedQuery = createSavedQuery('fallback-id', '', 'status:404');
      // Explicitly set title to empty string
      savedQuery.attributes.title = '';

      const savedQueries = [savedQuery];

      renderComponent({
        savedQuery: createMockSavedQueryService(savedQueries),
      });

      await waitFor(() => {
        expect(screen.getByText('fallback-id')).toBeInTheDocument();
      });
    });

    it('should fallback to ID when title is missing', async () => {
      const savedQuery = createSavedQuery('missing-title-id', 'Original Title', 'user:test');
      // Remove the title property
      delete (savedQuery.attributes as any).title;

      const savedQueries = [savedQuery];

      renderComponent({
        savedQuery: createMockSavedQueryService(savedQueries),
      });

      await waitFor(() => {
        expect(screen.getByText('missing-title-id')).toBeInTheDocument();
      });
    });
  });

  describe('Empty and edge cases', () => {
    it('should not display saved queries tab when array is empty', async () => {
      renderComponent({
        savedQuery: createMockSavedQueryService([]),
      });

      await waitFor(() => {
        expect(screen.getByText('No Results')).toBeInTheDocument();
      });

      expect(screen.queryByText('Saved Queries')).not.toBeInTheDocument();
    });

    it('should handle empty string query values', async () => {
      const savedQueries = [createSavedQuery('empty-query', 'Empty Query', '')];

      renderComponent({
        savedQuery: createMockSavedQueryService(savedQueries),
      });

      await waitFor(() => {
        expect(screen.getByText('empty-query')).toBeInTheDocument();
      });
    });

    it('should handle query service errors gracefully', async () => {
      const mockSavedQueryService = createMockSavedQueryService();
      (mockSavedQueryService.findSavedQueries as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      renderComponent({
        savedQuery: mockSavedQueryService,
      });

      await waitFor(() => {
        expect(screen.getByText('No Results')).toBeInTheDocument();
      });

      // Should not crash and should not display saved queries tab
      expect(screen.queryByText('Saved Queries')).not.toBeInTheDocument();
    });
  });

  describe('Language filtering', () => {
    it('should only show saved queries with matching language', async () => {
      const savedQueries = [
        createSavedQuery('dql-query', 'DQL Query', 'status:200', 'DQL'),
        createSavedQuery('sql-query', 'SQL Query', 'SELECT * FROM logs', 'SQL'),
        createSavedQuery('lucene-query', 'Lucene Query', 'status:200', 'lucene'),
      ];

      renderComponent({
        query: { query: 'test', language: 'DQL' },
        savedQuery: createMockSavedQueryService(savedQueries),
      });

      // Wait for the component to fetch and filter saved queries
      await waitFor(() => {
        expect(screen.getByText('dql-query')).toBeInTheDocument();
      });

      // SQL query should be filtered out since current language is DQL
      expect(screen.queryByText('sql-query')).not.toBeInTheDocument();
    });
  });
});
