/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { IndexPatternsContract } from '../../../data/public';
import { detectTraceData, detectTraceDataAcrossDataSources } from './auto_detect_trace_data';

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
      dataSourceId: undefined,
    });
    expect(mockIndexPatternsService.getIds).toHaveBeenCalled();
    expect(mockIndexPatternsService.get).toHaveBeenCalledWith('existing-trace-id');
    // Should not check for wildcard patterns since trace datasets exist
    expect(mockIndexPatternsService.getFieldsForWildcard).not.toHaveBeenCalled();
  });

  it('should detect trace data when otel-v1-apm-span* indices exist with required fields', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
      dataSourceId: undefined,
    });
  });

  it('should pass dataSourceId to getFieldsForWildcard when provided', async () => {
    const dataSourceId = 'test-datasource-id';
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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
    // @ts-expect-error TS2339 TODO(ts-error): fixme
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

  it('should not skip detection when trace dataset exists in different datasource', async () => {
    // Setup: datasource A has trace datasets, but we're checking datasource B
    mockIndexPatternsService.getIds.mockResolvedValue(['trace-from-datasource-a']);
    mockIndexPatternsService.get.mockImplementation(async (id) => {
      if (id === 'trace-from-datasource-a') {
        return {
          id: 'trace-from-datasource-a',
          signalType: 'traces',
          dataSourceRef: { id: 'datasource-a', type: 'data-source' },
        } as any;
      }
      return {} as any;
    });

    // @ts-expect-error TS2339 TODO(ts-error): fixme
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

    // Call with datasource-b, should NOT early return because trace dataset is from datasource-a
    const result = await detectTraceData(
      mockSavedObjectsClient,
      mockIndexPatternsService,
      'datasource-b'
    );

    // Should detect traces for datasource-b even though datasource-a has trace datasets
    expect(result.tracesDetected).toBe(true);
    expect(result.tracePattern).toBe('otel-v1-apm-span*');
    expect(result.dataSourceId).toBe('datasource-b');
  });
});

describe('detectTraceDataAcrossDataSources', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;
  let mockIndexPatternsService: jest.Mocked<IndexPatternsContract>;

  beforeEach(() => {
    mockSavedObjectsClient = {
      find: jest.fn(),
    } as any;

    mockIndexPatternsService = {
      getIds: jest.fn(),
      get: jest.fn(),
      getFieldsForWildcard: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should check datasources even when trace datasets exist for other datasources', async () => {
    // Setup: existing trace dataset for datasource A
    mockIndexPatternsService.getIds.mockResolvedValue(['existing-trace-id']);
    mockIndexPatternsService.get.mockImplementation(async (id) => {
      if (id === 'existing-trace-id') {
        return {
          id: 'existing-trace-id',
          signalType: 'traces',
          dataSourceRef: { id: 'datasource-a', type: 'data-source' },
        } as any;
      }
      return {} as any;
    });

    // Setup datasource B that should still be checked
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'datasource-b',
          attributes: { title: 'DataSource B' },
        },
      ],
    } as any);

    // @ts-expect-error TS2339 TODO(ts-error): fixme
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

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    // Should still check datasource B even though datasource A has traces
    expect(mockSavedObjectsClient.find).toHaveBeenCalled();
    expect(results.length).toBe(1);
    expect(results[0].dataSourceId).toBe('datasource-b');
    expect(results[0].tracesDetected).toBe(true);
  });

  it('should detect traces from multiple data sources', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'ds1',
          attributes: { title: 'DataSource 1' },
        },
        {
          id: 'ds2',
          attributes: { title: 'DataSource 2' },
        },
      ],
    } as any);

    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      async ({ pattern, dataSourceId }) => {
        if (pattern === 'otel-v1-apm-span*') {
          return [
            { name: 'spanId', type: 'string' },
            { name: 'traceId', type: 'string' },
            { name: 'endTime', type: 'date' },
          ] as any;
        }
        throw new Error('No matching indices');
      }
    );

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      tracesDetected: true,
      tracePattern: 'otel-v1-apm-span*',
      traceTimeField: 'endTime',
      dataSourceId: 'ds1',
      dataSourceTitle: 'DataSource 1',
    });
    expect(results[1]).toMatchObject({
      tracesDetected: true,
      tracePattern: 'otel-v1-apm-span*',
      traceTimeField: 'endTime',
      dataSourceId: 'ds2',
      dataSourceTitle: 'DataSource 2',
    });
  });

  it('should only include data sources with detected traces or logs', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'ds1',
          attributes: { title: 'DataSource 1' },
        },
        {
          id: 'ds2',
          attributes: { title: 'DataSource 2' },
        },
      ],
    } as any);

    // Only ds1 has traces
    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      async ({ pattern, dataSourceId }) => {
        if (dataSourceId === 'ds1' && pattern === 'otel-v1-apm-span*') {
          return [
            { name: 'spanId', type: 'string' },
            { name: 'traceId', type: 'string' },
            { name: 'endTime', type: 'date' },
          ] as any;
        }
        throw new Error('No matching indices');
      }
    );

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    expect(results).toHaveLength(1);
    expect(results[0].dataSourceId).toBe('ds1');
    expect(results[0].dataSourceTitle).toBe('DataSource 1');
  });

  it('should check local cluster when no data sources have traces', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'ds1',
          attributes: { title: 'DataSource 1' },
        },
      ],
    } as any);

    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      async ({ pattern, dataSourceId }) => {
        // No traces in data sources, but traces in local cluster
        if (dataSourceId === undefined && pattern === 'otel-v1-apm-span*') {
          return [
            { name: 'spanId', type: 'string' },
            { name: 'traceId', type: 'string' },
            { name: 'endTime', type: 'date' },
          ] as any;
        }
        throw new Error('No matching indices');
      }
    );

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      tracesDetected: true,
      dataSourceTitle: 'Local Cluster',
      dataSourceId: undefined,
    });
  });

  it('should not check local cluster when data sources have traces', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'ds1',
          attributes: { title: 'DataSource 1' },
        },
      ],
    } as any);

    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      async ({ pattern, dataSourceId }) => {
        // Both data source and local cluster have traces
        if (pattern === 'otel-v1-apm-span*') {
          return [
            { name: 'spanId', type: 'string' },
            { name: 'traceId', type: 'string' },
            { name: 'endTime', type: 'date' },
          ] as any;
        }
        throw new Error('No matching indices');
      }
    );

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    // Should only have the data source, not local cluster
    expect(results).toHaveLength(1);
    expect(results[0].dataSourceId).toBe('ds1');
    expect(results[0].dataSourceTitle).toBe('DataSource 1');
  });

  it('should handle errors when checking individual data sources', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'ds1',
          attributes: { title: 'DataSource 1' },
        },
        {
          id: 'ds2',
          attributes: { title: 'DataSource 2' },
        },
      ],
    } as any);

    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      async ({ pattern, dataSourceId }) => {
        if (dataSourceId === 'ds1') {
          throw new Error('Connection failed');
        }
        if (dataSourceId === 'ds2' && pattern === 'otel-v1-apm-span*') {
          return [
            { name: 'spanId', type: 'string' },
            { name: 'traceId', type: 'string' },
            { name: 'endTime', type: 'date' },
          ] as any;
        }
        throw new Error('No matching indices');
      }
    );

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    // Should continue and return ds2 even though ds1 failed
    expect(results).toHaveLength(1);
    expect(results[0].dataSourceId).toBe('ds2');
  });

  it('should handle errors when fetching data sources and check local cluster', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockSavedObjectsClient.find.mockRejectedValue(new Error('Failed to fetch data sources'));

    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      async ({ pattern, dataSourceId }) => {
        if (dataSourceId === undefined && pattern === 'otel-v1-apm-span*') {
          return [
            { name: 'spanId', type: 'string' },
            { name: 'traceId', type: 'string' },
            { name: 'endTime', type: 'date' },
          ] as any;
        }
        throw new Error('No matching indices');
      }
    );

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    // Should fall back to local cluster
    expect(results).toHaveLength(1);
    expect(results[0].dataSourceTitle).toBe('Local Cluster');
  });

  it('should detect both traces and logs for a data source', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'ds1',
          attributes: { title: 'DataSource 1' },
        },
      ],
    } as any);

    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      async ({ pattern, dataSourceId }) => {
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
      }
    );

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      tracesDetected: true,
      logsDetected: true,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: 'logs-otel-v1*',
      dataSourceId: 'ds1',
      dataSourceTitle: 'DataSource 1',
    });
  });

  it('should return empty array when no traces or logs are detected anywhere', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'ds1',
          attributes: { title: 'DataSource 1' },
        },
      ],
    } as any);

    mockIndexPatternsService.getFieldsForWildcard.mockRejectedValue(
      new Error('No matching indices')
    );

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    expect(results).toEqual([]);
  });

  it('should handle error when checking local cluster', async () => {
    mockIndexPatternsService.getIds.mockResolvedValue([]);
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [],
    } as any);

    mockIndexPatternsService.getFieldsForWildcard.mockRejectedValue(new Error('Connection failed'));

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    // Should handle error gracefully and return empty array
    expect(results).toEqual([]);
  });

  it('should continue checking other data sources if getIds fails', async () => {
    mockIndexPatternsService.getIds.mockRejectedValue(new Error('Failed to get IDs'));
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'ds1',
          attributes: { title: 'DataSource 1' },
        },
      ],
    } as any);

    mockIndexPatternsService.getFieldsForWildcard.mockImplementation(
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      async ({ pattern, dataSourceId }) => {
        if (pattern === 'otel-v1-apm-span*') {
          return [
            { name: 'spanId', type: 'string' },
            { name: 'traceId', type: 'string' },
            { name: 'endTime', type: 'date' },
          ] as any;
        }
        throw new Error('No matching indices');
      }
    );

    const results = await detectTraceDataAcrossDataSources(
      mockSavedObjectsClient,
      mockIndexPatternsService
    );

    // Should continue with detection even if getIds fails
    expect(results).toHaveLength(1);
    expect(results[0].dataSourceId).toBe('ds1');
  });
});
