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

  describe('Jaeger Schema Detection', () => {
    it('uses Jaeger field names for Jaeger indices', async () => {
      const jaegerDataset: Dataset = {
        id: 'jaeger-dataset-id',
        title: 'jaeger-span-2025-11-19',
        type: 'INDEX_PATTERN',
      };

      await tracePPLService.fetchTraceSpans({
        traceId: 'test-trace-id',
        dataset: jaegerDataset,
      });

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'jaeger-dataset-id',
          title: 'jaeger-span-2025-11-19',
          type: 'INDEX_PATTERN',
        },
        'source = jaeger-span-2025-11-19 | where traceID = "test-trace-id" | head 100'
      );
    });

    it('uses Jaeger field names for span details query', async () => {
      const jaegerDataset: Dataset = {
        id: 'jaeger-dataset-id',
        title: 'jaeger-span*',
        type: 'INDEX_PATTERN',
      };

      await tracePPLService.fetchSpanDetails({
        traceId: 'test-trace-id',
        spanId: 'test-span-id',
        dataset: jaegerDataset,
      });

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'jaeger-dataset-id',
          title: 'jaeger-span*',
          type: 'INDEX_PATTERN',
        },
        'source = jaeger-span* | where traceID = "test-trace-id" | where spanID = "test-span-id" | head 100'
      );
    });

    it('uses DataPrepper field names for non-Jaeger indices', async () => {
      const dataPrepperDataset: Dataset = {
        id: 'dataprepper-dataset-id',
        title: 'otel-traces-2025',
        type: 'INDEX_PATTERN',
      };

      await tracePPLService.fetchTraceSpans({
        traceId: 'test-trace-id',
        dataset: dataPrepperDataset,
      });

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'dataprepper-dataset-id',
          title: 'otel-traces-2025',
          type: 'INDEX_PATTERN',
        },
        'source = otel-traces-2025 | where traceId = "test-trace-id" | head 100'
      );
    });

    it('respects explicit schema mappings over auto-detection', async () => {
      const datasetWithMappings: Dataset = {
        id: 'custom-dataset-id',
        title: 'jaeger-span-custom', // Would normally trigger Jaeger detection
        type: 'INDEX_PATTERN',
        schemaMappings: {
          otelTraces: {
            traceId: 'custom_trace_field',
            spanId: 'custom_span_field',
          },
        },
      };

      await tracePPLService.fetchSpanDetails({
        traceId: 'test-trace-id',
        spanId: 'test-span-id',
        dataset: datasetWithMappings,
      });

      expect(mockBuildPPLQueryRequest).toHaveBeenCalledWith(
        {
          id: 'custom-dataset-id',
          title: 'jaeger-span-custom',
          type: 'INDEX_PATTERN',
          schemaMappings: {
            otelTraces: {
              traceId: 'custom_trace_field',
              spanId: 'custom_span_field',
            },
          },
        },
        'source = jaeger-span-custom | where custom_trace_field = "test-trace-id" | where custom_span_field = "test-span-id" | head 100'
      );
    });
  });
});
