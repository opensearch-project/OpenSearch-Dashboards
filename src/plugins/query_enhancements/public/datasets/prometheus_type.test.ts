/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { IDataPluginServices } from 'src/plugins/data/public';
import {
  CORE_SIGNAL_TYPES,
  DATA_STRUCTURE_META_TYPES,
  DataStructure,
  DataStructureCustomMeta,
} from '../../../data/common';
import { DATASET } from '../../common';
import { prometheusTypeConfig } from './prometheus_type';

describe('prometheusTypeConfig', () => {
  const mockSavedObjectsClient = ({
    find: jest.fn(),
  } as unknown) as SavedObjectsClientContract;
  const mockServices = {
    savedObjects: { client: mockSavedObjectsClient },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toDataset', () => {
    it('should convert DataStructure path to Dataset with dataSource', () => {
      const mockPath: DataStructure[] = [
        { id: 'ds1', title: 'DataSource 1', type: 'DATA_SOURCE' },
        {
          id: 'prometheus-conn',
          title: 'Prometheus Connection',
          type: DATASET.PROMETHEUS,
          meta: {
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            timeFieldName: 'Time',
          } as DataStructureCustomMeta,
          parent: {
            id: 'ds1',
            title: 'DataSource 1',
            type: 'DATA_SOURCE',
          },
        },
      ];

      const result = prometheusTypeConfig.toDataset(mockPath);

      expect(result).toEqual({
        id: 'prometheus-conn',
        title: 'Prometheus Connection',
        type: DATASET.PROMETHEUS,
        language: 'PROMQL',
        timeFieldName: 'Time',
        signalType: CORE_SIGNAL_TYPES.METRICS,
        dataSource: {
          id: 'ds1',
          title: 'DataSource 1',
          type: 'DATA_SOURCE',
        },
      });
    });

    it('should use default timeFieldName when not provided in meta', () => {
      const mockPath: DataStructure[] = [
        {
          id: 'prometheus-conn',
          title: 'Prometheus Connection',
          type: DATASET.PROMETHEUS,
          meta: {
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          } as DataStructureCustomMeta,
        },
      ];

      const result = prometheusTypeConfig.toDataset(mockPath);

      expect(result.timeFieldName).toBe('Time');
    });

    it('should handle path without parent', () => {
      const mockPath: DataStructure[] = [
        {
          id: 'prometheus-conn',
          title: 'Prometheus Connection',
          type: DATASET.PROMETHEUS,
          meta: {
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          } as DataStructureCustomMeta,
        },
      ];

      const result = prometheusTypeConfig.toDataset(mockPath);

      expect(result.dataSource).toBeUndefined();
    });
  });

  describe('fetch', () => {
    it('should fetch Prometheus connections', async () => {
      mockSavedObjectsClient.find = jest.fn().mockResolvedValue({
        savedObjects: [
          {
            id: 'conn1',
            attributes: { connectionId: 'prom-conn-1', type: 'Prometheus', meta: '{}' },
            references: [{ type: 'data-source', id: 'ds1' }],
          },
          {
            id: 'conn2',
            attributes: { connectionId: 'prom-conn-2', type: 'Prometheus', meta: '{}' },
            references: [],
          },
          {
            id: 'conn3',
            attributes: { connectionId: 'other-conn', type: 'S3GLUE', meta: '{}' },
            references: [],
          },
        ],
      });

      const result = await prometheusTypeConfig.fetch(mockServices as IDataPluginServices, [
        {
          id: 'root',
          title: 'Root',
          type: 'PROMETHEUS',
        },
      ]);

      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
        type: 'data-connection',
        perPage: 10000,
      });
      expect(result.children).toHaveLength(2);
      expect(result.children?.[0].id).toBe('prom-conn-1');
      expect(result.children?.[0].title).toBe('prom-conn-1');
      expect(result.children?.[0].type).toBe(DATASET.PROMETHEUS);
      expect(result.children?.[0].meta).toEqual({
        type: DATA_STRUCTURE_META_TYPES.CUSTOM,
        language: 'promql',
        timeFieldName: 'Time',
        dataSourceId: 'ds1',
      });
      expect(result.children?.[1].meta).toEqual({
        type: DATA_STRUCTURE_META_TYPES.CUSTOM,
        language: 'promql',
        timeFieldName: 'Time',
        dataSourceId: undefined,
      });
      expect(result.hasNext).toBe(false);
    });

    it('should return empty array on error', async () => {
      mockSavedObjectsClient.find = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

      const result = await prometheusTypeConfig.fetch(mockServices as IDataPluginServices, [
        {
          id: 'root',
          title: 'Root',
          type: 'PROMETHEUS',
        },
      ]);

      expect(result.children).toHaveLength(0);
    });
  });

  describe('fetchFields', () => {
    it('should return Time field', async () => {
      const mockDataset = { id: 'prom-conn', title: 'Prom Connection', type: DATASET.PROMETHEUS };
      const result = await prometheusTypeConfig.fetchFields(mockDataset);

      expect(result).toEqual([
        {
          name: 'Time',
          type: 'date',
          aggregatable: true,
        },
      ]);
    });
  });

  describe('supportedLanguages', () => {
    it('should return PROMQL', () => {
      const mockDataset = { id: 'prom-conn', title: 'Prom Connection', type: DATASET.PROMETHEUS };
      const result = prometheusTypeConfig.supportedLanguages(mockDataset);

      expect(result).toEqual(['PROMQL']);
    });
  });

  describe('meta', () => {
    it('should have correct meta configuration', () => {
      expect(prometheusTypeConfig.meta).toEqual({
        icon: expect.objectContaining({ type: expect.any(String) }),
        tooltip: 'Prometheus',
      });
    });
  });

  describe('id and title', () => {
    it('should have correct id and title', () => {
      expect(prometheusTypeConfig.id).toBe(DATASET.PROMETHEUS);
      expect(prometheusTypeConfig.title).toBe('Prometheus');
    });
  });
});
