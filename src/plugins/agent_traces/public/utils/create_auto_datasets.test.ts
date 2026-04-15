/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { createAutoDetectedDatasets } from './create_auto_datasets';
import { DetectionResult } from './auto_detect_trace_data';

describe('createAutoDetectedDatasets', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;

  beforeEach(() => {
    // Create mock saved objects client
    mockSavedObjectsClient = {
      create: jest.fn(),
      find: jest.fn().mockResolvedValue({ total: 0, savedObjects: [] }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create trace dataset when traces are detected', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    mockSavedObjectsClient.create.mockResolvedValue({
      id: 'trace-dataset-id',
      type: 'index-pattern',
      attributes: {},
      references: [],
    } as any);

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.traceDatasetId).toBe('trace-dataset-id');
    expect(result.logDatasetId).toBeNull();
    expect(result.correlationId).toBeNull();

    expect(mockSavedObjectsClient.create).toHaveBeenCalledTimes(1);
    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
      'index-pattern',
      {
        title: 'otel-v1-apm-span*',
        displayName: 'Trace Dataset',
        timeFieldName: 'endTime',
        signalType: 'traces',
      },
      {
        references: [],
      }
    );
  });

  it('should create log dataset when logs are detected', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-otel-v1*',
      traceTimeField: null,
      logTimeField: 'time',
    };

    mockSavedObjectsClient.create.mockResolvedValue({
      id: 'log-dataset-id',
      type: 'index-pattern',
      attributes: {},
      references: [],
    } as any);

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.traceDatasetId).toBeNull();
    expect(result.logDatasetId).toBe('log-dataset-id');
    expect(result.correlationId).toBeNull();

    expect(mockSavedObjectsClient.create).toHaveBeenCalledTimes(1);
    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
      'index-pattern',
      {
        title: 'logs-otel-v1*',
        displayName: 'Log Dataset',
        timeFieldName: 'time',
        signalType: 'logs',
        schemaMappings: JSON.stringify({
          otelLogs: {
            timestamp: 'time',
            traceId: 'traceId',
            spanId: 'spanId',
            serviceName: 'resource.attributes.service.name',
          },
        }),
      },
      {
        references: [],
      }
    );
  });

  it('should create both datasets and correlation when both are detected', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: true,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: 'logs-otel-v1*',
      traceTimeField: 'endTime',
      logTimeField: 'time',
    };

    mockSavedObjectsClient.create
      .mockResolvedValueOnce({
        id: 'trace-dataset-id',
        type: 'index-pattern',
        attributes: {},
        references: [],
      } as any)
      .mockResolvedValueOnce({
        id: 'log-dataset-id',
        type: 'index-pattern',
        attributes: {},
        references: [],
      } as any)
      .mockResolvedValueOnce({
        id: 'correlation-id',
        type: 'correlations',
        attributes: {},
        references: [],
      } as any);

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.traceDatasetId).toBe('trace-dataset-id');
    expect(result.logDatasetId).toBe('log-dataset-id');
    expect(result.correlationId).toBe('correlation-id');

    expect(mockSavedObjectsClient.create).toHaveBeenCalledTimes(3);

    // Verify trace dataset creation
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      1,
      'index-pattern',
      {
        title: 'otel-v1-apm-span*',
        displayName: 'Trace Dataset',
        timeFieldName: 'endTime',
        signalType: 'traces',
      },
      {
        references: [],
      }
    );

    // Verify log dataset creation
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      2,
      'index-pattern',
      {
        title: 'logs-otel-v1*',
        displayName: 'Log Dataset',
        timeFieldName: 'time',
        signalType: 'logs',
        schemaMappings: JSON.stringify({
          otelLogs: {
            timestamp: 'time',
            traceId: 'traceId',
            spanId: 'spanId',
            serviceName: 'resource.attributes.service.name',
          },
        }),
      },
      {
        references: [],
      }
    );

    // Verify correlation creation
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      3,
      'correlations',
      {
        title: 'trace-to-logs_otel-v1-apm-span*',
        correlationType: 'trace-to-logs-otel-v1-apm-span*',
        version: '1.0.0',
        entities: [
          { tracesDataset: { id: 'references[0].id' } },
          { logsDataset: { id: 'references[1].id' } },
        ],
      },
      {
        references: [
          {
            name: 'entities[0].index',
            type: 'index-pattern',
            id: 'trace-dataset-id',
          },
          {
            name: 'entities[1].index',
            type: 'index-pattern',
            id: 'log-dataset-id',
          },
        ],
      }
    );
  });

  it('should include dataSourceRef when dataSourceId is provided for trace dataset', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    const dataSourceId = 'test-datasource-id';

    mockSavedObjectsClient.create.mockResolvedValue({
      id: 'trace-dataset-id',
      type: 'index-pattern',
      attributes: {},
      references: [],
    } as any);

    await createAutoDetectedDatasets(mockSavedObjectsClient, detection, dataSourceId);

    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
      'index-pattern',
      {
        title: 'otel-v1-apm-span*',
        displayName: 'Trace Dataset',
        timeFieldName: 'endTime',
        signalType: 'traces',
      },
      {
        references: [
          {
            id: dataSourceId,
            type: 'data-source',
            name: 'dataSource',
          },
        ],
      }
    );
  });

  it('should include dataSourceRef when dataSourceId is provided for log dataset', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-otel-v1*',
      traceTimeField: null,
      logTimeField: 'time',
    };

    const dataSourceId = 'test-datasource-id';

    mockSavedObjectsClient.create.mockResolvedValue({
      id: 'log-dataset-id',
      type: 'index-pattern',
      attributes: {},
      references: [],
    } as any);

    await createAutoDetectedDatasets(mockSavedObjectsClient, detection, dataSourceId);

    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
      'index-pattern',
      {
        title: 'logs-otel-v1*',
        displayName: 'Log Dataset',
        timeFieldName: 'time',
        signalType: 'logs',
        schemaMappings: JSON.stringify({
          otelLogs: {
            timestamp: 'time',
            traceId: 'traceId',
            spanId: 'spanId',
            serviceName: 'resource.attributes.service.name',
          },
        }),
      },
      {
        references: [
          {
            id: dataSourceId,
            type: 'data-source',
            name: 'dataSource',
          },
        ],
      }
    );
  });

  it('should not create trace dataset when tracePattern is missing', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: null, // Missing pattern
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.traceDatasetId).toBeNull();
    expect(result.logDatasetId).toBeNull();
    expect(result.correlationId).toBeNull();
    expect(mockSavedObjectsClient.create).not.toHaveBeenCalled();
  });

  it('should not create trace dataset when traceTimeField is missing', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: null, // Missing time field
      logTimeField: null,
    };

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.traceDatasetId).toBeNull();
    expect(result.logDatasetId).toBeNull();
    expect(result.correlationId).toBeNull();
    expect(mockSavedObjectsClient.create).not.toHaveBeenCalled();
  });

  it('should not create log dataset when logPattern is missing', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: null, // Missing pattern
      traceTimeField: null,
      logTimeField: 'time',
    };

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.traceDatasetId).toBeNull();
    expect(result.logDatasetId).toBeNull();
    expect(result.correlationId).toBeNull();
    expect(mockSavedObjectsClient.create).not.toHaveBeenCalled();
  });

  it('should not create log dataset when logTimeField is missing', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-otel-v1*',
      traceTimeField: null,
      logTimeField: null, // Missing time field
    };

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.traceDatasetId).toBeNull();
    expect(result.logDatasetId).toBeNull();
    expect(result.correlationId).toBeNull();
    expect(mockSavedObjectsClient.create).not.toHaveBeenCalled();
  });

  it('should not create correlation if only trace dataset was created', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    mockSavedObjectsClient.create.mockResolvedValue({
      id: 'trace-dataset-id',
      type: 'index-pattern',
      attributes: {},
      references: [],
    } as any);

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.correlationId).toBeNull();
    expect(mockSavedObjectsClient.create).toHaveBeenCalledTimes(1);
  });

  it('should not create correlation if only log dataset was created', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-otel-v1*',
      traceTimeField: null,
      logTimeField: 'time',
    };

    mockSavedObjectsClient.create.mockResolvedValue({
      id: 'log-dataset-id',
      type: 'index-pattern',
      attributes: {},
      references: [],
    } as any);

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.correlationId).toBeNull();
    expect(mockSavedObjectsClient.create).toHaveBeenCalledTimes(1);
  });

  it('should return empty result when nothing is detected', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: false,
      tracePattern: null,
      logPattern: null,
      traceTimeField: null,
      logTimeField: null,
    };

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    expect(result.traceDatasetId).toBeNull();
    expect(result.logDatasetId).toBeNull();
    expect(result.correlationId).toBeNull();
    expect(mockSavedObjectsClient.create).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully when trace dataset creation fails', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    const error = new Error('Failed to create trace dataset');
    mockSavedObjectsClient.create.mockRejectedValue(error);

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    // Should return null instead of throwing
    expect(result.traceDatasetId).toBeNull();
    expect(result.logDatasetId).toBeNull();
    expect(result.correlationId).toBeNull();
  });

  it('should handle errors gracefully when log dataset creation fails', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-otel-v1*',
      traceTimeField: null,
      logTimeField: 'time',
    };

    const error = new Error('Failed to create log dataset');
    mockSavedObjectsClient.create.mockRejectedValue(error);

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    // Should return null instead of throwing
    expect(result.traceDatasetId).toBeNull();
    expect(result.logDatasetId).toBeNull();
    expect(result.correlationId).toBeNull();
  });

  it('should handle errors gracefully when correlation creation fails', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: true,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: 'logs-otel-v1*',
      traceTimeField: 'endTime',
      logTimeField: 'time',
    };

    mockSavedObjectsClient.create
      .mockResolvedValueOnce({
        id: 'trace-dataset-id',
        type: 'index-pattern',
        attributes: {},
        references: [],
      } as any)
      .mockResolvedValueOnce({
        id: 'log-dataset-id',
        type: 'index-pattern',
        attributes: {},
        references: [],
      } as any)
      .mockRejectedValueOnce(new Error('Failed to create correlation'));

    const result = await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    // Should return successfully with dataset IDs even if correlation fails
    expect(result.traceDatasetId).toBe('trace-dataset-id');
    expect(result.logDatasetId).toBe('log-dataset-id');
    expect(result.correlationId).toBeNull();
  });

  it('should include dataSourceRef for both datasets when dataSourceId is provided', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: true,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: 'logs-otel-v1*',
      traceTimeField: 'endTime',
      logTimeField: 'time',
    };

    const dataSourceId = 'test-datasource-id';

    mockSavedObjectsClient.create
      .mockResolvedValueOnce({
        id: 'trace-dataset-id',
        type: 'index-pattern',
        attributes: {},
        references: [],
      } as any)
      .mockResolvedValueOnce({
        id: 'log-dataset-id',
        type: 'index-pattern',
        attributes: {},
        references: [],
      } as any)
      .mockResolvedValueOnce({
        id: 'correlation-id',
        type: 'correlations',
        attributes: {},
        references: [],
      } as any);

    await createAutoDetectedDatasets(mockSavedObjectsClient, detection, dataSourceId);

    // Verify both datasets have dataSourceRef in references
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      1,
      'index-pattern',
      expect.anything(),
      expect.objectContaining({
        references: [
          {
            id: dataSourceId,
            type: 'data-source',
            name: 'dataSource',
          },
        ],
      })
    );

    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      2,
      'index-pattern',
      expect.anything(),
      expect.objectContaining({
        references: [
          {
            id: dataSourceId,
            type: 'data-source',
            name: 'dataSource',
          },
        ],
      })
    );
  });

  it('should create datasets with correct signal types', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: true,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: 'logs-otel-v1*',
      traceTimeField: 'endTime',
      logTimeField: 'time',
    };

    mockSavedObjectsClient.create
      .mockResolvedValueOnce({
        id: 'trace-dataset-id',
        type: 'index-pattern',
        attributes: {},
        references: [],
      } as any)
      .mockResolvedValueOnce({
        id: 'log-dataset-id',
        type: 'index-pattern',
        attributes: {},
        references: [],
      } as any)
      .mockResolvedValueOnce({
        id: 'correlation-id',
        type: 'correlations',
        attributes: {},
        references: [],
      } as any);

    await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    // Verify trace dataset has signalType='traces'
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      1,
      'index-pattern',
      expect.objectContaining({
        signalType: 'traces',
      }),
      expect.anything()
    );

    // Verify log dataset has signalType='logs'
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      2,
      'index-pattern',
      expect.objectContaining({
        signalType: 'logs',
      }),
      expect.anything()
    );
  });

  it('should create log dataset with correct schema mappings', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-otel-v1*',
      traceTimeField: null,
      logTimeField: 'time',
    };

    mockSavedObjectsClient.create.mockResolvedValue({
      id: 'log-dataset-id',
      type: 'index-pattern',
      attributes: {},
      references: [],
    } as any);

    await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    const expectedSchemaMappings = {
      otelLogs: {
        timestamp: 'time',
        traceId: 'traceId',
        spanId: 'spanId',
        serviceName: 'resource.attributes.service.name',
      },
    };

    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
      'index-pattern',
      expect.objectContaining({
        schemaMappings: JSON.stringify(expectedSchemaMappings),
      }),
      expect.anything()
    );
  });

  it('should use detected logTimeField in schema mappings when different from default', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-custom*',
      traceTimeField: null,
      logTimeField: 'timestamp',
    };

    mockSavedObjectsClient.create.mockResolvedValue({
      id: 'log-dataset-id',
      type: 'index-pattern',
      attributes: {},
      references: [],
    } as any);

    await createAutoDetectedDatasets(mockSavedObjectsClient, detection);

    const expectedSchemaMappings = {
      otelLogs: {
        timestamp: 'timestamp',
        traceId: 'traceId',
        spanId: 'spanId',
        serviceName: 'resource.attributes.service.name',
      },
    };

    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
      'index-pattern',
      expect.objectContaining({
        timeFieldName: 'timestamp',
        schemaMappings: JSON.stringify(expectedSchemaMappings),
      }),
      expect.anything()
    );
  });
});
