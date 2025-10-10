/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ILegacyClusterClient,
  Logger,
  RequestHandlerContext,
  SharedGlobalConfig,
} from 'opensearch-dashboards/server';
import { Observable, of } from 'rxjs';
import { DATA_FRAME_TYPES, IOpenSearchDashboardsSearchRequest } from '../../../data/common';
import { SearchUsage } from '../../../data/server';
import { DATASET } from '../../common';
import * as facet from '../utils/facet';
import * as queryCancellation from '../utils/query_cancellation';
import { sqlAsyncSearchStrategyProvider } from './sql_async_search_strategy';

jest.mock('../utils/facet');
jest.mock('../utils/query_cancellation');

describe('sqlAsyncSearchStrategyProvider', () => {
  let config$: Observable<SharedGlobalConfig>;
  let logger: Logger;
  let client: ILegacyClusterClient;
  let usage: SearchUsage;
  let mockFacet: facet.Facet;
  let mockJobsFacet: facet.Facet;
  const emptyRequestHandlerContext = ({} as unknown) as RequestHandlerContext;

  beforeEach(() => {
    config$ = of({} as SharedGlobalConfig);
    logger = ({
      info: jest.fn(),
      error: jest.fn(),
    } as unknown) as Logger;
    client = {
      callAsInternalUser: jest.fn(),
    } as any;
    usage = {
      trackSuccess: jest.fn(),
      trackError: jest.fn(),
    } as SearchUsage;

    mockFacet = ({
      describeQuery: jest.fn(),
    } as unknown) as facet.Facet;

    mockJobsFacet = ({
      describeQuery: jest.fn(),
    } as unknown) as facet.Facet;

    // Mock Facet constructor to return different instances
    (facet.Facet as jest.MockedClass<typeof facet.Facet>).mockImplementation((config) => {
      if (config.useJobs) {
        return mockJobsFacet;
      }
      return mockFacet;
    });

    jest.clearAllMocks();
  });

  describe('search method', () => {
    it('should return strategy with search and cancel methods', () => {
      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      expect(strategy).toHaveProperty('search');
      expect(strategy).toHaveProperty('cancel');
      expect(typeof strategy.search).toBe('function');
      expect(typeof strategy.cancel).toBe('function');
    });

    it('should initiate new query when no queryId is provided', async () => {
      const mockResponse = {
        success: true,
        data: { queryId: 'new-sql-query-123', status: 'RUNNING' },
      };
      (mockFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockResponse);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: { query: { query: 'SELECT * FROM table', dataset: { id: 'test-dataset' } } },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(mockFacet.describeQuery).toHaveBeenCalledWith(
        emptyRequestHandlerContext,
        expect.objectContaining({
          body: expect.objectContaining({
            lang: 'sql',
          }),
        })
      );

      expect(result).toEqual({
        type: DATA_FRAME_TYPES.POLLING,
        status: 'started',
        body: {
          queryStatusConfig: expect.any(Object),
        },
      });
    });

    it('should poll query status when queryId is provided', async () => {
      const mockStatusResponse = {
        success: true,
        data: {
          status: 'RUNNING',
          schema: [],
          datarows: [],
        },
      };
      (mockJobsFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockStatusResponse);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: { query: 'SELECT * FROM table', dataset: { id: 'test-dataset' } },
            pollQueryResultsParams: { queryId: 'existing-sql-query-123' },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(mockJobsFacet.describeQuery).toHaveBeenCalledWith(
        emptyRequestHandlerContext,
        expect.objectContaining({
          params: { queryId: 'existing-sql-query-123' },
        })
      );

      expect(result).toEqual({
        type: DATA_FRAME_TYPES.POLLING,
        status: 'RUNNING',
      });
    });

    it('should return success when query completes successfully', async () => {
      const mockStatusResponse = {
        success: true,
        data: {
          status: 'SUCCESS',
          schema: [
            { name: 'id', type: 'integer' },
            { name: 'name', type: 'text' },
          ],
          datarows: [
            [1, 'Alice'],
            [2, 'Bob'],
          ],
        },
      };
      (mockJobsFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockStatusResponse);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: { query: 'SELECT * FROM users', dataset: { id: 'users-dataset' } },
            pollQueryResultsParams: { queryId: 'completed-sql-query-123' },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(result).toEqual({
        type: DATA_FRAME_TYPES.POLLING,
        status: 'success',
        body: expect.objectContaining({
          name: 'users-dataset',
          size: 2,
        }),
      });
    });

    it('should return failure when query fails', async () => {
      const mockStatusResponse = {
        success: true,
        data: {
          status: 'FAILED',
          error: 'SQL syntax error',
        },
      };
      (mockJobsFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockStatusResponse);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: { query: 'INVALID SQL', dataset: { id: 'test-dataset' } },
            pollQueryResultsParams: { queryId: 'failed-sql-query-123' },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(result).toEqual({
        type: DATA_FRAME_TYPES.POLLING,
        status: 'failed',
        body: {
          error: 'JOB: failed-sql-query-123 failed: SQL syntax error',
        },
      });
    });

    it('should set up abort signal listener when provided with queryId', async () => {
      const mockStatusResponse = {
        success: true,
        data: { status: 'RUNNING' },
      };
      (mockJobsFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockStatusResponse);

      const mockAbortSignal = {
        addEventListener: jest.fn(),
      } as any;

      const mockCancellationHandler = jest.fn();
      (queryCancellation.createQueryCancellationHandler as jest.Mock).mockReturnValueOnce(
        mockCancellationHandler
      );

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: { query: 'SELECT * FROM s3_table', dataset: { type: DATASET.S3 } },
            pollQueryResultsParams: { queryId: 'running-sql-query-123' },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        { abortSignal: mockAbortSignal }
      );

      expect(queryCancellation.createQueryCancellationHandler).toHaveBeenCalledWith(
        'running-sql-query-123',
        expect.objectContaining({ query: 'SELECT * FROM s3_table', dataset: { type: DATASET.S3 } }),
        client,
        logger,
        'SQL'
      );
      expect(mockAbortSignal.addEventListener).toHaveBeenCalledWith('abort', mockCancellationHandler);
    });

    it('should not set up abort signal listener when no queryId is provided', async () => {
      const mockResponse = {
        success: true,
        data: { queryId: 'new-sql-query-123', status: 'RUNNING' },
      };
      (mockFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockResponse);

      const mockAbortSignal = {
        addEventListener: jest.fn(),
      } as any;

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: { query: { query: 'SELECT * FROM table', dataset: { id: 'test-dataset' } } },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        { abortSignal: mockAbortSignal }
      );

      expect(queryCancellation.createQueryCancellationHandler).not.toHaveBeenCalled();
      expect(mockAbortSignal.addEventListener).not.toHaveBeenCalled();
    });

    it('should handle facet errors during query initiation', async () => {
      const mockResponse = {
        success: false,
        data: { error: 'Failed to start SQL query' },
      };
      (mockFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockResponse);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);

      await expect(
        strategy.search(
          emptyRequestHandlerContext,
          ({
            body: { query: { query: 'SELECT * FROM table' } },
          } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
          {}
        )
      ).rejects.toThrow();

      expect(usage?.trackError).toHaveBeenCalled();
    });

    it('should handle exceptions and track errors', async () => {
      const mockError = new Error('Database connection failed');
      (mockFacet.describeQuery as jest.Mock).mockRejectedValueOnce(mockError);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);

      await expect(
        strategy.search(
          emptyRequestHandlerContext,
          ({
            body: { query: { query: 'SELECT * FROM table' } },
          } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
          {}
        )
      ).rejects.toThrow(mockError);

      expect(logger.error).toHaveBeenCalledWith(`sqlAsyncSearchStrategy: ${mockError.message}`);
      expect(usage?.trackError).toHaveBeenCalled();
    });
  });

  describe('cancel method', () => {
    it('should cancel query for S3 data source', async () => {
      const mockCancelQuery = queryCancellation.cancelQueryByDataSource as jest.Mock;
      mockCancelQuery.mockResolvedValueOnce(undefined);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      await strategy.cancel!(emptyRequestHandlerContext, 'test-sql-query-123');

      expect(mockCancelQuery).toHaveBeenCalledWith('test-sql-query-123', undefined, client, logger, 'SQL');
      expect(logger.info).toHaveBeenCalledWith(
        'sqlAsyncSearchStrategy: Cancelling backend query test-sql-query-123'
      );
      expect(logger.info).toHaveBeenCalledWith(
        'sqlAsyncSearchStrategy: Successfully cancelled backend query test-sql-query-123'
      );
    });

    it('should cancel query for default data source when type is undefined', async () => {
      const mockCancelQuery = queryCancellation.cancelQueryByDataSource as jest.Mock;
      mockCancelQuery.mockResolvedValueOnce(undefined);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      await strategy.cancel!(emptyRequestHandlerContext, 'test-sql-query-456');

      expect(mockCancelQuery).toHaveBeenCalledWith('test-sql-query-456', undefined, client, logger, 'SQL');
      expect(logger.info).toHaveBeenCalledWith(
        'sqlAsyncSearchStrategy: Cancelling backend query test-sql-query-456'
      );
    });

    it('should handle cancellation errors', async () => {
      const mockError = new Error('SQL cancellation failed');
      const mockCancelQuery = queryCancellation.cancelQueryByDataSource as jest.Mock;
      mockCancelQuery.mockRejectedValueOnce(mockError);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);

      await expect(
        strategy.cancel!(emptyRequestHandlerContext, 'test-sql-query-789')
      ).rejects.toThrow(mockError);

      expect(logger.error).toHaveBeenCalledWith(
        'sqlAsyncSearchStrategy: Failed to cancel backend query test-sql-query-789: SQL cancellation failed'
      );
    });

    it('should handle different data source types correctly', async () => {
      const mockCancelQuery = queryCancellation.cancelQueryByDataSource as jest.Mock;
      mockCancelQuery.mockResolvedValueOnce(undefined);

      const strategy = sqlAsyncSearchStrategyProvider(config$, logger, client, usage);
      await strategy.cancel!(emptyRequestHandlerContext, 'test-query-cloudwatch');

      expect(mockCancelQuery).toHaveBeenCalledWith('test-query-cloudwatch', undefined, client, logger, 'SQL');
      expect(logger.info).toHaveBeenCalledWith(
        'sqlAsyncSearchStrategy: Cancelling backend query test-query-cloudwatch'
      );
    });
  });
});