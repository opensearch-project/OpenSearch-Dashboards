/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { DataViewsContract, DuplicateDataViewError } from '../../../data/public';
import { createAutoDetectedDatasets } from './create_auto_datasets';
import { DetectionResult } from './auto_detect_trace_data';

describe('createAutoDetectedDatasets', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;
  let mockDataViews: jest.Mocked<DataViewsContract>;

  const makeDataView = (id: string) => ({ id, title: '' } as any);

  beforeEach(() => {
    mockSavedObjectsClient = {
      create: jest.fn(),
      find: jest.fn().mockResolvedValue({ total: 0, savedObjects: [] }),
    } as any;

    mockDataViews = {
      createAndSave: jest.fn(),
      get: jest.fn().mockImplementation((id: string) => Promise.resolve(makeDataView(id))),
      refreshFields: jest.fn().mockResolvedValue(undefined),
      updateSavedObject: jest.fn().mockResolvedValue(undefined),
      clearCache: jest.fn(),
      getFieldsForWildcard: jest.fn().mockResolvedValue([
        { name: 'endTime', type: 'date', searchable: true, aggregatable: true },
        { name: 'traceId', type: 'string', searchable: true, aggregatable: true },
        { name: 'spanId', type: 'string', searchable: true, aggregatable: true },
      ]),
      fieldArrayToMap: jest.fn((fields: any[]) =>
        fields.reduce((acc, f) => ({ ...acc, [f.name]: f }), {})
      ),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('pre-fetches fields and embeds them in the spec passed to createAndSave', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    mockDataViews.createAndSave.mockResolvedValue(makeDataView('trace-dataset-id'));

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection,
      'datasource-id'
    );

    expect(result.traceDatasetId).toBe('trace-dataset-id');

    // Pre-fetch: this is the call that was missing before the fix.
    expect(mockDataViews.getFieldsForWildcard).toHaveBeenCalledWith({
      pattern: 'otel-v1-apm-span*',
      dataSourceId: 'datasource-id',
    });

    // The spec sent to createAndSave must include the populated fields map.
    expect(mockDataViews.createAndSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'otel-v1-apm-span*',
        timeFieldName: 'endTime',
        signalType: 'traces',
        fields: expect.objectContaining({
          endTime: expect.objectContaining({ name: 'endTime' }),
          traceId: expect.objectContaining({ name: 'traceId' }),
        }),
      })
    );

    // Belt-and-suspenders post-save refresh.
    expect(mockDataViews.get).toHaveBeenCalledWith('trace-dataset-id');
    expect(mockDataViews.refreshFields).toHaveBeenCalled();
    expect(mockDataViews.updateSavedObject).toHaveBeenCalled();
  });

  it('creates the dataset even when the field pre-fetch returns nothing', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    (mockDataViews.getFieldsForWildcard as jest.Mock).mockResolvedValue([]);
    mockDataViews.createAndSave.mockResolvedValue(makeDataView('trace-dataset-id'));

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result.traceDatasetId).toBe('trace-dataset-id');
    expect(mockDataViews.createAndSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'otel-v1-apm-span*', fields: undefined })
    );
  });

  it('creates a log dataset with schema mappings and refreshes fields after save', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-otel-v1*',
      traceTimeField: null,
      logTimeField: 'time',
    };

    mockDataViews.createAndSave.mockResolvedValue(makeDataView('log-dataset-id'));

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result.logDatasetId).toBe('log-dataset-id');
    expect(mockDataViews.createAndSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'logs-otel-v1*',
        displayName: 'Log Dataset',
        timeFieldName: 'time',
        signalType: 'logs',
        schemaMappings: {
          otelLogs: {
            timestamp: 'time',
            traceId: 'traceId',
            spanId: 'spanId',
            serviceName: 'resource.attributes.service.name',
          },
        },
        dataSourceRef: undefined,
      })
    );
    expect(mockDataViews.refreshFields).toHaveBeenCalled();
    expect(mockDataViews.updateSavedObject).toHaveBeenCalled();
  });

  it('creates both datasets and a correlation when both are detected', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: true,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: 'logs-otel-v1*',
      traceTimeField: 'endTime',
      logTimeField: 'time',
    };

    mockDataViews.createAndSave
      .mockResolvedValueOnce(makeDataView('trace-dataset-id'))
      .mockResolvedValueOnce(makeDataView('log-dataset-id'));

    mockSavedObjectsClient.create.mockResolvedValueOnce({
      id: 'correlation-id',
      type: 'correlations',
      attributes: {},
      references: [],
    } as any);

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result).toEqual({
      traceDatasetId: 'trace-dataset-id',
      logDatasetId: 'log-dataset-id',
      correlationId: 'correlation-id',
    });

    expect(mockDataViews.createAndSave).toHaveBeenCalledTimes(2);
    // Refresh runs once per dataset
    expect(mockDataViews.refreshFields).toHaveBeenCalledTimes(2);
    expect(mockDataViews.updateSavedObject).toHaveBeenCalledTimes(2);

    expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
      'correlations',
      expect.objectContaining({
        title: 'trace-to-logs_otel-v1-apm-span*',
        correlationType: 'trace-to-logs-otel-v1-apm-span*',
      }),
      expect.objectContaining({
        references: [
          { name: 'entities[0].index', type: 'index-pattern', id: 'trace-dataset-id' },
          { name: 'entities[1].index', type: 'index-pattern', id: 'log-dataset-id' },
        ],
      })
    );
  });

  it('passes dataSourceRef to createAndSave when dataSourceId is provided', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    mockDataViews.createAndSave.mockResolvedValue(makeDataView('trace-dataset-id'));

    await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection,
      'test-datasource-id'
    );

    expect(mockDataViews.createAndSave).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSourceRef: { id: 'test-datasource-id', type: 'data-source', name: 'dataSource' },
      })
    );
  });

  it('reuses an existing index pattern instead of creating a duplicate, and still refreshes its fields', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    mockSavedObjectsClient.find.mockResolvedValueOnce({
      total: 1,
      savedObjects: [
        {
          id: 'existing-trace-dataset-id',
          type: 'index-pattern',
          attributes: { title: 'otel-v1-apm-span*' },
          references: [],
        },
      ],
    } as any);

    const existingDataView = makeDataView('existing-trace-dataset-id');
    mockDataViews.get.mockResolvedValue(existingDataView);

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result.traceDatasetId).toBe('existing-trace-dataset-id');
    expect(mockDataViews.createAndSave).not.toHaveBeenCalled();

    // Refresh the existing pattern so previously-broken ones recover their field list.
    expect(mockDataViews.get).toHaveBeenCalledWith('existing-trace-dataset-id');
    expect(mockDataViews.refreshFields).toHaveBeenCalledWith(existingDataView);
    expect(mockDataViews.updateSavedObject).toHaveBeenCalledWith(existingDataView);
    expect(mockDataViews.clearCache).toHaveBeenCalledWith('existing-trace-dataset-id');
  });

  it('still returns the existing id when refreshing fields on an existing pattern fails', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    mockSavedObjectsClient.find.mockResolvedValueOnce({
      total: 1,
      savedObjects: [{ id: 'existing-id' }],
    } as any);

    mockDataViews.get.mockRejectedValueOnce(new Error('boom'));

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result.traceDatasetId).toBe('existing-id');
  });

  it('falls back to find() when createAndSave throws DuplicateDataViewError', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    // First find (lookup before create) returns nothing — proceed to createAndSave.
    // Second find (after Duplicate error) returns the existing pattern.
    mockSavedObjectsClient.find
      .mockResolvedValueOnce({ total: 0, savedObjects: [] } as any)
      .mockResolvedValueOnce({
        total: 1,
        savedObjects: [{ id: 'existing-after-conflict' }],
      } as any);

    mockDataViews.createAndSave.mockRejectedValueOnce(new DuplicateDataViewError('dup'));

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result.traceDatasetId).toBe('existing-after-conflict');
  });

  it('skips dataset creation when required fields are missing', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-otel-v1*',
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result).toEqual({
      traceDatasetId: null,
      logDatasetId: null,
      correlationId: null,
    });
    expect(mockDataViews.createAndSave).not.toHaveBeenCalled();
    expect(mockSavedObjectsClient.create).not.toHaveBeenCalled();
  });

  it('returns an empty result when nothing is detected', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: false,
      tracePattern: null,
      logPattern: null,
      traceTimeField: null,
      logTimeField: null,
    };

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result).toEqual({
      traceDatasetId: null,
      logDatasetId: null,
      correlationId: null,
    });
    expect(mockDataViews.createAndSave).not.toHaveBeenCalled();
    expect(mockSavedObjectsClient.create).not.toHaveBeenCalled();
  });

  it('does not create a correlation if only one dataset was created', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    mockDataViews.createAndSave.mockResolvedValue(makeDataView('trace-dataset-id'));

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result.correlationId).toBeNull();
    expect(mockSavedObjectsClient.create).not.toHaveBeenCalled();
  });

  it('handles dataset creation errors gracefully', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: false,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: null,
      traceTimeField: 'endTime',
      logTimeField: null,
    };

    mockDataViews.createAndSave.mockRejectedValue(new Error('Failed to create trace dataset'));

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result.traceDatasetId).toBeNull();
  });

  it('handles correlation creation errors gracefully', async () => {
    const detection: DetectionResult = {
      tracesDetected: true,
      logsDetected: true,
      tracePattern: 'otel-v1-apm-span*',
      logPattern: 'logs-otel-v1*',
      traceTimeField: 'endTime',
      logTimeField: 'time',
    };

    mockDataViews.createAndSave
      .mockResolvedValueOnce(makeDataView('trace-dataset-id'))
      .mockResolvedValueOnce(makeDataView('log-dataset-id'));

    mockSavedObjectsClient.create.mockRejectedValueOnce(new Error('Failed to create correlation'));

    const result = await createAutoDetectedDatasets(
      mockSavedObjectsClient,
      mockDataViews,
      detection
    );

    expect(result.traceDatasetId).toBe('trace-dataset-id');
    expect(result.logDatasetId).toBe('log-dataset-id');
    expect(result.correlationId).toBeNull();
  });

  it('uses the detected logTimeField in schema mappings', async () => {
    const detection: DetectionResult = {
      tracesDetected: false,
      logsDetected: true,
      tracePattern: null,
      logPattern: 'logs-custom*',
      traceTimeField: null,
      logTimeField: 'timestamp',
    };

    mockDataViews.createAndSave.mockResolvedValue(makeDataView('log-dataset-id'));

    await createAutoDetectedDatasets(mockSavedObjectsClient, mockDataViews, detection);

    expect(mockDataViews.createAndSave).toHaveBeenCalledWith(
      expect.objectContaining({
        timeFieldName: 'timestamp',
        schemaMappings: expect.objectContaining({
          otelLogs: expect.objectContaining({ timestamp: 'timestamp' }),
        }),
      })
    );
  });
});
