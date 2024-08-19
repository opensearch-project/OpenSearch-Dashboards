/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset, DEFAULT_DATA, DataStructure, IndexPattern } from '../../../../../common';
import { IndexPatternsContract } from '../../../../index_patterns';
import { DatasetHandlerConfig } from '../types';

export const indexPatternHandlerConfig: DatasetHandlerConfig = {
  toDataset: (dataStructure: DataStructure): Dataset => ({
    id: dataStructure.id,
    title: dataStructure.title,
    type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    dataSource: dataStructure.parent
      ? {
          id: dataStructure.parent.id,
          title: dataStructure.parent.title,
          type: dataStructure.parent.type,
        }
      : undefined,
  }),

  toDataStructure: (dataset: Dataset): DataStructure => ({
    id: dataset.id,
    title: dataset.title,
    type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    parent: dataset.dataSource
      ? {
          id: dataset.dataSource.id!,
          title: dataset.dataSource.title,
          type: dataset.dataSource.type,
        }
      : undefined,
  }),

  fetchOptions: async (
    dataStructure: DataStructure,
    indexPatterns: IndexPatternsContract
  ): Promise<DataStructure[]> => {
    const patterns = await indexPatterns.getIdsWithTitle();
    return patterns.map((pattern: any) => ({
      id: pattern.id!,
      title: pattern.title,
      type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      parent: dataStructure,
    }));
  },

  isLeaf: () => true,
};

export function indexPatternToDataStructure(dataset: Dataset): DataStructure {
  return {
    id: dataset.id,
    title: dataset.title,
    type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    parent: dataset.dataSource
      ? {
          id: dataset.dataSource.id!,
          title: dataset.dataSource.title!,
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        }
      : undefined,
  };
}

export function indexPatternToDataset(indexPattern: IndexPattern): Dataset {
  return {
    id: indexPattern.id!,
    title: indexPattern.title,
    type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    timeFieldName: indexPattern.timeFieldName,
    dataSource: indexPattern.dataSourceRef
      ? {
          id: indexPattern.dataSourceRef.id,
          title: indexPattern.dataSourceRef.name!,
          type: indexPattern.dataSourceRef.type,
        }
      : undefined,
  };
}
