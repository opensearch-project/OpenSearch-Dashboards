/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../../../data/public';
import { Dataset } from '../../../../../../../data/common';
import {
  TracePPLService,
  PPLQueryParamsWithFilters,
  PPLSpanQueryParams,
} from './ppl_request_trace';
import { buildPPLQueryRequest, executePPLQuery } from './ppl_request_helpers';

jest.mock('./ppl_request_helpers', () => ({
  ...jest.requireActual('./ppl_request_helpers'),
  buildPPLQueryRequest: jest.fn(),
  executePPLQuery: jest.fn(),
}));

describe('ppl_request_trace', () => {
  const mockBuildPPLQueryRequest = buildPPLQueryRequest as jest.MockedFunction<
    typeof buildPPLQueryRequest
  >;
  const mockExecutePPLQuery = executePPLQuery as jest.MockedFunction<typeof executePPLQuery>;

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

  const createMockDataset = (): Dataset => ({
    id: 'test-dataset-id',
    title: 'test-index',
    type: 'INDEX_PATTERN',
    timeFieldName: 'endTime',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tracePPLService = new TracePPLService(mockDataService);

    mockBuildPPLQueryRequest.mockReturnValue({ query: { query: 'mock-query' } } as any);
    mockExecutePPLQuery.mockResolvedValue({ hits: [] });
  });

  describe('fetchTraceSpans', () => {
    const defaultParams: PPLQueryParamsWithFilters = {
      traceId: 'test-trace-id',
      dataset: createMockDataset(),
    };

    it('throws error when missing required parameters', async () => {
      await expect(
        tracePPLService.fetchTraceSpans({ ...defaultParams, traceId: '' })
      ).rejects.toThrow('Missing required parameters');
      await expect(
        tracePPLService.fetchTraceSpans({ ...defaultParams, dataset: null as any })
      ).rejects.toThrow('Missing required parameters');
    });

    it('constructs query without filters', async () => {
      await tracePPLService.fetchTraceSpans(defaultParams);

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'test-dataset-id',
          title: 'test-index',
          type: 'INDEX_PATTERN',
        },
        'source = test-index | where traceId = "test-trace-id" | head 100'
      );
      expect(mockExecutePPLQuery).toHaveBeenCalledWith(mockDataService, {
        query: { query: 'mock-query' },
      });
    });

    it('constructs query with single filter', async () => {
      await tracePPLService.fetchTraceSpans({
        ...defaultParams,
        filters: [{ field: 'serviceName', value: 'test-service' }],
      });

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'test-dataset-id',
          title: 'test-index',
          type: 'INDEX_PATTERN',
        },
        'source = test-index | where traceId = "test-trace-id" | where serviceName = "test-service" | head 100'
      );
      expect(mockExecutePPLQuery).toHaveBeenCalledWith(mockDataService, {
        query: { query: 'mock-query' },
      });
    });

    it('constructs query with multiple filters', async () => {
      await tracePPLService.fetchTraceSpans({
        ...defaultParams,
        filters: [
          { field: 'serviceName', value: 'test-service' },
          { field: 'status', value: 'error' },
        ],
      });

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'test-dataset-id',
          title: 'test-index',
          type: 'INDEX_PATTERN',
        },
        'source = test-index | where traceId = "test-trace-id" | where serviceName = "test-service" | where status = "error" | head 100'
      );
      expect(mockExecutePPLQuery).toHaveBeenCalledWith(mockDataService, {
        query: { query: 'mock-query' },
      });
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

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'test-dataset-id',
          title: 'test-index',
          type: 'INDEX_PATTERN',
        },
        'source = test-index | where traceId = "test-trace-id" | where serviceName = "test\\"service" | where count = 123 | where active = true | head 100'
      );
      expect(mockExecutePPLQuery).toHaveBeenCalledWith(mockDataService, {
        query: { query: 'mock-query' },
      });
    });

    it('uses custom limit', async () => {
      await tracePPLService.fetchTraceSpans({
        ...defaultParams,
        limit: 50,
      });

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'test-dataset-id',
          title: 'test-index',
          type: 'INDEX_PATTERN',
        },
        'source = test-index | where traceId = "test-trace-id" | head 50'
      );
      expect(mockExecutePPLQuery).toHaveBeenCalledWith(mockDataService, {
        query: { query: 'mock-query' },
      });
    });

    it('handles query execution error', async () => {
      const error = new Error('Query failed');
      mockExecutePPLQuery.mockRejectedValueOnce(error);

      await expect(tracePPLService.fetchTraceSpans(defaultParams)).rejects.toThrow(error);
    });
  });

  describe('fetchSpanDetails', () => {
    const defaultParams: PPLSpanQueryParams = {
      traceId: 'test-trace-id',
      spanId: 'test-span-id',
      dataset: createMockDataset(),
    };

    it('throws error when missing required parameters', async () => {
      await expect(
        tracePPLService.fetchSpanDetails({ ...defaultParams, traceId: '' })
      ).rejects.toThrow('Missing required parameters');
      await expect(
        tracePPLService.fetchSpanDetails({ ...defaultParams, spanId: '' })
      ).rejects.toThrow('Missing required parameters');
      await expect(
        tracePPLService.fetchSpanDetails({ ...defaultParams, dataset: null as any })
      ).rejects.toThrow('Missing required parameters');
    });

    it('constructs span query correctly', async () => {
      await tracePPLService.fetchSpanDetails(defaultParams);

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'test-dataset-id',
          title: 'test-index',
          type: 'INDEX_PATTERN',
          timeFieldName: 'endTime',
        },
        'source = test-index | where traceId = "test-trace-id" | where spanId = "test-span-id" | head 100'
      );
      expect(mockExecutePPLQuery).toHaveBeenCalledWith(mockDataService, {
        query: { query: 'mock-query' },
      });
    });

    it('uses custom limit', async () => {
      await tracePPLService.fetchSpanDetails({
        ...defaultParams,
        limit: 50,
      });

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'test-dataset-id',
          title: 'test-index',
          type: 'INDEX_PATTERN',
          timeFieldName: 'endTime',
        },
        'source = test-index | where traceId = "test-trace-id" | where spanId = "test-span-id" | head 50'
      );
      expect(mockExecutePPLQuery).toHaveBeenCalledWith(mockDataService, {
        query: { query: 'mock-query' },
      });
    });

    it('handles query execution error', async () => {
      const error = new Error('Query failed');
      mockExecutePPLQuery.mockRejectedValueOnce(error);

      await expect(tracePPLService.fetchSpanDetails(defaultParams)).rejects.toThrow(error);
    });
  });
});
