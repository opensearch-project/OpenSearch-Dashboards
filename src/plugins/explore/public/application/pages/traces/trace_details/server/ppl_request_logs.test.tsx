/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../../../data/public';
import { Dataset } from '../../../../../../../data/common';
import {
  fetchTraceLogsByTraceId,
  transformLogsResponseToHits,
  PPLLogsQueryParams,
} from './ppl_request_logs';
import { PPLService } from './ppl_request_helpers';

jest.mock('./ppl_request_helpers', () => ({
  PPLService: jest.fn().mockImplementation(() => ({
    executeQuery: jest.fn(),
  })),
}));

describe('ppl_request_logs', () => {
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

  const createMockDataset = (): Dataset => ({
    id: 'test-dataset-id',
    title: 'test-logs-index',
    type: 'INDEX_PATTERN',
    timeFieldName: '@timestamp',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTraceLogsByTraceId', () => {
    const defaultParams: PPLLogsQueryParams = {
      traceId: 'test-trace-id-123',
      dataset: createMockDataset(),
    };

    it('throws error when traceId is missing', async () => {
      const params = { ...defaultParams, traceId: '' };
      await expect(fetchTraceLogsByTraceId(mockDataService, params)).rejects.toThrow(
        'Missing required parameters: traceId and dataset'
      );
    });

    it('throws error when traceId is undefined', async () => {
      const params = { ...defaultParams, traceId: undefined as any };
      await expect(fetchTraceLogsByTraceId(mockDataService, params)).rejects.toThrow(
        'Missing required parameters: traceId and dataset'
      );
    });

    it('throws error when dataset is missing', async () => {
      const params = { ...defaultParams, dataset: null as any };
      await expect(fetchTraceLogsByTraceId(mockDataService, params)).rejects.toThrow(
        'Missing required parameters: traceId and dataset'
      );
    });

    it('throws error when dataset is undefined', async () => {
      const params = { ...defaultParams, dataset: undefined as any };
      await expect(fetchTraceLogsByTraceId(mockDataService, params)).rejects.toThrow(
        'Missing required parameters: traceId and dataset'
      );
    });

    it('executes PPL query with correct parameters and default limit', async () => {
      const mockExecuteQuery = jest.fn().mockResolvedValue({ body: { fields: [] } });
      (PPLService as jest.Mock).mockImplementation(() => ({
        executeQuery: mockExecuteQuery,
      }));

      await fetchTraceLogsByTraceId(mockDataService, defaultParams);

      expect(PPLService).toHaveBeenCalledWith(mockDataService);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        {
          id: 'test-dataset-id',
          title: 'test-logs-index',
          type: 'INDEX_PATTERN',
          // timeFieldName is omitted to prevent automatic time filtering
        },
        'source = test-logs-index | where traceId = "test-trace-id-123" | head 1000'
      );
    });

    it('executes PPL query with custom limit', async () => {
      const mockExecuteQuery = jest.fn().mockResolvedValue({ body: { fields: [] } });
      (PPLService as jest.Mock).mockImplementation(() => ({
        executeQuery: mockExecuteQuery,
      }));

      const params = { ...defaultParams, limit: 500 };
      await fetchTraceLogsByTraceId(mockDataService, params);

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        {
          id: 'test-dataset-id',
          title: 'test-logs-index',
          type: 'INDEX_PATTERN',
        },
        'source = test-logs-index | where traceId = "test-trace-id-123" | head 500'
      );
    });

    it('handles special characters in traceId', async () => {
      const mockExecuteQuery = jest.fn().mockResolvedValue({ body: { fields: [] } });
      (PPLService as jest.Mock).mockImplementation(() => ({
        executeQuery: mockExecuteQuery,
      }));

      const params = { ...defaultParams, traceId: 'trace-with-"quotes"' };
      await fetchTraceLogsByTraceId(mockDataService, params);

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.any(Object),
        'source = test-logs-index | where traceId = "trace-with-"quotes"" | head 1000'
      );
    });

    it('returns the response from PPLService', async () => {
      const mockResponse = { body: { fields: [], size: 0 } };
      const mockExecuteQuery = jest.fn().mockResolvedValue(mockResponse);
      (PPLService as jest.Mock).mockImplementation(() => ({
        executeQuery: mockExecuteQuery,
      }));

      const result = await fetchTraceLogsByTraceId(mockDataService, defaultParams);

      expect(result).toBe(mockResponse);
    });

    it('handles PPL service execution errors', async () => {
      const error = new Error('PPL execution failed');
      const mockExecuteQuery = jest.fn().mockRejectedValue(error);
      (PPLService as jest.Mock).mockImplementation(() => ({
        executeQuery: mockExecuteQuery,
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(fetchTraceLogsByTraceId(mockDataService, defaultParams)).rejects.toThrow(error);

      expect(consoleSpy).toHaveBeenCalledWith('PPL Logs Query Error:', error);
      consoleSpy.mockRestore();
    });

    it('omits timeFieldName from dataset to prevent automatic time filtering', async () => {
      const mockExecuteQuery = jest.fn().mockResolvedValue({ body: { fields: [] } });
      (PPLService as jest.Mock).mockImplementation(() => ({
        executeQuery: mockExecuteQuery,
      }));

      const datasetWithTime = {
        ...createMockDataset(),
        timeFieldName: '@timestamp',
      };
      const params = { ...defaultParams, dataset: datasetWithTime };

      await fetchTraceLogsByTraceId(mockDataService, params);

      const [datasetArg] = mockExecuteQuery.mock.calls[0];
      expect(datasetArg).not.toHaveProperty('timeFieldName');
      expect(datasetArg).toEqual({
        id: 'test-dataset-id',
        title: 'test-logs-index',
        type: 'INDEX_PATTERN',
      });
    });
  });

  describe('transformLogsResponseToHits', () => {
    it('returns empty array when response is null', () => {
      const result = transformLogsResponseToHits(null);
      expect(result).toEqual([]);
    });

    it('returns empty array when response is undefined', () => {
      const result = transformLogsResponseToHits(undefined);
      expect(result).toEqual([]);
    });

    it('returns empty array when response.body is missing', () => {
      const response = {};
      const result = transformLogsResponseToHits(response);
      expect(result).toEqual([]);
    });

    it('returns empty array when response.body.fields is missing', () => {
      const response = { body: {} };
      const result = transformLogsResponseToHits(response);
      expect(result).toEqual([]);
    });

    it('returns empty array when size is 0', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: [] },
            { name: 'body', values: [] },
          ],
          size: 0,
        },
      };
      const result = transformLogsResponseToHits(response);
      expect(result).toEqual([]);
    });

    it('returns empty array when fields array is empty', () => {
      const response = {
        body: {
          fields: [],
          size: 5,
        },
      };
      const result = transformLogsResponseToHits(response);
      expect(result).toEqual([]);
    });

    it('transforms single log entry correctly', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123'] },
            { name: 'spanId', values: ['span-456'] },
            { name: 'body', values: ['Log message content'] },
            { name: 'severityText', values: ['INFO'] },
            { name: 'time', values: ['2023-01-01T12:00:00Z'] },
          ],
          size: 1,
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        _id: 'log-0',
        _source: {
          traceId: 'trace-123',
          spanId: 'span-456',
          body: 'Log message content',
          severityText: 'INFO',
          time: '2023-01-01T12:00:00Z',
        },
        timestamp: '2023-01-01T12:00:00Z',
        traceId: 'trace-123',
        spanId: 'span-456',
        message: 'Log message content',
        level: 'INFO',
      });
    });

    it('transforms multiple log entries correctly', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123', 'trace-123'] },
            { name: 'spanId', values: ['span-456', 'span-789'] },
            { name: 'body', values: ['First log', 'Second log'] },
            { name: 'severityText', values: ['INFO', 'ERROR'] },
            { name: 'time', values: ['2023-01-01T12:00:00Z', '2023-01-01T12:01:00Z'] },
          ],
          size: 2,
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        _id: 'log-0',
        _source: {
          traceId: 'trace-123',
          spanId: 'span-456',
          body: 'First log',
          severityText: 'INFO',
          time: '2023-01-01T12:00:00Z',
        },
        timestamp: '2023-01-01T12:00:00Z',
        traceId: 'trace-123',
        spanId: 'span-456',
        message: 'First log',
        level: 'INFO',
      });
      expect(result[1]).toEqual({
        _id: 'log-1',
        _source: {
          traceId: 'trace-123',
          spanId: 'span-789',
          body: 'Second log',
          severityText: 'ERROR',
          time: '2023-01-01T12:01:00Z',
        },
        timestamp: '2023-01-01T12:01:00Z',
        traceId: 'trace-123',
        spanId: 'span-789',
        message: 'Second log',
        level: 'ERROR',
      });
    });

    it('handles alternative timestamp field names', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123'] },
            { name: '@timestamp', values: ['2023-01-01T12:00:00Z'] },
            { name: 'body', values: ['Log message'] },
          ],
          size: 1,
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result[0].timestamp).toBe('2023-01-01T12:00:00Z');
    });

    it('handles alternative message field names', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123'] },
            { name: 'message', values: ['Alternative message field'] },
            { name: 'time', values: ['2023-01-01T12:00:00Z'] },
          ],
          size: 1,
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result[0].message).toBe('Alternative message field');
    });

    it('handles alternative severity field names', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123'] },
            { name: 'severity', values: ['WARN'] },
            { name: 'time', values: ['2023-01-01T12:00:00Z'] },
          ],
          size: 1,
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result[0].level).toBe('WARN');
    });

    it('handles level field for severity', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123'] },
            { name: 'level', values: ['DEBUG'] },
            { name: 'time', values: ['2023-01-01T12:00:00Z'] },
          ],
          size: 1,
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result[0].level).toBe('DEBUG');
    });

    it('uses current timestamp when no time field is present', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123'] },
            { name: 'body', values: ['Log without timestamp'] },
          ],
          size: 1,
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('handles missing optional fields gracefully', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123'] },
            { name: 'time', values: ['2023-01-01T12:00:00Z'] },
          ],
          size: 1,
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result[0]).toEqual({
        _id: 'log-0',
        _source: {
          traceId: 'trace-123',
          time: '2023-01-01T12:00:00Z',
        },
        timestamp: '2023-01-01T12:00:00Z',
        traceId: 'trace-123',
        spanId: undefined,
        message: undefined,
        level: undefined,
      });
    });

    it('handles complex field data correctly', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123'] },
            { name: 'spanId', values: ['span-456'] },
            { name: 'body', values: ['{"level":"info","message":"Complex log"}'] },
            { name: 'severityText', values: ['INFO'] },
            { name: 'time', values: ['2023-01-01T12:00:00Z'] },
            { name: 'customField', values: ['custom-value'] },
          ],
          size: 1,
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result[0]._source).toEqual({
        traceId: 'trace-123',
        spanId: 'span-456',
        body: '{"level":"info","message":"Complex log"}',
        severityText: 'INFO',
        time: '2023-01-01T12:00:00Z',
        customField: 'custom-value',
      });
    });

    it('handles response without explicit size field', () => {
      const response = {
        body: {
          fields: [
            { name: 'traceId', values: ['trace-123'] },
            { name: 'body', values: ['Log message'] },
          ],
          // size field is missing
        },
      };

      const result = transformLogsResponseToHits(response);

      expect(result).toEqual([]);
    });
  });
});
