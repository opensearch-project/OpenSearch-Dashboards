/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CorrelationService } from './correlation_service';
import {
  SavedObjectsClientContract,
  IUiSettingsClient,
} from '../../../../../../../../../core/public';
import { DataPublicPluginStart } from '../../../../../../../../data/public';
import { Dataset } from '../../../../../../../../data/common';
import { SAMPLE_SIZE_SETTING } from '../../../../../../../common';
import {
  fetchTraceLogsByTraceId,
  transformLogsResponseToHits,
} from '../../server/ppl_request_logs';

jest.mock('../../server/ppl_request_logs', () => ({
  fetchTraceLogsByTraceId: jest.fn(),
  transformLogsResponseToHits: jest.fn(),
}));

const mockFetchTraceLogsByTraceId = fetchTraceLogsByTraceId as jest.MockedFunction<
  typeof fetchTraceLogsByTraceId
>;
const mockTransformLogsResponseToHits = transformLogsResponseToHits as jest.MockedFunction<
  typeof transformLogsResponseToHits
>;

describe('CorrelationService', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;
  let mockUiSettings: jest.Mocked<IUiSettingsClient>;
  let correlationService: CorrelationService;
  let mockDataService: jest.Mocked<DataPublicPluginStart>;

  beforeEach(() => {
    mockSavedObjectsClient = {
      find: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bulkCreate: jest.fn(),
      bulkGet: jest.fn(),
      bulkUpdate: jest.fn(),
    } as any;

    mockUiSettings = {
      get: jest.fn((key) => {
        if (key === SAMPLE_SIZE_SETTING) return 500;
        return undefined;
      }),
    } as any;

    mockDataService = {} as any;

    correlationService = new CorrelationService(mockSavedObjectsClient, mockUiSettings);

    jest.clearAllMocks();
  });

  describe('findCorrelationsByDataset', () => {
    it('should find correlations by dataset ID', async () => {
      const mockCorrelations = {
        savedObjects: [
          {
            id: 'correlation-1',
            type: 'correlations',
            attributes: {
              correlations: {
                entities: [{ id: 'test-dataset-id' }],
              },
            },
            references: [{ id: 'test-dataset-id', type: 'index-pattern' }],
          } as any,
        ],
        total: 1,
        perPage: 10,
        page: 1,
      };

      mockSavedObjectsClient.find.mockResolvedValue(mockCorrelations as any);

      const result = await correlationService.findCorrelationsByDataset('test-dataset-id');

      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
        type: 'correlations',
        fields: ['correlations', 'references'],
        perPage: 10,
      });

      expect(result.savedObjects).toHaveLength(1);
      expect(result.savedObjects[0].id).toBe('correlation-1');
    });

    it('should filter correlations by reference ID', async () => {
      const mockCorrelations = {
        savedObjects: [
          {
            id: 'correlation-1',
            type: 'correlations',
            attributes: {},
            references: [{ id: 'test-dataset-id', type: 'index-pattern' }],
          } as any,
          {
            id: 'correlation-2',
            type: 'correlations',
            attributes: {},
            references: [{ id: 'other-dataset-id', type: 'index-pattern' }],
          } as any,
        ],
        total: 2,
        perPage: 10,
        page: 1,
      };

      mockSavedObjectsClient.find.mockResolvedValue(mockCorrelations as any);

      const result = await correlationService.findCorrelationsByDataset('test-dataset-id');

      expect(result.savedObjects).toHaveLength(1);
      expect(result.savedObjects[0].id).toBe('correlation-1');
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to fetch correlations');
      mockSavedObjectsClient.find.mockRejectedValue(error);

      await expect(correlationService.findCorrelationsByDataset('test-dataset-id')).rejects.toThrow(
        'Failed to fetch correlations'
      );
    });
  });

  describe('fetchLogDataset', () => {
    it('should fetch log dataset by ID', async () => {
      const mockIndexPattern = {
        id: 'log-dataset-id',
        type: 'index-pattern',
        attributes: {
          title: 'logs-*',
          timeFieldName: '@timestamp',
          type: 'INDEX_PATTERN',
        },
      };

      mockSavedObjectsClient.get.mockResolvedValue(mockIndexPattern as any);

      const result = await correlationService.fetchLogDataset('log-dataset-id');

      expect(mockSavedObjectsClient.get).toHaveBeenCalledWith('index-pattern', 'log-dataset-id');
      expect(result).toEqual({
        id: 'log-dataset-id',
        timeFieldName: '@timestamp',
        title: 'logs-*',
        type: 'INDEX_PATTERN',
      });
    });

    it('should use default values for missing attributes', async () => {
      const mockIndexPattern = {
        id: 'log-dataset-id',
        type: 'index-pattern',
        attributes: {},
      };

      mockSavedObjectsClient.get.mockResolvedValue(mockIndexPattern as any);

      const result = await correlationService.fetchLogDataset('log-dataset-id');

      expect(result).toEqual({
        id: 'log-dataset-id',
        timeFieldName: 'time',
        title: 'Unknown Title',
        type: 'INDEX_PATTERN',
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to fetch log dataset');
      mockSavedObjectsClient.get.mockRejectedValue(error);

      await expect(correlationService.fetchLogDataset('log-dataset-id')).rejects.toThrow(
        'Failed to fetch log dataset'
      );
    });
  });

  describe('checkCorrelationsForLogs', () => {
    it('should return empty array for missing dataset ID', async () => {
      const dataset = {} as Dataset;
      const result = await correlationService.checkCorrelationsForLogs(dataset);
      expect(result).toEqual([]);
    });

    it('should find log datasets from correlations', async () => {
      const dataset = { id: 'trace-dataset-id' } as Dataset;

      const mockCorrelations = {
        savedObjects: [
          {
            id: 'correlation-1',
            type: 'correlations',
            attributes: {
              entities: [
                { tracesDataset: { meta: { correlatedFields: {} } } },
                { logsDataset: { meta: { correlatedFields: {} } } },
              ],
            },
            references: [
              { id: 'trace-dataset-id', type: 'index-pattern' },
              { id: 'log-dataset-id', type: 'index-pattern' },
            ],
          } as any,
        ],
        total: 1,
        perPage: 10,
        page: 1,
      };

      const mockLogDataset = {
        id: 'log-dataset-id',
        type: 'index-pattern',
        attributes: {
          title: 'logs-*',
          timeFieldName: '@timestamp',
        },
      };

      mockSavedObjectsClient.find.mockResolvedValue(mockCorrelations as any);
      mockSavedObjectsClient.get.mockResolvedValue(mockLogDataset as any);

      const result = await correlationService.checkCorrelationsForLogs(dataset);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'log-dataset-id',
        timeFieldName: '@timestamp',
        title: 'logs-*',
        type: 'INDEX_PATTERN',
      });
    });

    it('should handle correlations without matching entities', async () => {
      const dataset = { id: 'trace-dataset-id' } as Dataset;

      const mockCorrelations = {
        savedObjects: [
          {
            id: 'correlation-1',
            type: 'correlations',
            attributes: {
              entities: [{ tracesDataset: { meta: { correlatedFields: {} } } }],
            },
            references: [{ id: 'other-dataset-id', type: 'index-pattern' }],
          } as any,
        ],
        total: 1,
        perPage: 10,
        page: 1,
      };

      mockSavedObjectsClient.find.mockResolvedValue(mockCorrelations as any);

      const result = await correlationService.checkCorrelationsForLogs(dataset);

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const dataset = { id: 'trace-dataset-id' } as Dataset;
      const error = new Error('Failed to check correlations');

      mockSavedObjectsClient.find.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await correlationService.checkCorrelationsForLogs(dataset);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to check correlations for logs:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('checkCorrelationsAndFetchLogs', () => {
    it('should return empty results for missing parameters', async () => {
      const result1 = await correlationService.checkCorrelationsAndFetchLogs(
        {} as Dataset,
        mockDataService,
        'trace-id'
      );
      expect(result1).toEqual({ logDatasets: [], logs: [], datasetLogs: {} });

      const result2 = await correlationService.checkCorrelationsAndFetchLogs(
        { id: 'dataset-id' } as Dataset,
        null as any,
        'trace-id'
      );
      expect(result2).toEqual({ logDatasets: [], logs: [], datasetLogs: {} });

      const result3 = await correlationService.checkCorrelationsAndFetchLogs(
        { id: 'dataset-id' } as Dataset,
        mockDataService,
        ''
      );
      expect(result3).toEqual({ logDatasets: [], logs: [], datasetLogs: {} });
    });

    it('should fetch logs when correlations are found', async () => {
      const dataset = { id: 'trace-dataset-id' } as Dataset;
      const traceId = 'test-trace-id';

      const mockLogDatasets = [
        {
          id: 'log-dataset-id',
          timeFieldName: '@timestamp',
          title: 'logs-*',
          type: 'INDEX_PATTERN',
        },
      ];

      const mockLogsResponse = { hits: [] };
      const mockTransformedLogs = [
        {
          _id: 'log-1',
          _source: {
            timestamp: '2023-01-01T00:00:00Z',
            message: 'Test log message',
            level: 'info',
            spanId: 'span-1',
            traceId: 'test-trace-id',
          },
          timestamp: '2023-01-01T00:00:00Z',
          message: 'Test log message',
          level: 'info',
          spanId: 'span-1',
          traceId: 'test-trace-id',
        },
      ];

      const mockCorrelations = {
        savedObjects: [
          {
            id: 'correlation-1',
            type: 'correlations',
            attributes: {
              entities: [
                { tracesDataset: { meta: { correlatedFields: {} } } },
                { logsDataset: { meta: { correlatedFields: {} } } },
              ],
            },
            references: [
              { id: 'trace-dataset-id', type: 'index-pattern' },
              { id: 'log-dataset-id', type: 'index-pattern' },
            ],
          } as any,
        ],
        total: 1,
        perPage: 10,
        page: 1,
      };

      const mockLogDataset = {
        id: 'log-dataset-id',
        type: 'index-pattern',
        attributes: {
          title: 'logs-*',
          timeFieldName: '@timestamp',
        },
      };

      mockSavedObjectsClient.find.mockResolvedValue(mockCorrelations as any);
      mockSavedObjectsClient.get.mockResolvedValue(mockLogDataset as any);
      mockFetchTraceLogsByTraceId.mockResolvedValue(mockLogsResponse);
      mockTransformLogsResponseToHits.mockReturnValue(mockTransformedLogs as any);

      const result = await correlationService.checkCorrelationsAndFetchLogs(
        dataset,
        mockDataService,
        traceId
      );

      expect(result.logDatasets).toEqual(mockLogDatasets);
      expect(result.logs).toEqual(mockTransformedLogs);

      expect(mockFetchTraceLogsByTraceId).toHaveBeenCalledWith(mockDataService, {
        traceId,
        dataset: mockLogDatasets[0],
        limit: 500,
      });
    });

    it('should use UI setting for sample size', async () => {
      const dataset = { id: 'trace-dataset-id' } as Dataset;
      const traceId = 'test-trace-id';

      const mockLogDatasets = [
        {
          id: 'log-dataset-id',
          timeFieldName: '@timestamp',
          title: 'logs-*',
          type: 'INDEX_PATTERN',
        },
      ];

      const mockLogsResponse = { hits: [] };
      const mockTransformedLogs: any[] = [];

      // Mock UI settings to return a different sample size
      mockUiSettings.get.mockImplementation((key) => {
        if (key === SAMPLE_SIZE_SETTING) return 750;
        return undefined;
      });

      jest.spyOn(correlationService, 'checkCorrelationsForLogs').mockResolvedValue(mockLogDatasets);
      mockFetchTraceLogsByTraceId.mockResolvedValue(mockLogsResponse);
      mockTransformLogsResponseToHits.mockReturnValue(mockTransformedLogs as any);

      await correlationService.checkCorrelationsAndFetchLogs(dataset, mockDataService, traceId);

      expect(mockUiSettings.get).toHaveBeenCalledWith(SAMPLE_SIZE_SETTING);
      expect(mockFetchTraceLogsByTraceId).toHaveBeenCalledWith(mockDataService, {
        traceId,
        dataset: mockLogDatasets[0],
        limit: 750,
      });
    });

    it('should return empty logs when no correlations found', async () => {
      const dataset = { id: 'trace-dataset-id' } as Dataset;
      const traceId = 'test-trace-id';

      jest.spyOn(correlationService, 'checkCorrelationsForLogs').mockResolvedValue([]);

      const result = await correlationService.checkCorrelationsAndFetchLogs(
        dataset,
        mockDataService,
        traceId
      );

      expect(result).toEqual({ logDatasets: [], logs: [], datasetLogs: {} });
      expect(mockFetchTraceLogsByTraceId).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const dataset = { id: 'trace-dataset-id' } as Dataset;
      const traceId = 'test-trace-id';
      const error = new Error('Failed to fetch logs');

      jest.spyOn(correlationService, 'checkCorrelationsForLogs').mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await correlationService.checkCorrelationsAndFetchLogs(
        dataset,
        mockDataService,
        traceId
      );

      expect(result).toEqual({ logDatasets: [], logs: [], datasetLogs: {} });
      expect(consoleSpy).toHaveBeenCalledWith('Error in checkCorrelationsAndFetchLogs:', error);

      consoleSpy.mockRestore();
    });
  });
});
