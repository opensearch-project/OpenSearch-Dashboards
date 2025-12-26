/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { IndexPatternsContract } from '../../../data/public';
import { detectTraceData } from './auto_detect_trace_data';

describe('detectTraceData', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;
  let mockIndexPatternsService: jest.Mocked<IndexPatternsContract>;

  beforeEach(() => {
    // Create mock saved objects client
    mockSavedObjectsClient = {} as jest.Mocked<SavedObjectsClientContract>;

    // Create mock index patterns service
    mockIndexPatternsService = {
      getIds: jest.fn(),
      get: jest.fn(),
      getFieldsForWildcard: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty result when trace datasets already exist', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue(['existing-trace-id']);
    mockIndexPatternsService.get.mockResolvedValue({
      id: 'existing-trace-id',
      signalType: 'traces',
    } as any);

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    expect(result).toEqual({
      tracesDetected: false,
      logsDetected: false,
      tracePattern: null,
      logPattern: null,
      traceTimeField: null,
      logTimeField: null,
    });
    expect(mockIndexPatternsService.getIds).toHaveBeenCalled();
    expect(mockIndexPatternsService.get).toHaveBeenCalledWith('existing-trace-id');
    // Should not check for wildcard patterns since trace datasets exist
    expect(mockIndexPatternsService.getFieldsForWildcard).not.toHaveBeenCalled();
  });

  it('should detect trace data when otel-v1-apm-span* indices exist with required fields', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'otel-v1-apm-span*') {
        return [
          { name: 'spanId', type: 'string' },
          { name: 'traceId', type: 'string' },
          { name: 'endTime', type: 'date' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    expect(result.tracesDetected).toBe(true);
    expect(result.tracePattern).toBe('otel-v1-apm-span*');
    expect(result.traceTimeField).toBe('endTime');
    expect(result.logsDetected).toBe(false);
    expect(mockIndexPatternsService.getFieldsForWildcard).toHaveBeenCalledWith({
      pattern: 'otel-v1-apm-span*',
      dataSourceId: undefined,
    });
  });

  it('should not detect traces when required fields are missing', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'otel-v1-apm-span*') {
        // Missing traceId field
        return [
          { name: 'spanId', type: 'string' },
          { name: 'endTime', type: 'date' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    expect(result.tracesDetected).toBe(false);
    expect(result.tracePattern).toBeNull();
    expect(result.traceTimeField).toBeNull();
  });

  it('should detect log data when logs-otel-v1* indices exist with required fields', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'logs-otel-v1*') {
        return [
          { name: 'traceId', type: 'string' },
          { name: 'spanId', type: 'string' },
          { name: 'time', type: 'date' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    expect(result.logsDetected).toBe(true);
    expect(result.logPattern).toBe('logs-otel-v1*');
    expect(result.logTimeField).toBe('time');
    expect(result.tracesDetected).toBe(false);
    expect(mockIndexPatternsService.getFieldsForWildcard).toHaveBeenCalledWith({
      pattern: 'logs-otel-v1*',
      dataSourceId: undefined,
    });
  });

  it('should not detect logs when required fields are missing', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'logs-otel-v1*') {
        // Missing spanId field
        return [
          { name: 'traceId', type: 'string' },
          { name: 'time', type: 'date' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    expect(result.logsDetected).toBe(false);
    expect(result.logPattern).toBeNull();
    expect(result.logTimeField).toBeNull();
  });

  it('should detect both traces and logs when both exist', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'otel-v1-apm-span*') {
        return [
          { name: 'spanId', type: 'string' },
          { name: 'traceId', type: 'string' },
          { name: 'endTime', type: 'date' },
        ] as any;
      }
      if (pattern === 'logs-otel-v1*') {
        return [
          { name: 'traceId', type: 'string' },
          { name: 'spanId', type: 'string' },
          { name: 'time', type: 'date' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    expect(result.tracesDetected).toBe(true);
    expect(result.tracePattern).toBe('otel-v1-apm-span*');
    expect(result.traceTimeField).toBe('endTime');
    expect(result.logsDetected).toBe(true);
    expect(result.logPattern).toBe('logs-otel-v1*');
    expect(result.logTimeField).toBe('time');
  });

  it('should return empty result when no matching indices exist', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockIndexPatternsService.getFieldsForWildcard.mockRejectedValue(
      new Error('No matching indices')
    );

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    expect(result).toEqual({
      tracesDetected: false,
      logsDetected: false,
      tracePattern: null,
      logPattern: null,
      traceTimeField: null,
      logTimeField: null,
    });
  });

  it('should pass dataSourceId to getFieldsForWildcard when provided', async () => {
    const dataSourceId = 'test-datasource-id';
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'otel-v1-apm-span*') {
        return [
          { name: 'spanId', type: 'string' },
          { name: 'traceId', type: 'string' },
          { name: 'endTime', type: 'date' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService, dataSourceId);

    expect(mockIndexPatternsService.getFieldsForWildcard).toHaveBeenCalledWith({
      pattern: 'otel-v1-apm-span*',
      dataSourceId,
    });
  });

  it('should handle errors when checking existing index patterns', async () => {
    mockIndexPatternsService.getIds.mockRejectedValue(new Error('Failed to get IDs'));
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'otel-v1-apm-span*') {
        return [
          { name: 'spanId', type: 'string' },
          { name: 'traceId', type: 'string' },
          { name: 'endTime', type: 'date' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    // Should continue with detection even if getIds fails
    expect(result.tracesDetected).toBe(true);
    expect(result.tracePattern).toBe('otel-v1-apm-span*');
  });

  it('should skip index patterns that fail to load', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue(['id-1', 'id-2', 'id-3']);
    mockIndexPatternsService.get.mockImplementation(async (id) => {
      if (id === 'id-1') {
        throw new Error('Failed to load');
      }
      if (id === 'id-2') {
        return { id: 'id-2', signalType: 'logs' } as any;
      }
      if (id === 'id-3') {
        return { id: 'id-3', signalType: 'metrics' } as any;
      }
      return {} as any;
    });
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'otel-v1-apm-span*') {
        return [
          { name: 'spanId', type: 'string' },
          { name: 'traceId', type: 'string' },
          { name: 'endTime', type: 'date' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    // Should continue with detection since no trace signalType was found
    expect(result.tracesDetected).toBe(true);
    expect(mockIndexPatternsService.get).toHaveBeenCalledTimes(3);
  });

  it('should handle traces with extra fields beyond the required ones', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'otel-v1-apm-span*') {
        return [
          { name: 'spanId', type: 'string' },
          { name: 'traceId', type: 'string' },
          { name: 'endTime', type: 'date' },
          { name: 'serviceName', type: 'string' },
          { name: 'duration', type: 'number' },
          { name: 'resource.attributes', type: 'object' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    expect(result.tracesDetected).toBe(true);
    expect(result.tracePattern).toBe('otel-v1-apm-span*');
    expect(result.traceTimeField).toBe('endTime');
  });

  it('should handle logs with extra fields beyond the required ones', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'logs-otel-v1*') {
        return [
          { name: 'traceId', type: 'string' },
          { name: 'spanId', type: 'string' },
          { name: 'time', type: 'date' },
          { name: 'severityText', type: 'string' },
          { name: 'body', type: 'string' },
          { name: 'attributes', type: 'object' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    expect(result.logsDetected).toBe(true);
    expect(result.logPattern).toBe('logs-otel-v1*');
    expect(result.logTimeField).toBe('time');
  });

  it('should return empty result when existing datasets have different signalType', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue(['logs-id', 'metrics-id']);
    mockIndexPatternsService.get.mockImplementation(async (id) => {
      if (id === 'logs-id') {
        return { id: 'logs-id', signalType: 'logs' } as any;
      }
      if (id === 'metrics-id') {
        return { id: 'metrics-id', signalType: 'metrics' } as any;
      }
      return {} as any;
    });
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(async ({ pattern }) => {
      if (pattern === 'otel-v1-apm-span*') {
        return [
          { name: 'spanId', type: 'string' },
          { name: 'traceId', type: 'string' },
          { name: 'endTime', type: 'date' },
        ] as any;
      }
      if (pattern === 'logs-otel-v1*') {
        return [
          { name: 'traceId', type: 'string' },
          { name: 'spanId', type: 'string' },
          { name: 'time', type: 'date' },
        ] as any;
      }
      throw new Error('No matching indices');
    });

    const result = await detectTraceData(mockSavedObjectsClient, mockIndexPatternsService);

    // Should continue with detection since no trace signalType was found
    expect(result.tracesDetected).toBe(true);
    expect(result.logsDetected).toBe(true);
  });
});
