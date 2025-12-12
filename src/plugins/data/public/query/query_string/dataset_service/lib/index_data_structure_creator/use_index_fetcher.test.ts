/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useIndexFetcher } from './use_index_fetcher';
import { DataStructure } from '../../../../../../common';
import { IDataPluginServices } from '../../../../../types';

describe('useIndexFetcher', () => {
  let mockHttpGet: jest.Mock;
  let mockToasts: { addDanger: jest.Mock };
  let mockServices: IDataPluginServices;
  let mockPath: DataStructure[];

  beforeEach(() => {
    mockHttpGet = jest.fn();
    mockToasts = { addDanger: jest.fn() };

    mockServices = {
      http: {
        get: mockHttpGet,
      },
      notifications: {
        toasts: mockToasts,
      },
    } as any;

    mockPath = [
      {
        id: 'test-datasource',
        title: 'Test DataSource',
        type: 'DATA_SOURCE',
      },
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchIndices', () => {
    it('should fetch indices successfully', async () => {
      const mockResponse = {
        indices: [{ name: 'index1' }, { name: 'index2' }],
        aliases: [{ name: 'alias1' }],
        data_streams: [{ name: 'stream1' }],
      };

      mockHttpGet.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: ['test-*'] });
      });

      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/test-*',
        {
          query: { expand_wildcards: 'all', data_source: 'test-datasource' },
        }
      );

      expect(fetchedIndices).toEqual(['alias1', 'index1', 'index2', 'stream1']);
    });

    it('should return empty array when patterns array is empty', async () => {
      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: [] });
      });

      expect(mockHttpGet).not.toHaveBeenCalled();
      expect(fetchedIndices).toEqual([]);
    });

    it('should return empty array when services.http is undefined', async () => {
      const servicesWithoutHttp = { ...mockServices, http: undefined };

      const { result } = renderHook(() =>
        useIndexFetcher({ services: servicesWithoutHttp as any, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: ['test-*'] });
      });

      expect(mockHttpGet).not.toHaveBeenCalled();
      expect(fetchedIndices).toEqual([]);
    });

    it('should handle multiple patterns in parallel', async () => {
      const mockResponse1 = {
        indices: [{ name: 'logs-index1' }],
      };

      const mockResponse2 = {
        indices: [{ name: 'metrics-index1' }],
      };

      mockHttpGet.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: ['logs-*', 'metrics-*'] });
      });

      expect(mockHttpGet).toHaveBeenCalledTimes(2);
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/logs-*',
        expect.any(Object)
      );
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/metrics-*',
        expect.any(Object)
      );

      expect(fetchedIndices).toEqual(['logs-index1', 'metrics-index1']);
    });

    it('should deduplicate indices from multiple patterns', async () => {
      const mockResponse1 = {
        indices: [{ name: 'shared-index' }, { name: 'logs-index' }],
      };

      const mockResponse2 = {
        indices: [{ name: 'shared-index' }, { name: 'metrics-index' }],
      };

      mockHttpGet.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: ['logs-*', 'metrics-*'] });
      });

      // Should only have 'shared-index' once
      expect(fetchedIndices).toEqual(['logs-index', 'metrics-index', 'shared-index']);
      expect(fetchedIndices.filter((name) => name === 'shared-index')).toHaveLength(1);
    });

    it('should apply limit when specified', async () => {
      const mockResponse = {
        indices: [
          { name: 'index1' },
          { name: 'index2' },
          { name: 'index3' },
          { name: 'index4' },
          { name: 'index5' },
        ],
      };

      mockHttpGet.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: ['test-*'], limit: 3 });
      });

      expect(fetchedIndices).toHaveLength(3);
      expect(fetchedIndices).toEqual(['index1', 'index2', 'index3']);
    });

    it('should include data source in query when available', async () => {
      const mockResponse = { indices: [{ name: 'index1' }] };
      mockHttpGet.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      await act(async () => {
        await result.current.fetchIndices({ patterns: ['test-*'] });
      });

      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/test-*',
        {
          query: {
            expand_wildcards: 'all',
            data_source: 'test-datasource',
          },
        }
      );
    });

    it('should not include data source in query when path has no DATA_SOURCE', async () => {
      const mockResponse = { indices: [{ name: 'index1' }] };
      mockHttpGet.mockResolvedValue(mockResponse);

      const pathWithoutDataSource: DataStructure[] = [
        {
          id: 'root',
          title: 'Root',
          type: 'ROOT',
        },
      ];

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: pathWithoutDataSource })
      );

      await act(async () => {
        await result.current.fetchIndices({ patterns: ['test-*'] });
      });

      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/test-*',
        {
          query: {
            expand_wildcards: 'all',
          },
        }
      );
    });

    it('should handle individual pattern failures gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockResponse1 = {
        indices: [{ name: 'logs-index1' }],
      };

      mockHttpGet
        .mockResolvedValueOnce(mockResponse1)
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: ['logs-*', 'metrics-*'] });
      });

      // Should still return results from successful pattern
      expect(fetchedIndices).toEqual(['logs-index1']);

      // Should log error for failed pattern - checking that console.error was called with the pattern
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch indices for pattern "metrics-*":'),
        expect.anything()
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return empty array when all patterns fail', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockHttpGet.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: ['test-*'] });
      });

      // Should return empty array when all patterns fail
      expect(fetchedIndices).toEqual([]);

      // Should log error for the failed pattern
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch indices for pattern "test-*":'),
        expect.anything()
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle race conditions correctly', async () => {
      const mockResponse1 = { indices: [{ name: 'old-index' }] };
      const mockResponse2 = { indices: [{ name: 'new-index' }] };

      // First request is slow
      const slowPromise = new Promise((resolve) => setTimeout(() => resolve(mockResponse1), 100));
      // Second request is fast
      const fastPromise = Promise.resolve(mockResponse2);

      mockHttpGet.mockReturnValueOnce(slowPromise).mockReturnValueOnce(fastPromise);

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let firstResult: string[] = [];
      let secondResult: string[] = [];

      // Start first request
      const firstRequestPromise = act(async () => {
        firstResult = await result.current.fetchIndices({ patterns: ['old-*'] });
      });

      // Start second request immediately (before first completes)
      const secondRequestPromise = act(async () => {
        secondResult = await result.current.fetchIndices({ patterns: ['new-*'] });
      });

      await Promise.all([firstRequestPromise, secondRequestPromise]);

      // First request should return empty because it's stale
      expect(firstResult).toEqual([]);
      // Second request should return its results
      expect(secondResult).toEqual(['new-index']);
    });

    it('should sort results alphabetically', async () => {
      const mockResponse = {
        indices: [{ name: 'zebra' }, { name: 'alpha' }, { name: 'beta' }],
      };

      mockHttpGet.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: ['test-*'] });
      });

      expect(fetchedIndices).toEqual(['alpha', 'beta', 'zebra']);
    });

    it('should combine indices, aliases, and data_streams', async () => {
      const mockResponse = {
        indices: [{ name: 'index1' }],
        aliases: [{ name: 'alias1' }],
        data_streams: [{ name: 'stream1' }],
      };

      mockHttpGet.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useIndexFetcher({ services: mockServices, path: mockPath })
      );

      let fetchedIndices: string[] = [];
      await act(async () => {
        fetchedIndices = await result.current.fetchIndices({ patterns: ['test-*'] });
      });

      expect(fetchedIndices).toContain('index1');
      expect(fetchedIndices).toContain('alias1');
      expect(fetchedIndices).toContain('stream1');
    });
  });
});
