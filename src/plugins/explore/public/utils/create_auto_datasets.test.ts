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
    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith('index-pattern', {
      title: 'otel-v1-apm-span*',
      displayName: 'Trace Dataset',
      timeFieldName: 'endTime',
      signalType: 'traces',
    });
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
    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith('index-pattern', {
      title: 'logs-otel-v1*',
      displayName: 'Log Dataset',
      timeFieldName: 'time',
      signalType: 'logs',
      schemaMappings: JSON.stringify({
        otelLogs: {
          timeField: 'time',
          traceId: 'traceId',
          spanId: 'spanId',
          serviceName: 'resource.attributes.service.name',
        },
      }),
    });
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
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(1, 'index-pattern', {
      title: 'otel-v1-apm-span*',
      displayName: 'Trace Dataset',
      timeFieldName: 'endTime',
      signalType: 'traces',
    });

    // Verify log dataset creation
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(2, 'index-pattern', {
      title: 'logs-otel-v1*',
      displayName: 'Log Dataset',
      timeFieldName: 'time',
      signalType: 'logs',
      schemaMappings: JSON.stringify({
        otelLogs: {
          timeField: 'time',
          traceId: 'traceId',
          spanId: 'spanId',
          serviceName: 'resource.attributes.service.name',
        },
      }),
    });

    // Verify correlation creation
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      3,
      'correlations',
      {
        correlationType: 'APM-Correlation',
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

    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith('index-pattern', {
      title: 'otel-v1-apm-span*',
      displayName: 'Trace Dataset',
      timeFieldName: 'endTime',
      signalType: 'traces',
      dataSourceRef: {
        id: dataSourceId,
        type: 'data-source',
      },
    });
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

    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith('index-pattern', {
      title: 'logs-otel-v1*',
      displayName: 'Log Dataset',
      timeFieldName: 'time',
      signalType: 'logs',
      dataSourceRef: {
        id: dataSourceId,
        type: 'data-source',
      },
      schemaMappings: JSON.stringify({
        otelLogs: {
          timeField: 'time',
          traceId: 'traceId',
          spanId: 'spanId',
          serviceName: 'resource.attributes.service.name',
        },
      }),
    });
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

  it('should propagate errors when trace dataset creation fails', async () => {
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

    await expect(createAutoDetectedDatasets(mockSavedObjectsClient, detection)).rejects.toThrow(
      'Failed to create trace dataset'
    );
  });

  it('should propagate errors when log dataset creation fails', async () => {
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

    await expect(createAutoDetectedDatasets(mockSavedObjectsClient, detection)).rejects.toThrow(
      'Failed to create log dataset'
    );
  });

  it('should propagate errors when correlation creation fails', async () => {
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

    await expect(createAutoDetectedDatasets(mockSavedObjectsClient, detection)).rejects.toThrow(
      'Failed to create correlation'
    );
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

    // Verify both datasets have dataSourceRef
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      1,
      'index-pattern',
      expect.objectContaining({
        dataSourceRef: {
          id: dataSourceId,
          type: 'data-source',
        },
      })
    );

    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      2,
      'index-pattern',
      expect.objectContaining({
        dataSourceRef: {
          id: dataSourceId,
          type: 'data-source',
        },
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
      })
    );

    // Verify log dataset has signalType='logs'
    expect(mockSavedObjectsClient.create).toHaveBeenNthCalledWith(
      2,
      'index-pattern',
      expect.objectContaining({
        signalType: 'logs',
      })
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
        timeField: 'time',
        traceId: 'traceId',
        spanId: 'spanId',
        serviceName: 'resource.attributes.service.name',
      },
    };

    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
      'index-pattern',
      expect.objectContaining({
        schemaMappings: JSON.stringify(expectedSchemaMappings),
      })
    );
  });
});
