/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset, DEFAULT_DATA, DataStructure } from '../../../../../common';
import { IndexPatternsContract } from '../../../../index_patterns';
import { DatasetHandlerConfig } from '../types';

export const indexHandlerConfig: DatasetHandlerConfig = {
  toDataset: (dataStructure: DataStructure): Dataset => ({
    id: dataStructure.id,
    title: dataStructure.title,
    type: DEFAULT_DATA.SET_TYPES.INDEX,
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
    type: DEFAULT_DATA.SET_TYPES.INDEX,
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
    const indices = await indexPatterns.getFieldsForWildcard({ pattern: dataStructure.title });
    return indices.map((index: any) => ({
      id: index.name,
      title: index.name,
      type: DEFAULT_DATA.SET_TYPES.INDEX,
      parent: dataStructure,
    }));
  },

  isLeaf: () => true,
};

export function indexToDataStructure(dataset: Dataset): DataStructure {
  return {
    id: dataset.id,
    title: dataset.title,
    type: DEFAULT_DATA.SET_TYPES.INDEX,
    parent: dataset.dataSource
      ? {
          id: dataset.dataSource.id!,
          title: dataset.dataSource.title!,
          type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        }
      : undefined,
  };
}

export function indexToDataset(index: DataStructure): Dataset {
  return {
    id: index.id,
    title: index.title,
    type: DEFAULT_DATA.SET_TYPES.INDEX,
    dataSource: index.parent
      ? {
          id: index.parent.id,
          title: index.parent.title,
          type: index.parent.type,
        }
      : undefined,
  };
}
