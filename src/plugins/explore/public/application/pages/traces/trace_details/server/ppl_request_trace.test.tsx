/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../../../data/public';
import {
  TracePPLService,
  PPLQueryParamsWithFilters,
  PPLSpanQueryParams,
} from './ppl_request_trace';

describe('ppl_request_trace', () => {
  const mockExecuteQuery = jest.fn();
  const mockDataService = ({
    query: {
      queryString: {
        setQuery: jest.fn(),
      },
    },
    search: {
      search: jest.fn(),
    },
  } as unknown) as DataPublicPluginStart;

  let tracePPLService: TracePPLService;

  beforeEach(() => {
    jest.clearAllMocks();
    tracePPLService = new TracePPLService(mockDataService);
    // @ts-ignore - accessing private method for testing
    tracePPLService.executeQuery = mockExecuteQuery;
  });

  describe('fetchTraceSpans', () => {
    const defaultParams: PPLQueryParamsWithFilters = {
      traceId: 'test-trace-id',
      dataSourceId: 'test-source',
      indexPattern: 'test-index',
    };

    it('throws error when missing required parameters', async () => {
      await expect(
        tracePPLService.fetchTraceSpans({ ...defaultParams, traceId: '' })
      ).rejects.toThrow('Missing required parameters');
      await expect(
        tracePPLService.fetchTraceSpans({ ...defaultParams, dataSourceId: '' })
      ).rejects.toThrow('Missing required parameters');
      await expect(
        tracePPLService.fetchTraceSpans({ ...defaultParams, indexPattern: '' })
      ).rejects.toThrow('Missing required parameters');
    });

    it('constructs query without filters', async () => {
      await tracePPLService.fetchTraceSpans(defaultParams);

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'test-source',
        'test-index',
        'source = test-index | where traceId = "test-trace-id" | head 100'
      );
    });

    it('constructs query with single filter', async () => {
      await tracePPLService.fetchTraceSpans({
        ...defaultParams,
        filters: [{ field: 'serviceName', value: 'test-service' }],
      });

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'test-source',
        'test-index',
        'source = test-index | where traceId = "test-trace-id" | where serviceName = "test-service" | head 100'
      );
    });

    it('constructs query with multiple filters', async () => {
      await tracePPLService.fetchTraceSpans({
        ...defaultParams,
        filters: [
          { field: 'serviceName', value: 'test-service' },
          { field: 'status', value: 'error' },
        ],
      });

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'test-source',
        'test-index',
        'source = test-index | where traceId = "test-trace-id" | where serviceName = "test-service" | where status = "error" | head 100'
      );
    });

    it('escapes filter values correctly', async () => {
      await tracePPLService.fetchTraceSpans({
        ...defaultParams,
        filters: [
          { field: 'serviceName', value: 'test"service' },
          { field: 'count', value: 123 },
          { field: 'active', value: true },
        ],
      });

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'test-source',
        'test-index',
        'source = test-index | where traceId = "test-trace-id" | where serviceName = "test\\"service" | where count = 123 | where active = true | head 100'
      );
    });

    it('uses custom limit', async () => {
      await tracePPLService.fetchTraceSpans({
        ...defaultParams,
        limit: 50,
      });

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'test-source',
        'test-index',
        'source = test-index | where traceId = "test-trace-id" | head 50'
      );
    });

    it('handles query execution error', async () => {
      const error = new Error('Query failed');
      mockExecuteQuery.mockRejectedValueOnce(error);

      await expect(tracePPLService.fetchTraceSpans(defaultParams)).rejects.toThrow(error);
    });
  });

  describe('fetchSpanDetails', () => {
    const defaultParams: PPLSpanQueryParams = {
      traceId: 'test-trace-id',
      spanId: 'test-span-id',
      dataSourceId: 'test-source',
      indexPattern: 'test-index',
    };

    it('throws error when missing required parameters', async () => {
      await expect(
        tracePPLService.fetchSpanDetails({ ...defaultParams, traceId: '' })
      ).rejects.toThrow('Missing required parameters');
      await expect(
        tracePPLService.fetchSpanDetails({ ...defaultParams, spanId: '' })
      ).rejects.toThrow('Missing required parameters');
      await expect(
        tracePPLService.fetchSpanDetails({ ...defaultParams, dataSourceId: '' })
      ).rejects.toThrow('Missing required parameters');
      await expect(
        tracePPLService.fetchSpanDetails({ ...defaultParams, indexPattern: '' })
      ).rejects.toThrow('Missing required parameters');
    });

    it('constructs span query correctly', async () => {
      await tracePPLService.fetchSpanDetails(defaultParams);

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'test-source',
        'test-index',
        'source = test-index | where traceId = "test-trace-id" | where spanId = "test-span-id" | head 100'
      );
    });

    it('uses custom limit', async () => {
      await tracePPLService.fetchSpanDetails({
        ...defaultParams,
        limit: 50,
      });

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'test-source',
        'test-index',
        'source = test-index | where traceId = "test-trace-id" | where spanId = "test-span-id" | head 50'
      );
    });

    it('handles query execution error', async () => {
      const error = new Error('Query failed');
      mockExecuteQuery.mockRejectedValueOnce(error);

      await expect(tracePPLService.fetchSpanDetails(defaultParams)).rejects.toThrow(error);
    });
  });
});
