/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract, SavedObjectReference } from '../../../../core/public';
import { CorrelationsClient } from './correlations_client';
import {
  CorrelationSavedObject,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  CorrelationAttributes,
  CORRELATION_TYPE_PREFIXES,
  CORRELATION_VERSION,
} from '../types/correlations';

describe('CorrelationsClient', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;
  let client: CorrelationsClient;

  beforeEach(() => {
    // Create mock SavedObjects client
    mockSavedObjectsClient = {
      find: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bulkGet: jest.fn(),
      bulkCreate: jest.fn(),
      bulkUpdate: jest.fn(),
    } as any;

    client = new CorrelationsClient(mockSavedObjectsClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('find', () => {
    it('should find all correlations without filter', async () => {
      const mockResponse = {
        savedObjects: [
          {
            id: 'correlation-1',
            type: 'correlations',
            attributes: {
              correlationType: 'Trace-to-logs',
              version: '1.0.0',
              entities: [],
            },
            references: [],
          },
        ],
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue(mockResponse);

      const result = await client.find();

      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
        type: 'correlations',
        page: 1,
        perPage: 100,
      });
      expect(result).toEqual(mockResponse.savedObjects);
    });

    it('should find correlations filtered by dataset ID', async () => {
      const mockResponse = {
        savedObjects: [
          {
            id: 'correlation-1',
            type: 'correlations',
            attributes: {
              correlationType: 'Trace-to-logs',
              version: '1.0.0',
              entities: [],
            },
            references: [],
          },
        ],
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue(mockResponse);

      const result = await client.find({ datasetId: 'trace-dataset-123' });

      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
        type: 'correlations',
        page: 1,
        perPage: 100,
        hasReference: {
          type: 'index-pattern',
          id: 'trace-dataset-123',
        },
      });
      expect(result).toEqual(mockResponse.savedObjects);
    });

    it('should support pagination options', async () => {
      const mockResponse = { savedObjects: [] };
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue(mockResponse);

      await client.find({ page: 2, perPage: 50 });

      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
        type: 'correlations',
        page: 2,
        perPage: 50,
      });
    });

    it('should handle empty results', async () => {
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [] });

      const result = await client.find();

      expect(result).toEqual([]);
    });
  });

  describe('get', () => {
    it('should get a single correlation by ID', async () => {
      const mockCorrelation: CorrelationSavedObject = {
        id: 'correlation-1',
        type: 'correlations',
        attributes: {
          correlationType: 'Trace-to-logs',
          version: '1.0.0',
          entities: [
            { tracesDataset: { id: 'references[0].id' } },
            { logsDataset: { id: 'references[1].id' } },
          ],
        },
        references: [
          { name: 'entities[0].index', type: 'index-pattern', id: 'trace-123' },
          { name: 'entities[1].index', type: 'index-pattern', id: 'logs-456' },
        ],
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.get.mockResolvedValue(mockCorrelation);

      const result = await client.get('correlation-1');

      expect(mockSavedObjectsClient.get).toHaveBeenCalledWith('correlations', 'correlation-1');
      expect(result).toEqual(mockCorrelation);
    });

    it('should throw error when correlation not found', async () => {
      mockSavedObjectsClient.get.mockRejectedValue(new Error('Not found'));

      await expect(client.get('nonexistent')).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('should create a new correlation with correct structure', async () => {
      const createData = {
        traceDatasetId: 'trace-123',
        traceDatasetTitle: 'my-trace-dataset',
        logDatasetIds: ['logs-456', 'logs-789'],
      };

      const expectedCorrelationType = `${CORRELATION_TYPE_PREFIXES.TRACE_TO_LOGS}my-trace-dataset`;

      const mockResponse: CorrelationSavedObject = {
        id: 'new-correlation',
        type: 'correlations',
        attributes: {
          correlationType: expectedCorrelationType,
          version: CORRELATION_VERSION,
          entities: [
            { tracesDataset: { id: 'references[0].id' } },
            { logsDataset: { id: 'references[1].id' } },
            { logsDataset: { id: 'references[2].id' } },
          ],
        },
        references: [
          { name: 'entities[0].index', type: 'index-pattern', id: 'trace-123' },
          { name: 'entities[1].index', type: 'index-pattern', id: 'logs-456' },
          { name: 'entities[2].index', type: 'index-pattern', id: 'logs-789' },
        ],
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.create.mockResolvedValue(mockResponse);

      const result = await client.create(createData);

      expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
        'correlations',
        {
          title: 'trace-to-logs_my-trace-dataset',
          correlationType: expectedCorrelationType,
          version: CORRELATION_VERSION,
          entities: [
            { tracesDataset: { id: 'references[0].id' } },
            { logsDataset: { id: 'references[1].id' } },
            { logsDataset: { id: 'references[2].id' } },
          ],
        },
        {
          references: [
            { name: 'entities[0].index', type: 'index-pattern', id: 'trace-123' },
            { name: 'entities[1].index', type: 'index-pattern', id: 'logs-456' },
            { name: 'entities[2].index', type: 'index-pattern', id: 'logs-789' },
          ],
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create correlation with single log dataset', async () => {
      const createData = {
        traceDatasetId: 'trace-123',
        traceDatasetTitle: 'my-trace-dataset',
        logDatasetIds: ['logs-456'],
      };

      const expectedCorrelationType = `${CORRELATION_TYPE_PREFIXES.TRACE_TO_LOGS}my-trace-dataset`;

      const mockResponse: CorrelationSavedObject = {
        id: 'new-correlation',
        type: 'correlations',
        attributes: {
          correlationType: expectedCorrelationType,
          version: CORRELATION_VERSION,
          entities: [
            { tracesDataset: { id: 'references[0].id' } },
            { logsDataset: { id: 'references[1].id' } },
          ],
        },
        references: [
          { name: 'entities[0].index', type: 'index-pattern', id: 'trace-123' },
          { name: 'entities[1].index', type: 'index-pattern', id: 'logs-456' },
        ],
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.create.mockResolvedValue(mockResponse);

      const result = await client.create(createData);

      expect(result.references.length).toBe(2);
      expect(result.attributes.entities.length).toBe(2);
    });

    it('should allow custom correlationType and version', async () => {
      const createData = {
        traceDatasetId: 'trace-123',
        traceDatasetTitle: 'my-trace-dataset',
        logDatasetIds: ['logs-456'],
        correlationType: 'Custom-Type',
        version: '2.0.0',
      };

      const mockResponse: CorrelationSavedObject = {
        id: 'new-correlation',
        type: 'correlations',
        attributes: {
          correlationType: 'Custom-Type',
          version: '2.0.0',
          entities: [
            { tracesDataset: { id: 'references[0].id' } },
            { logsDataset: { id: 'references[1].id' } },
          ],
        },
        references: [
          { name: 'entities[0].index', type: 'index-pattern', id: 'trace-123' },
          { name: 'entities[1].index', type: 'index-pattern', id: 'logs-456' },
        ],
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.create.mockResolvedValue(mockResponse);

      await client.create(createData);

      expect(mockSavedObjectsClient.create).toHaveBeenCalledWith(
        'correlations',
        expect.objectContaining({
          correlationType: 'Custom-Type',
          version: '2.0.0',
        }),
        expect.any(Object)
      );
    });
  });

  describe('update', () => {
    it('should update correlation with new log datasets', async () => {
      const existingCorrelation: CorrelationSavedObject = {
        id: 'correlation-1',
        type: 'correlations',
        attributes: {
          correlationType: 'Trace-to-logs',
          version: '1.0.0',
          entities: [
            { tracesDataset: { id: 'references[0].id' } },
            { logsDataset: { id: 'references[1].id' } },
          ],
        },
        references: [
          { name: 'entities[0].index', type: 'index-pattern', id: 'trace-123' },
          { name: 'entities[1].index', type: 'index-pattern', id: 'logs-456' },
        ],
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.get.mockResolvedValue(existingCorrelation);

      const updatedCorrelation: CorrelationSavedObject = {
        ...existingCorrelation,
        attributes: {
          ...existingCorrelation.attributes,
          entities: [
            { tracesDataset: { id: 'references[0].id' } },
            { logsDataset: { id: 'references[1].id' } },
            { logsDataset: { id: 'references[2].id' } },
          ],
        },
        references: [
          { name: 'entities[0].index', type: 'index-pattern', id: 'trace-123' },
          { name: 'entities[1].index', type: 'index-pattern', id: 'logs-789' },
          { name: 'entities[2].index', type: 'index-pattern', id: 'logs-012' },
        ],
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.update.mockResolvedValue(updatedCorrelation);

      const result = await client.update({
        id: 'correlation-1',
        logDatasetIds: ['logs-789', 'logs-012'],
      });

      expect(mockSavedObjectsClient.get).toHaveBeenCalledWith('correlations', 'correlation-1');
      expect(mockSavedObjectsClient.update).toHaveBeenCalledWith(
        'correlations',
        'correlation-1',
        expect.objectContaining({
          correlationType: 'Trace-to-logs',
          version: '1.0.0',
        }),
        expect.objectContaining({
          references: expect.arrayContaining([
            expect.objectContaining({ id: 'trace-123' }),
            expect.objectContaining({ id: 'logs-789' }),
            expect.objectContaining({ id: 'logs-012' }),
          ]),
        })
      );
      expect(result.references).toBeDefined();
    });

    it('should preserve trace dataset when updating', async () => {
      const existingCorrelation: CorrelationSavedObject = {
        id: 'correlation-1',
        type: 'correlations',
        attributes: {
          correlationType: 'Trace-to-logs',
          version: '1.0.0',
          entities: [
            { tracesDataset: { id: 'references[0].id' } },
            { logsDataset: { id: 'references[1].id' } },
          ],
        },
        references: [
          { name: 'entities[0].index', type: 'index-pattern', id: 'trace-original' },
          { name: 'entities[1].index', type: 'index-pattern', id: 'logs-456' },
        ],
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.get.mockResolvedValue(existingCorrelation);
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.update.mockResolvedValue({
        ...existingCorrelation,
        references: [],
      });

      await client.update({
        id: 'correlation-1',
        logDatasetIds: ['logs-new'],
      });

      const updateCall = mockSavedObjectsClient.update.mock.calls[0];
      const references = updateCall[3]?.references as SavedObjectReference[];

      expect(references[0].id).toBe('trace-original');
      expect(references[1].id).toBe('logs-new');
    });
  });

  describe('delete', () => {
    it('should delete a correlation by ID', async () => {
      mockSavedObjectsClient.delete.mockResolvedValue({});

      await client.delete('correlation-1');

      expect(mockSavedObjectsClient.delete).toHaveBeenCalledWith('correlations', 'correlation-1');
    });

    it('should handle delete errors', async () => {
      mockSavedObjectsClient.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(client.delete('correlation-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getCorrelationsForDataset', () => {
    it('should call find with datasetId', async () => {
      const mockResponse = { savedObjects: [] };
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue(mockResponse);

      await client.getCorrelationsForDataset('dataset-123');

      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith(
        expect.objectContaining({
          hasReference: {
            type: 'index-pattern',
            id: 'dataset-123',
          },
        })
      );
    });
  });

  describe('countForDataset', () => {
    it('should return count of correlations for dataset', async () => {
      const mockResponse = {
        savedObjects: [
          { id: 'correlation-1' },
          { id: 'correlation-2' },
          { id: 'correlation-3' },
        ] as any,
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue(mockResponse);

      const count = await client.countForDataset('dataset-123');

      expect(count).toBe(3);
      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith(
        expect.objectContaining({ perPage: 1 })
      );
    });

    it('should return 0 when no correlations found', async () => {
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [] });

      const count = await client.countForDataset('dataset-123');

      expect(count).toBe(0);
    });
  });

  describe('isTraceDatasetCorrelated', () => {
    it('should return true when trace dataset has correlations', async () => {
      const mockResponse = {
        savedObjects: [{ id: 'correlation-1' }] as any,
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue(mockResponse);

      const result = await client.isTraceDatasetCorrelated('trace-123');

      expect(result).toBe(true);
    });

    it('should return false when trace dataset has no correlations', async () => {
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [] });

      const result = await client.isTraceDatasetCorrelated('trace-123');

      expect(result).toBe(false);
    });
  });

  describe('getCorrelationByTraceDataset', () => {
    it('should find correlation where dataset is the trace dataset', async () => {
      const mockCorrelations: CorrelationSavedObject[] = [
        {
          id: 'correlation-1',
          type: 'correlations',
          attributes: {
            correlationType: 'Trace-to-logs',
            version: '1.0.0',
            entities: [
              { tracesDataset: { id: 'references[0].id' } },
              { logsDataset: { id: 'references[1].id' } },
            ],
          },
          references: [
            { name: 'entities[0].index', type: 'index-pattern', id: 'trace-123' },
            { name: 'entities[1].index', type: 'index-pattern', id: 'logs-456' },
          ],
        },
        {
          id: 'correlation-2',
          type: 'correlations',
          attributes: {
            correlationType: 'Trace-to-logs',
            version: '1.0.0',
            entities: [
              { tracesDataset: { id: 'references[0].id' } },
              { logsDataset: { id: 'references[1].id' } },
            ],
          },
          references: [
            { name: 'entities[0].index', type: 'index-pattern', id: 'trace-999' },
            { name: 'entities[1].index', type: 'index-pattern', id: 'logs-456' },
          ],
        },
      ];

      // @ts-expect-error TS2322 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: mockCorrelations });

      const result = await client.getCorrelationByTraceDataset('trace-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('correlation-1');
    });

    it('should return null when no correlation found', async () => {
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [] });

      const result = await client.getCorrelationByTraceDataset('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when dataset is found but not as trace dataset', async () => {
      const mockCorrelations: CorrelationSavedObject[] = [
        {
          id: 'correlation-1',
          type: 'correlations',
          attributes: {
            correlationType: 'Trace-to-logs',
            version: '1.0.0',
            entities: [
              { tracesDataset: { id: 'references[0].id' } },
              { logsDataset: { id: 'references[1].id' } },
            ],
          },
          references: [
            { name: 'entities[0].index', type: 'index-pattern', id: 'trace-999' },
            { name: 'entities[1].index', type: 'index-pattern', id: 'trace-123' }, // Found but as logs dataset
          ],
        },
      ];

      // @ts-expect-error TS2322 TODO(ts-error): fixme
      mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: mockCorrelations });

      const result = await client.getCorrelationByTraceDataset('trace-123');

      expect(result).toBeNull();
    });
  });
});
