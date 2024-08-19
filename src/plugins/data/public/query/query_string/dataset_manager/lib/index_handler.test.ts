/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { indexHandlerConfig, indexToDataStructure, indexToDataset } from './index_handler';
import { Dataset, DEFAULT_DATA, DataStructure } from '../../../../../common';
import { IndexPatternsContract } from '../../../../index_patterns';

describe('Index Handler', () => {
  describe('indexHandlerConfig.toDataset()', () => {
    it('should convert a data structure to a dataset for index', () => {
      const dataStructure: DataStructure = {
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        parent: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      };

      const result = indexHandlerConfig.toDataset(dataStructure);

      expect(result).toEqual({
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        dataSource: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      });
    });

    it('should handle data structure without parent', () => {
      const dataStructure: DataStructure = {
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
      };

      const result = indexHandlerConfig.toDataset(dataStructure);

      expect(result).toEqual({
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        dataSource: undefined,
      });
    });
  });

  describe('indexHandlerConfig.toDataStructure()', () => {
    it('should convert a dataset to a data structure for index', () => {
      const dataset: Dataset = {
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        dataSource: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      };

      const result = indexHandlerConfig.toDataStructure(dataset);

      expect(result).toEqual({
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        parent: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      });
    });

    it('should handle dataset without data source', () => {
      const dataset: Dataset = {
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
      };

      const result = indexHandlerConfig.toDataStructure(dataset);

      expect(result).toEqual({
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        parent: undefined,
      });
    });
  });

  describe('indexHandlerConfig.fetchOptions()', () => {
    it('should fetch options for an index', async () => {
      const dataStructure: DataStructure = {
        id: 'test-index',
        title: 'test-*',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
      };

      const mockIndexPatterns: Partial<IndexPatternsContract> = {
        getFieldsForWildcard: jest
          .fn()
          .mockResolvedValue([{ name: 'test-index-1' }, { name: 'test-index-2' }]),
      };

      const result = await indexHandlerConfig.fetchOptions(
        dataStructure,
        mockIndexPatterns as IndexPatternsContract
      );

      expect(result).toEqual([
        {
          id: 'test-index-1',
          title: 'test-index-1',
          type: DEFAULT_DATA.SET_TYPES.INDEX,
          parent: dataStructure,
        },
        {
          id: 'test-index-2',
          title: 'test-index-2',
          type: DEFAULT_DATA.SET_TYPES.INDEX,
          parent: dataStructure,
        },
      ]);

      expect(mockIndexPatterns.getFieldsForWildcard).toHaveBeenCalledWith({
        pattern: 'test-*',
      });
    });
  });

  describe('indexHandlerConfig.isLeaf()', () => {
    it('should return true for index', () => {
      const dataStructure: DataStructure = {
        id: 'test-index',
        title: 'test-*',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
      };
      expect(indexHandlerConfig.isLeaf(dataStructure)).toBe(true);
    });
  });

  describe('indexToDataStructure()', () => {
    it('should convert a dataset to a data structure for index', () => {
      const dataset: Dataset = {
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        dataSource: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      };

      const result = indexToDataStructure(dataset);

      expect(result).toEqual({
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        parent: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      });
    });

    it('should handle dataset without data source', () => {
      const dataset: Dataset = {
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
      };

      const result = indexToDataStructure(dataset);

      expect(result).toEqual({
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        parent: undefined,
      });
    });
  });

  describe('indexToDataset()', () => {
    it('should convert a data structure to a dataset for index', () => {
      const dataStructure: DataStructure = {
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        parent: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      };

      const result = indexToDataset(dataStructure);

      expect(result).toEqual({
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        dataSource: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      });
    });

    it('should handle data structure without parent', () => {
      const dataStructure: DataStructure = {
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
      };

      const result = indexToDataset(dataStructure);

      expect(result).toEqual({
        id: 'test-index',
        title: 'Test Index',
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        dataSource: undefined,
      });
    });
  });
});
