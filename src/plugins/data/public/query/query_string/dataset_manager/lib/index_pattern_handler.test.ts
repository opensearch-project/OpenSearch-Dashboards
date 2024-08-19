/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { indexPatternHandlerConfig, indexPatternToDataStructure } from './index_pattern_handler';
import { Dataset, DEFAULT_DATA, DataStructure } from '../../../../../common';
import { IndexPatternsContract } from '../../../../index_patterns';

describe('Index Pattern Handler', () => {
  describe('indexPatternHandlerConfig.toDataset()', () => {
    it('should convert a data structure to a dataset for index pattern', () => {
      const dataStructure: DataStructure = {
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        parent: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      };

      const result = indexPatternHandlerConfig.toDataset(dataStructure);

      expect(result).toEqual({
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        dataSource: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      });
    });

    it('should handle data structure without parent', () => {
      const dataStructure: DataStructure = {
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      };

      const result = indexPatternHandlerConfig.toDataset(dataStructure);

      expect(result).toEqual({
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        dataSource: undefined,
      });
    });
  });

  describe('indexPatternHandlerConfig.toDataStructure()', () => {
    it('should convert a dataset to a data structure for index pattern', () => {
      const dataset: Dataset = {
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        dataSource: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      };

      const result = indexPatternHandlerConfig.toDataStructure(dataset);

      expect(result).toEqual({
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        parent: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      });
    });

    it('should handle dataset without data source', () => {
      const dataset: Dataset = {
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      };

      const result = indexPatternHandlerConfig.toDataStructure(dataset);

      expect(result).toEqual({
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        parent: undefined,
      });
    });
  });

  describe('indexPatternHandlerConfig.fetchOptions()', () => {
    it('should fetch options for an index pattern', async () => {
      const dataStructure: DataStructure = {
        id: 'test-source',
        title: 'Test Source',
        type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
      };

      const mockIndexPatterns: Partial<IndexPatternsContract> = {
        getIdsWithTitle: jest.fn().mockResolvedValue([
          { id: 'pattern-1', title: 'Pattern 1' },
          { id: 'pattern-2', title: 'Pattern 2' },
        ]),
      };

      const result = await indexPatternHandlerConfig.fetchOptions(
        dataStructure,
        mockIndexPatterns as IndexPatternsContract
      );

      expect(result).toEqual([
        {
          id: 'pattern-1',
          title: 'Pattern 1',
          type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
          parent: dataStructure,
        },
        {
          id: 'pattern-2',
          title: 'Pattern 2',
          type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
          parent: dataStructure,
        },
      ]);

      expect(mockIndexPatterns.getIdsWithTitle).toHaveBeenCalled();
    });
  });

  describe('indexPatternHandlerConfig.isLeaf()', () => {
    it('should return true for index pattern', () => {
      const dataStructure: DataStructure = {
        id: 'test-source',
        title: 'Test Source',
        type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
      };

      expect(indexPatternHandlerConfig.isLeaf(dataStructure)).toBe(true);
    });
  });

  describe('indexPatternToDataStructure()', () => {
    it('should convert a dataset to a data structure for index pattern', () => {
      const dataset: Dataset = {
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        dataSource: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      };

      const result = indexPatternToDataStructure(dataset);

      expect(result).toEqual({
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        parent: {
          id: 'test-source',
          title: 'Test Source',
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      });
    });

    it('should handle dataset without data source', () => {
      const dataset: Dataset = {
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      };

      const result = indexPatternToDataStructure(dataset);

      expect(result).toEqual({
        id: 'test-pattern',
        title: 'Test Pattern',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        parent: undefined,
      });
    });
  });
});
