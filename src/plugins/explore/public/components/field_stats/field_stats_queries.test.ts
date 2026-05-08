/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getTotalDocCountQuery,
  getFieldStatsQuery,
  executeFieldStatsQuery,
} from './field_stats_queries';
import { createMockServices } from './utils/field_stats.stubs';

describe('field_stats_queries', () => {
  describe('getTotalDocCountQuery', () => {
    it('generates correct query string', () => {
      const result = getTotalDocCountQuery('my-index');
      expect(result).toBe('source = my-index | stats count() as total_count');
    });

    it('handles index patterns', () => {
      const result = getTotalDocCountQuery('logs-*');
      expect(result).toContain('source = logs-*');
      expect(result).toContain('total_count');
    });
  });

  describe('getFieldStatsQuery', () => {
    it('generates correct query string with where clause', () => {
      const result = getFieldStatsQuery('my-index', 'status');
      expect(result).toContain('source = my-index');
      expect(result).toContain('where isnotnull(`status`)');
      expect(result).toContain('field_count');
      expect(result).toContain('distinct_count');
    });

    it('handles special characters in field names', () => {
      const result = getFieldStatsQuery('logs-*', 'user.name');
      expect(result).toContain('`user.name`');
    });
  });

  describe('executeFieldStatsQuery', () => {
    const mockServices = createMockServices();

    beforeEach(() => {
      jest.clearAllMocks();
      (mockServices.data.search.searchSource.create as jest.Mock).mockResolvedValue({
        setFields: jest.fn(),
        setField: jest.fn(),
        setParent: jest.fn(),
        fetch: jest.fn().mockResolvedValue({}),
      });
    });

    it('executes query successfully', async () => {
      const mockResults = { hits: { total: 100 } };
      const mockSearchSource = {
        setFields: jest.fn(),
        setField: jest.fn(),
        setParent: jest.fn(),
        fetch: jest.fn().mockResolvedValue(mockResults),
      };
      (mockServices.data.search.searchSource.create as jest.Mock).mockResolvedValue(
        mockSearchSource
      );

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
      const mockSearchSource = {
        setFields: jest.fn(),
        setField: jest.fn(),
        setParent: jest.fn(),
        fetch: jest.fn().mockResolvedValue({}),
      };
      (mockServices.data.search.searchSource.create as jest.Mock).mockResolvedValue(
        mockSearchSource
      );

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
      const mockSearchSource = {
        setFields: jest.fn(),
        setField: jest.fn(),
        setParent: jest.fn(),
        fetch: jest.fn().mockRejectedValue(error),
      };
      (mockServices.data.search.searchSource.create as jest.Mock).mockResolvedValue(
        mockSearchSource
      );

      await expect(
        executeFieldStatsQuery(mockServices, 'source = test | stats count()', 'test-id')
      ).rejects.toThrow('Query failed');
    });
  });
});
