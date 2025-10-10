/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILegacyClusterClient, Logger } from 'opensearch-dashboards/server';
import { DATASET } from '../../common';
import { cancelQueryByDataSource, createQueryCancellationHandler } from './query_cancellation';

describe('Query Cancellation Utils', () => {
  let mockClient: ILegacyClusterClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockClient = {
      callAsInternalUser: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as any;
  });

  describe('cancelQueryByDataSource', () => {
    const queryId = 'test-query-123';
    const queryLanguage = 'SQL';

    it('should cancel S3 queries using async query API', async () => {
      (mockClient.callAsInternalUser as jest.Mock).mockResolvedValueOnce({ acknowledged: true });

      await cancelQueryByDataSource(queryId, DATASET.S3, mockClient, mockLogger, queryLanguage);

      expect(mockClient.callAsInternalUser).toHaveBeenCalledWith('transport.request', {
        method: 'POST',
        path: `/_plugins/_async_query/cancel/${queryId}`,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `${queryLanguage}AsyncSearchStrategy: Cancelled S3 backend query ${queryId}`
      );
    });

    it('should use default API for unknown data source types', async () => {
      (mockClient.callAsInternalUser as jest.Mock).mockResolvedValueOnce({ acknowledged: true });

      await cancelQueryByDataSource(queryId, 'UNKNOWN_SOURCE', mockClient, mockLogger, queryLanguage);

      expect(mockClient.callAsInternalUser).toHaveBeenCalledWith('transport.request', {
        method: 'POST',
        path: `/_plugins/_async_query/cancel/${queryId}`,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `${queryLanguage}AsyncSearchStrategy: Cancelled backend query ${queryId} (default API)`
      );
    });

    it('should use default API when data source type is undefined', async () => {
      (mockClient.callAsInternalUser as jest.Mock).mockResolvedValueOnce({ acknowledged: true });

      await cancelQueryByDataSource(queryId, undefined, mockClient, mockLogger, queryLanguage);

      expect(mockClient.callAsInternalUser).toHaveBeenCalledWith('transport.request', {
        method: 'POST',
        path: `/_plugins/_async_query/cancel/${queryId}`,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `${queryLanguage}AsyncSearchStrategy: Cancelled backend query ${queryId} (default API)`
      );
    });

    it('should handle client errors gracefully', async () => {
      const error = new Error('Network error');
      (mockClient.callAsInternalUser as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cancelQueryByDataSource(queryId, DATASET.S3, mockClient, mockLogger, queryLanguage)
      ).rejects.toThrow('Network error');

      expect(mockClient.callAsInternalUser).toHaveBeenCalledWith('transport.request', {
        method: 'POST',
        path: `/_plugins/_async_query/cancel/${queryId}`,
      });
    });

    it('should handle different query languages correctly', async () => {
      (mockClient.callAsInternalUser as jest.Mock).mockResolvedValueOnce({ acknowledged: true });

      await cancelQueryByDataSource(queryId, DATASET.S3, mockClient, mockLogger, 'PPL');

      expect(mockLogger.info).toHaveBeenCalledWith(
        `PPLAsyncSearchStrategy: Cancelled S3 backend query ${queryId}`
      );
    });
  });

  describe('createQueryCancellationHandler', () => {
    const queryId = 'test-query-456';
    const queryLanguage = 'PPL';

    it('should create a handler that cancels queries with S3 data source', async () => {
      const query = {
        dataset: { type: DATASET.S3 },
        query: 'source = s3_table',
      };

      (mockClient.callAsInternalUser as jest.Mock).mockResolvedValueOnce({ acknowledged: true });

      const handler = createQueryCancellationHandler(queryId, query, mockClient, mockLogger, queryLanguage);
      await handler();

      expect(mockClient.callAsInternalUser).toHaveBeenCalledWith('transport.request', {
        method: 'POST',
        path: `/_plugins/_async_query/cancel/${queryId}`,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `${queryLanguage}AsyncSearchStrategy: Cancelled S3 backend query ${queryId}`
      );
    });

    it('should create a handler that cancels queries with default data source', async () => {
      const query = {
        query: 'SELECT * FROM table',
      };

      (mockClient.callAsInternalUser as jest.Mock).mockResolvedValueOnce({ acknowledged: true });

      const handler = createQueryCancellationHandler(queryId, query, mockClient, mockLogger, queryLanguage);
      await handler();

      expect(mockClient.callAsInternalUser).toHaveBeenCalledWith('transport.request', {
        method: 'POST',
        path: `/_plugins/_async_query/cancel/${queryId}`,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `${queryLanguage}AsyncSearchStrategy: Cancelled backend query ${queryId} (default API)`
      );
    });

    it('should handle cancellation errors and log them', async () => {
      const query = {
        dataset: { type: DATASET.S3 },
        query: 'source = s3_table',
      };

      const error = new Error('Cancellation failed');
      (mockClient.callAsInternalUser as jest.Mock).mockRejectedValueOnce(error);

      const handler = createQueryCancellationHandler(queryId, query, mockClient, mockLogger, queryLanguage);

      // Handler should not throw, but should log the error
      await expect(handler()).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        `${queryLanguage}AsyncSearchStrategy: Failed to cancel backend query ${queryId}: ${error.message}`
      );
    });

    it('should not attempt cancellation when queryId is empty', async () => {
      const query = {
        dataset: { type: DATASET.S3 },
        query: 'source = s3_table',
      };

      const handler = createQueryCancellationHandler('', query, mockClient, mockLogger, queryLanguage);
      await handler();

      expect(mockClient.callAsInternalUser).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should not attempt cancellation when queryId is null', async () => {
      const query = {
        dataset: { type: DATASET.S3 },
        query: 'source = s3_table',
      };

      const handler = createQueryCancellationHandler(null as any, query, mockClient, mockLogger, queryLanguage);
      await handler();

      expect(mockClient.callAsInternalUser).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle queries with nested dataset information', async () => {
      const query = {
        dataset: {
          type: DATASET.S3,
          id: 'my-s3-dataset',
          title: 'S3 Data Source'
        },
        query: 'source = s3_table | head 100',
      };

      (mockClient.callAsInternalUser as jest.Mock).mockResolvedValueOnce({ acknowledged: true });

      const handler = createQueryCancellationHandler(queryId, query, mockClient, mockLogger, queryLanguage);
      await handler();

      expect(mockClient.callAsInternalUser).toHaveBeenCalledWith('transport.request', {
        method: 'POST',
        path: `/_plugins/_async_query/cancel/${queryId}`,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `${queryLanguage}AsyncSearchStrategy: Cancelled S3 backend query ${queryId}`
      );
    });
  });
});