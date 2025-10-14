/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFieldStatsQuery, executeFieldStatsQuery } from './field_stats_queries';
import { createMockServices } from './__test_utils__';

describe('field_stats_queries', () => {
  describe('getFieldStatsQuery', () => {
    it('generates correct query string', () => {
      const result = getFieldStatsQuery('my-index', 'status');
      expect(result).toContain('source = my-index');
    });

    it('handles special characters in field names', () => {
      const result = getFieldStatsQuery('logs-*', 'user.name');
      expect(result).toContain('`user.name`');
    });
  });

  describe('executeFieldStatsQuery', () => {
    const mockServices = createMockServices();
    const mockSearchSource = {
      setFields: jest.fn(),
      fetch: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (mockServices.data.search.searchSource.create as jest.Mock).mockResolvedValue(
        mockSearchSource
      );
    });

    it('executes query successfully', async () => {
      const mockResults = { hits: { total: 100 } };
      mockSearchSource.fetch.mockResolvedValue(mockResults);

      const result = await executeFieldStatsQuery(
        mockServices,
        'source = test | stats count()',
        'test-id'
      );

      expect(mockServices.data.search.searchSource.create).toHaveBeenCalled();
      expect(mockSearchSource.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });

    it('sets correct searchSource fields', async () => {
      mockSearchSource.fetch.mockResolvedValue({});

      await executeFieldStatsQuery(mockServices, 'source = test | stats count()', 'test-id');

      expect(mockSearchSource.setFields).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 0,
          query: {
            query: 'source = test | stats count()',
            language: 'PPL',
          },
          highlightAll: false,
          version: true,
        })
      );
    });

    it('handles INDEX_PATTERN vs other dataset types', async () => {
      mockSearchSource.fetch.mockResolvedValue({});

      await executeFieldStatsQuery(
        mockServices,
        'source = test | stats count()',
        'test-id',
        'INDEX_PATTERN'
      );
      expect(mockServices.data.dataViews.get).toHaveBeenCalledWith('test-id', false);

      await executeFieldStatsQuery(
        mockServices,
        'source = test | stats count()',
        'test-id',
        'OTHER_TYPE'
      );
      expect(mockServices.data.dataViews.get).toHaveBeenCalledWith('test-id', true);
    });

    it('propagates errors', async () => {
      const error = new Error('Query failed');
      mockSearchSource.fetch.mockRejectedValue(error);

      await expect(
        executeFieldStatsQuery(mockServices, 'source = test | stats count()', 'test-id')
      ).rejects.toThrow('Query failed');
    });
  });
});
