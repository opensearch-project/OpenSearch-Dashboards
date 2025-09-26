/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getUserPastQueries,
  transformSavedQueryToSnippet,
  transformSavedSearchToSnippet,
  transformRecentQueryToSnippet,
} from './utils';
import { getQueryService, getSavedObjects } from '../services';
import { SavedQuery } from '../query';

jest.mock('../services');

const mockGetQueryService = getQueryService as jest.MockedFunction<typeof getQueryService>;
const mockGetSavedObjects = getSavedObjects as jest.MockedFunction<typeof getSavedObjects>;

describe('Query Snippet Utils', () => {
  const mockSavedQueries: SavedQuery[] = [
    {
      id: '1',
      attributes: {
        title: 'Error Logs Query',
        description: 'Query to find error logs',
        query: {
          query: 'source = logs | where level = "error"',
          language: 'PPL',
        },
      },
    },
    {
      id: '2',
      attributes: {
        title: 'SQL Query',
        description: 'SQL query example',
        query: {
          query: 'SELECT * FROM logs WHERE level = "error"',
          language: 'SQL',
        },
      },
    },
  ];

  const mockSavedSearches = {
    savedObjects: [
      {
        id: 'search1',
        attributes: {
          title: 'Log Search',
          description: 'Search for logs',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({
              query: {
                query: 'source = logs | head 100',
                language: 'PPL',
              },
            }),
          },
        },
      },
      {
        id: 'search2',
        attributes: {
          title: 'SQL Search',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({
              query: {
                query: 'SELECT * FROM logs LIMIT 100',
                language: 'SQL',
              },
            }),
          },
        },
      },
    ],
  };

  const mockRecentQueries = [
    {
      id: 'recent1',
      query: {
        query: 'source = metrics | stats avg(cpu)',
        language: 'PPL',
      },
      time: 1609459200000,
    },
    {
      id: 'recent2',
      query: {
        query: 'SELECT AVG(cpu) FROM metrics',
        language: 'SQL',
      },
      time: 1609459100000,
    },
  ];

  const mockQueryService = {
    savedQueries: {
      getAllSavedQueries: jest.fn(),
    },
    queryString: {
      getQueryHistory: jest.fn(),
    },
  };

  const mockSavedObjectsClient = {
    client: {
      find: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetQueryService.mockReturnValue(mockQueryService as any);
    mockGetSavedObjects.mockReturnValue(mockSavedObjectsClient as any);
    mockQueryService.savedQueries.getAllSavedQueries.mockResolvedValue(mockSavedQueries);
    mockQueryService.queryString.getQueryHistory.mockReturnValue(mockRecentQueries);
    mockSavedObjectsClient.client.find.mockResolvedValue(mockSavedSearches);
  });

  describe('transformSavedQueryToSnippet', () => {
    it('should transform saved query to snippet', () => {
      const result = transformSavedQueryToSnippet(mockSavedQueries[0]);

      expect(result).toEqual({
        id: '1',
        query: {
          query: 'source = logs | where level = "error"',
          language: 'PPL',
        },
        title: 'Error Logs Query',
        description: 'Query to find error logs',
        source: 'Saved Query',
      });
    });
  });

  describe('transformSavedSearchToSnippet', () => {
    it('should transform saved search to snippet', () => {
      const result = transformSavedSearchToSnippet(mockSavedSearches.savedObjects[0]);

      expect(result).toEqual({
        id: 'search1',
        query: {
          query: 'source = logs | head 100',
          language: 'PPL',
        },
        title: 'Log Search',
        description: 'Search for logs',
        source: 'Saved Search',
      });
    });

    it('should handle malformed searchSourceJSON', () => {
      const malformedSearch = {
        id: 'malformed',
        attributes: {
          title: 'Malformed Search',
          kibanaSavedObjectMeta: {
            searchSourceJSON: 'invalid json',
          },
        },
      };

      const result = transformSavedSearchToSnippet(malformedSearch);

      expect(result).toEqual({
        id: 'malformed',
        query: undefined,
        title: 'Malformed Search',
        description: undefined,
        source: 'Saved Search',
      });
    });

    it('should handle missing searchSourceJSON', () => {
      const searchWithoutJSON = {
        id: 'no-json',
        attributes: {
          title: 'No JSON Search',
        },
      };

      const result = transformSavedSearchToSnippet(searchWithoutJSON);

      expect(result).toEqual({
        id: 'no-json',
        query: undefined,
        title: 'No JSON Search',
        description: undefined,
        source: 'Saved Search',
      });
    });
  });

  describe('transformRecentQueryToSnippet', () => {
    it('should transform recent query to snippet', () => {
      const result = transformRecentQueryToSnippet(mockRecentQueries[0]);

      expect(result).toEqual({
        id: 'recent1',
        query: {
          query: 'source = metrics | stats avg(cpu)',
          language: 'PPL',
        },
        timestamp: 1609459200000,
        source: 'Recent Query',
      });
    });
  });

  describe('getUserPastQueries', () => {
    it('should fetch and combine all query types for PPL', async () => {
      const result = await getUserPastQueries('PPL');

      expect(mockQueryService.savedQueries.getAllSavedQueries).toHaveBeenCalled();
      expect(mockSavedObjectsClient.client.find).toHaveBeenCalledWith({
        type: 'explore',
        perPage: 1000,
        page: 1,
      });
      expect(mockQueryService.queryString.getQueryHistory).toHaveBeenCalled();

      // Should return 3 PPL queries (1 saved query + 1 saved search + 1 recent query)
      expect(result).toHaveLength(3);

      // Check each type is present
      expect(result.some((q) => q.source === 'Saved Query')).toBeTruthy();
      expect(result.some((q) => q.source === 'Saved Search')).toBeTruthy();
      expect(result.some((q) => q.source === 'Recent Query')).toBeTruthy();
    });

    it('should filter queries by language (case insensitive)', async () => {
      const result = await getUserPastQueries('ppl');

      // Should only return PPL queries, not SQL
      result.forEach((query) => {
        expect(query.query?.language?.toLowerCase()).toBe('ppl');
      });
    });

    it('should handle empty results from all sources', async () => {
      mockQueryService.savedQueries.getAllSavedQueries.mockResolvedValue([]);
      mockSavedObjectsClient.client.find.mockResolvedValue({ savedObjects: [] });
      mockQueryService.queryString.getQueryHistory.mockReturnValue([]);

      const result = await getUserPastQueries('PPL');

      expect(result).toHaveLength(0);
    });
  });
});
