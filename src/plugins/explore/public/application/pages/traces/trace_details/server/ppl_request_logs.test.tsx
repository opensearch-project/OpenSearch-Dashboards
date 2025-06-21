/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLService } from './ppl_request_helpers';
import { fetchLogsData, LogsRequestParams } from './ppl_request_logs';

describe('ppl_request_logs', () => {
  const mockExecuteQuery = jest.fn();
  const mockPPLService = ({
    executeQuery: mockExecuteQuery,
  } as unknown) as PPLService;

  const defaultParams: LogsRequestParams = {
    traceId: 'test-trace-id',
    dataSourceId: 'test-source',
    pplService: mockPPLService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchLogsData', () => {
    it('throws error when missing required parameters', async () => {
      await expect(fetchLogsData({ ...defaultParams, traceId: '' })).rejects.toThrow(
        'Missing required parameters'
      );
      await expect(fetchLogsData({ ...defaultParams, dataSourceId: '' })).rejects.toThrow(
        'Missing required parameters'
      );
      await expect(
        fetchLogsData({ ...defaultParams, pplService: undefined as any })
      ).rejects.toThrow('Missing required parameters');
    });

    it('returns empty result when index does not exist', async () => {
      // Mock index check query to fail
      mockExecuteQuery.mockRejectedValueOnce(new Error('index_not_found'));

      const result = await fetchLogsData(defaultParams);

      expect(result).toEqual({
        datarows: [],
        schema: [],
        total: 0,
      });
      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
    });

    it('returns empty result for inaccessible index', async () => {
      // Mock index check query to fail
      mockExecuteQuery.mockRejectedValueOnce(new Error('no such index'));

      const result = await fetchLogsData(defaultParams);

      expect(result).toEqual({
        datarows: [],
        schema: [],
        total: 0,
      });
      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
    });

    it('fetches logs data successfully', async () => {
      const mockResponse = {
        datarows: [['log1'], ['log2']],
        schema: [{ name: 'log' }],
        total: 2,
      };

      // Mock successful index check
      mockExecuteQuery.mockResolvedValueOnce({});
      // Mock successful log fetch
      mockExecuteQuery.mockResolvedValueOnce(mockResponse);

      const result = await fetchLogsData(defaultParams);

      expect(result).toEqual(mockResponse);
      expect(mockExecuteQuery).toHaveBeenCalledTimes(2);
      expect(mockExecuteQuery).toHaveBeenLastCalledWith(
        'test-source',
        'logs-otel-v1-*',
        'source = logs-otel-v1-* | where traceId = "test-trace-id"'
      );
    });

    it('handles non-index related errors', async () => {
      const error = new Error('Query execution failed');
      // Mock successful index check
      mockExecuteQuery.mockResolvedValueOnce({});
      // Mock query execution error
      mockExecuteQuery.mockRejectedValueOnce(error);

      await expect(fetchLogsData(defaultParams)).rejects.toThrow(error);
      expect(mockExecuteQuery).toHaveBeenCalledTimes(2);
    });

    it('handles IndexNotFoundException', async () => {
      // Mock index check query to fail
      mockExecuteQuery.mockRejectedValueOnce(new Error('IndexNotFoundException'));

      const result = await fetchLogsData(defaultParams);

      expect(result).toEqual({
        datarows: [],
        schema: [],
        total: 0,
      });
      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
    });

    it('uses correct index pattern', async () => {
      // Mock successful index check
      mockExecuteQuery.mockResolvedValueOnce({});
      // Mock successful log fetch
      mockExecuteQuery.mockResolvedValueOnce({});

      await fetchLogsData(defaultParams);

      // Check both calls use the correct index pattern
      expect(mockExecuteQuery).toHaveBeenNthCalledWith(
        1,
        'test-source',
        'logs-otel-v1-*',
        'source = logs-otel-v1-* | head 1'
      );
      expect(mockExecuteQuery).toHaveBeenNthCalledWith(
        2,
        'test-source',
        'logs-otel-v1-*',
        'source = logs-otel-v1-* | where traceId = "test-trace-id"'
      );
    });

    it('handles error with undefined message', async () => {
      // Mock index check query to fail with undefined error message
      mockExecuteQuery.mockRejectedValueOnce(undefined);

      const result = await fetchLogsData(defaultParams);

      expect(result).toEqual({
        datarows: [],
        schema: [],
        total: 0,
      });
      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
    });
  });
});
