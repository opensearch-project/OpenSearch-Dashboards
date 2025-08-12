/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildExploreLogsUrl, getTimeRangeFromTraceData, filterLogsBySpanId } from './url_builder';
import { Dataset } from '../../../../../../../../data/common';
import { LogHit } from '../../server/ppl_request_logs';

jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  const mockMoment = (input?: any) => {
    if (input) {
      return actualMoment(input);
    }
    return actualMoment('2023-01-01T12:00:00Z');
  };

  Object.setPrototypeOf(mockMoment, actualMoment);
  Object.assign(mockMoment, actualMoment);

  return mockMoment;
});

describe('url_builder', () => {
  const mockLocation = {
    origin: 'https://example.com',
    pathname: '/app/explore',
  };

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
  });

  describe('buildExploreLogsUrl', () => {
    const mockLogDataset: Dataset = {
      id: 'logs-dataset-id',
      title: 'logs-*',
      timeFieldName: '@timestamp',
      type: 'INDEX_PATTERN',
    };

    const mockTimeRange = {
      from: '2023-01-01T10:00:00.000Z',
      to: '2023-01-01T14:00:00.000Z',
    };

    it('should build URL with trace ID only', () => {
      const params = {
        traceId: 'test-trace-id',
        logDataset: mockLogDataset,
        timeRange: mockTimeRange,
      };

      const result = buildExploreLogsUrl(params);

      expect(result).toContain('https://example.com/app/explore/logs/#/');
      expect(result).toContain('test-trace-id');
      expect(result).toContain("id:'logs-dataset-id'");
      expect(result).toContain("title:'logs-*'");
      expect(result).toContain('timeFieldName:@timestamp');
      expect(result).toContain("from:'2023-01-01T10:00:00.000Z'");
      expect(result).toContain("to:'2023-01-01T14:00:00.000Z'");
    });

    it('should build URL with trace ID and span ID', () => {
      const params = {
        traceId: 'test-trace-id',
        spanId: 'test-span-id',
        logDataset: mockLogDataset,
        timeRange: mockTimeRange,
      };

      const result = buildExploreLogsUrl(params);

      expect(result).toContain('test-trace-id');
      expect(result).toContain('test-span-id');
    });

    it('should handle custom base path', () => {
      mockLocation.pathname = '/custom-base/app/explore';

      const params = {
        traceId: 'test-trace-id',
        logDataset: mockLogDataset,
        timeRange: mockTimeRange,
      };

      const result = buildExploreLogsUrl(params);

      expect(result).toContain('https://example.com/custom-base/app/explore/logs/#/');
    });

    it('should handle dataset with custom time field', () => {
      const customDataset: Dataset = {
        ...mockLogDataset,
        timeFieldName: 'custom_timestamp',
      };

      const params = {
        traceId: 'test-trace-id',
        logDataset: customDataset,
        timeRange: mockTimeRange,
      };

      const result = buildExploreLogsUrl(params);

      expect(result).toContain('timeFieldName:custom_timestamp');
    });

    it('should use default time field when not specified', () => {
      const datasetWithoutTimeField: Dataset = {
        id: 'logs-dataset-id',
        title: 'logs-*',
        type: 'INDEX_PATTERN',
      };

      const params = {
        traceId: 'test-trace-id',
        logDataset: datasetWithoutTimeField,
        timeRange: mockTimeRange,
      };

      const result = buildExploreLogsUrl(params);

      expect(result).toContain('timeFieldName:time');
    });
  });

  describe('getTimeRangeFromTraceData', () => {
    it('should calculate time range from trace data with start and end times', () => {
      const traceData = [
        {
          startTime: '2023-01-01T10:00:00Z',
          endTime: '2023-01-01T10:01:00Z',
        },
        {
          startTime: '2023-01-01T10:00:30Z',
          endTime: '2023-01-01T10:01:30Z',
        },
      ];

      const result = getTimeRangeFromTraceData(traceData);

      // Should add 30 minutes buffer on each side
      expect(result.from).toBe('2023-01-01T09:30:00.000Z');
      expect(result.to).toBe('2023-01-01T10:31:30.000Z');
    });

    it('should handle trace data with only timestamps', () => {
      const traceData = [
        {
          timestamp: '2023-01-01T10:00:00Z',
        },
        {
          timestamp: '2023-01-01T10:01:00Z',
        },
      ];

      const result = getTimeRangeFromTraceData(traceData);

      expect(result.from).toBe('2023-01-01T09:30:00.000Z');
      expect(result.to).toBe('2023-01-01T10:31:00.000Z');
    });

    it('should handle trace data with duration', () => {
      const traceData = [
        {
          startTime: '2023-01-01T10:00:00Z',
          durationInNanos: 60000000, // 60 seconds in nanoseconds
        },
      ];

      const result = getTimeRangeFromTraceData(traceData);

      expect(result.from).toBe('2023-01-01T09:30:00.000Z');
      expect(result.to).toBe('2023-01-01T10:30:00.000Z'); // Duration is added in microseconds, not seconds
    });

    it('should handle mixed data formats', () => {
      const traceData = [
        {
          startTime: '2023-01-01T10:00:00Z',
          endTime: '2023-01-01T10:01:00Z',
        },
        {
          timestamp: '2023-01-01T10:02:00Z',
        },
        {
          startTime: '2023-01-01T09:59:00Z',
          durationInNanos: 30000000, // 30 seconds
        },
      ];

      const result = getTimeRangeFromTraceData(traceData);

      // Earliest: 09:59:00, Latest: 10:02:00
      expect(result.from).toBe('2023-01-01T09:29:00.000Z');
      expect(result.to).toBe('2023-01-01T10:32:00.000Z');
    });

    it('should throw error for empty trace data', () => {
      expect(() => getTimeRangeFromTraceData([])).toThrow(
        'No trace data available for time range calculation'
      );
    });

    it('should throw error for null trace data', () => {
      expect(() => getTimeRangeFromTraceData(null as any)).toThrow(
        'No trace data available for time range calculation'
      );
    });

    it('should throw error when no valid timestamps found', () => {
      const traceData = [
        {
          someOtherField: 'value',
        },
        {
          anotherField: 'value',
        },
      ];

      expect(() => getTimeRangeFromTraceData(traceData)).toThrow(
        'No valid timestamps found in trace data'
      );
    });

    it('should handle single trace entry', () => {
      const traceData = [
        {
          startTime: '2023-01-01T10:00:00Z',
          endTime: '2023-01-01T10:01:00Z',
        },
      ];

      const result = getTimeRangeFromTraceData(traceData);

      expect(result.from).toBe('2023-01-01T09:30:00.000Z');
      expect(result.to).toBe('2023-01-01T10:31:00.000Z');
    });
  });

  describe('filterLogsBySpanId', () => {
    const mockLogs: LogHit[] = [
      {
        _id: 'log-1',
        _source: {
          message: 'Log message 1',
          spanId: 'span-1',
          traceId: 'trace-1',
        },
        timestamp: '2023-01-01T10:00:00Z',
        message: 'Log message 1',
        spanId: 'span-1',
        traceId: 'trace-1',
      },
      {
        _id: 'log-2',
        _source: {
          message: 'Log message 2',
          spanId: 'span-2',
          traceId: 'trace-1',
        },
        timestamp: '2023-01-01T10:01:00Z',
        message: 'Log message 2',
        spanId: 'span-2',
        traceId: 'trace-1',
      },
      {
        _id: 'log-3',
        _source: {
          message: 'Log message 3',
          spanId: 'span-1',
          traceId: 'trace-1',
        },
        timestamp: '2023-01-01T10:02:00Z',
        message: 'Log message 3',
        spanId: 'span-1',
        traceId: 'trace-1',
      },
    ];

    it('should filter logs by span ID', () => {
      const result = filterLogsBySpanId(mockLogs, 'span-1');

      expect(result).toHaveLength(2);
      expect(result[0].spanId).toBe('span-1');
      expect(result[1].spanId).toBe('span-1');
      expect(result[0]._id).toBe('log-1');
      expect(result[1]._id).toBe('log-3');
    });

    it('should return empty array when no logs match span ID', () => {
      const result = filterLogsBySpanId(mockLogs, 'non-existent-span');

      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty logs input', () => {
      const result = filterLogsBySpanId([], 'span-1');

      expect(result).toHaveLength(0);
    });

    it('should handle logs without span ID', () => {
      const logsWithoutSpanId: LogHit[] = [
        {
          _id: 'log-1',
          _source: {
            message: 'Log message 1',
            traceId: 'trace-1',
          },
          timestamp: '2023-01-01T10:00:00Z',
          message: 'Log message 1',
          traceId: 'trace-1',
        } as any,
      ];

      const result = filterLogsBySpanId(logsWithoutSpanId, 'span-1');

      expect(result).toHaveLength(0);
    });
  });
});
