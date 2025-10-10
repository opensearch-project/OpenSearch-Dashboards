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
import { pplAsyncSearchStrategyProvider } from './ppl_async_search_strategy';

jest.mock('../utils/facet');
jest.mock('../utils/query_cancellation');

describe('pplAsyncSearchStrategyProvider', () => {
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

    mockFacet = {
      describeQuery: jest.fn(),
    } as any;

    mockJobsFacet = {
      describeQuery: jest.fn(),
    } as any;

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
      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);
      expect(strategy).toHaveProperty('search');
      expect(strategy).toHaveProperty('cancel');
      expect(typeof strategy.search).toBe('function');
      expect(typeof strategy.cancel).toBe('function');
    });

    it('should initiate new query when no queryId is provided', async () => {
      const mockResponse = {
        success: true,
        data: { queryId: 'new-query-123', status: 'RUNNING' },
      };
      (mockFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockResponse);

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: { query: { query: 'source = table', dataset: { id: 'test-dataset' } } },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(mockFacet.describeQuery).toHaveBeenCalledWith(
        emptyRequestHandlerContext,
        expect.objectContaining({
          body: expect.objectContaining({
            lang: 'ppl',
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

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: { query: 'source = table', dataset: { id: 'test-dataset' } },
            pollQueryResultsParams: { queryId: 'existing-query-123' },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(mockJobsFacet.describeQuery).toHaveBeenCalledWith(
        emptyRequestHandlerContext,
        expect.objectContaining({
          params: { queryId: 'existing-query-123' },
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
            { name: 'field1', type: 'long' },
            { name: 'field2', type: 'text' },
          ],
          datarows: [
            [1, 'value1'],
            [2, 'value2'],
          ],
        },
      };
      (mockJobsFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockStatusResponse);

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: { query: 'source = table', dataset: { id: 'test-dataset' } },
            pollQueryResultsParams: { queryId: 'completed-query-123' },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(result).toEqual({
        type: DATA_FRAME_TYPES.POLLING,
        status: 'success',
        body: expect.objectContaining({
          name: 'test-dataset',
          size: 2,
        }),
      });
    });

    it('should return failure when query fails', async () => {
      const mockStatusResponse = {
        success: true,
        data: {
          status: 'FAILED',
          error: 'Query execution failed',
        },
      };
      (mockJobsFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockStatusResponse);

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: { query: 'source = table', dataset: { id: 'test-dataset' } },
            pollQueryResultsParams: { queryId: 'failed-query-123' },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(result).toEqual({
        type: DATA_FRAME_TYPES.POLLING,
        status: 'failed',
        body: {
          error: 'JOB: failed-query-123 failed: Query execution failed',
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

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);
      await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: { query: 'source = table', dataset: { type: DATASET.S3 } },
            pollQueryResultsParams: { queryId: 'running-query-123' },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        { abortSignal: mockAbortSignal }
      );

      expect(queryCancellation.createQueryCancellationHandler).toHaveBeenCalledWith(
        'running-query-123',
        expect.objectContaining({ query: 'source = table', dataset: { type: DATASET.S3 } }),
        client,
        logger,
        'PPL'
      );
      expect(mockAbortSignal.addEventListener).toHaveBeenCalledWith('abort', mockCancellationHandler);
    });

    it('should not set up abort signal listener when no queryId is provided', async () => {
      const mockResponse = {
        success: true,
        data: { queryId: 'new-query-123', status: 'RUNNING' },
      };
      (mockFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockResponse);

      const mockAbortSignal = {
        addEventListener: jest.fn(),
      } as any;

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);
      await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: { query: { query: 'source = table', dataset: { id: 'test-dataset' } } },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        { abortSignal: mockAbortSignal }
      );

      expect(queryCancellation.createQueryCancellationHandler).not.toHaveBeenCalled();
      expect(mockAbortSignal.addEventListener).not.toHaveBeenCalled();
    });

    it('should handle facet errors during query initiation', async () => {
      const mockResponse = {
        success: false,
        data: { error: 'Failed to start query' },
      };
      (mockFacet.describeQuery as jest.Mock).mockResolvedValueOnce(mockResponse);

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);

      await expect(
        strategy.search(
          emptyRequestHandlerContext,
          ({
            body: { query: { query: 'source = table' } },
          } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
          {}
        )
      ).rejects.toThrow();

      expect(usage?.trackError).toHaveBeenCalled();
    });

    it('should handle exceptions and track errors', async () => {
      const mockError = new Error('Network error');
      (mockFacet.describeQuery as jest.Mock).mockRejectedValueOnce(mockError);

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);

      await expect(
        strategy.search(
          emptyRequestHandlerContext,
          ({
            body: { query: { query: 'source = table' } },
          } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
          {}
        )
      ).rejects.toThrow(mockError);

      expect(logger.error).toHaveBeenCalledWith(`pplAsyncSearchStrategy: ${mockError.message}`);
      expect(usage?.trackError).toHaveBeenCalled();
    });
  });

  describe('cancel method', () => {
    it('should cancel query for S3 data source', async () => {
      const mockCancelQuery = queryCancellation.cancelQueryByDataSource as jest.Mock;
      mockCancelQuery.mockResolvedValueOnce(undefined);

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);
      await strategy.cancel!(emptyRequestHandlerContext, 'test-query-123');

      expect(mockCancelQuery).toHaveBeenCalledWith('test-query-123', undefined, client, logger, 'PPL');
      expect(logger.info).toHaveBeenCalledWith(
        'pplAsyncSearchStrategy: Cancelling backend query test-query-123'
      );
      expect(logger.info).toHaveBeenCalledWith(
        'pplAsyncSearchStrategy: Successfully cancelled backend query test-query-123'
      );
    });

    it('should cancel query for default data source when type is undefined', async () => {
      const mockCancelQuery = queryCancellation.cancelQueryByDataSource as jest.Mock;
      mockCancelQuery.mockResolvedValueOnce(undefined);

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);
      await strategy.cancel!(emptyRequestHandlerContext, 'test-query-456');

      expect(mockCancelQuery).toHaveBeenCalledWith('test-query-456', undefined, client, logger, 'PPL');
      expect(logger.info).toHaveBeenCalledWith(
        'pplAsyncSearchStrategy: Cancelling backend query test-query-456'
      );
    });

    it('should handle cancellation errors', async () => {
      const mockError = new Error('Cancellation failed');
      const mockCancelQuery = queryCancellation.cancelQueryByDataSource as jest.Mock;
      mockCancelQuery.mockRejectedValueOnce(mockError);

      const strategy = pplAsyncSearchStrategyProvider(config$, logger, client, usage);

      await expect(
        strategy.cancel!(emptyRequestHandlerContext, 'test-query-789')
      ).rejects.toThrow(mockError);

      expect(logger.error).toHaveBeenCalledWith(
        'pplAsyncSearchStrategy: Failed to cancel backend query test-query-789: Cancellation failed'
      );
    });
  });
});