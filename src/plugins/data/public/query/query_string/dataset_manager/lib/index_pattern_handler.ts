/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import {
  Dataset,
  DEFAULT_DATA,
  DataStructure,
  IndexPattern,
  DATA_STRUCTURE_META_TYPES,
  DataStructureFeatureMeta,
  IIndexPattern,
} from '../../../../../common';
import { DatasetHandlerConfig } from '../types';

const PATTERN_INFO = {
  ID: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
  TITLE: 'Index Patterns',
  ICON: 'document',
};
const meta = {
  type: DATA_STRUCTURE_META_TYPES.FEATURE,
  icon: PATTERN_INFO.ICON,
  tooltip: PATTERN_INFO.TITLE,
} as DataStructureFeatureMeta;

/**
 * Configuration for handling index pattern operations.
 */
export const indexPatternHandlerConfig: DatasetHandlerConfig = {
  /**
   * Converts a DataStructure to a Dataset.
   * @param dataStructure - The DataStructure to convert.
   * @returns The resulting Dataset.
   */
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

  /**
   * Converts a Dataset to a DataStructure.
   * @param dataset - The Dataset to convert.
   * @returns The resulting DataStructure.
   */
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
    meta,
  }),

  /**
   * Fetches index pattern options.
   * @param client - The saved objects client
   * @param dataStructure - The parent DataStructure.
   * @returns A promise that resolves to an array of child DataStructures.
   */
  fetchOptions: async (
    savedObjects: SavedObjectsClientContract,
    dataStructure: DataStructure
  ): Promise<DataStructure[]> => {
    switch (dataStructure.type) {
      case DEFAULT_DATA.STRUCTURES.ROOT.type: {
        const indexPatterns = await fetchIndexPatterns(savedObjects);
        return [
          {
            id: PATTERN_INFO.ID,
            title: PATTERN_INFO.TITLE,
            type: DEFAULT_DATA.STRUCTURES.CATEGORY.type,
            children: indexPatterns.map((indexPattern) =>
              indexPatternToDataStructure(indexPattern as any)
            ),
          } as DataStructure,
        ];
      }
      case DEFAULT_DATA.STRUCTURES.CATEGORY.type: {
        return dataStructure.children || [];
      }
      case DEFAULT_DATA.STRUCTURES.DATASET.type: {
        return [];
      }
    }
    return [dataStructure];
  },

  /**
   * Determines if a DataStructure is a leaf node.
   * @returns true if DATASET
   */
  isLeaf: (dataStructure: DataStructure) => {
    return dataStructure.type === DEFAULT_DATA.STRUCTURES.DATASET.type;
  },
};

/**
 * Fetches index patterns and converts them to DataStructures.
 * @param indexPatterns - The IndexPatternsContract for accessing index pattern information.
 * @returns A promise that resolves to an array of DataStructures representing index patterns.
 */
async function fetchIndexPatterns(
  savedObjects: SavedObjectsClientContract,
  search: string = ''
): Promise<IIndexPattern[]> {
  const resp = await savedObjects.find<IIndexPattern>({
    type: 'index-pattern',
    fields: ['title', 'timeFieldName', 'references', 'fields'],
    search: `${search}*`,
    searchFields: ['title'],
    perPage: 100,
  });
  return resp.savedObjects.map((savedObject) => ({
    id: savedObject.id,
    title: savedObject.attributes.title,
    timeFieldName: savedObject.attributes.timeFieldName,
    fields: savedObject.attributes.fields,
    type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    ...(savedObject.references[0]
      ? {
          dataSourceRef: {
            id: savedObject.references[0]?.id,
            name: savedObject.references[0]?.name,
            type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
          },
        }
      : {}),
  }));
}

/**
 * Converts an IndexPattern to a DataStructure.
 * @param indexPattern - The IndexPattern to convert.
 * @returns The resulting DataStructure.
 */
export function indexPatternToDataStructure(indexPattern: IndexPattern): DataStructure {
  return {
    id: indexPattern.id!,
    title: indexPattern.title,
    type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    parent: indexPattern.dataSourceRef
      ? {
          id: indexPattern.dataSourceRef.id!,
          title: indexPattern.dataSourceRef.name!,
          type: indexPattern.dataSourceRef.type,
        }
      : undefined,
    meta,
  };
}

/**
 * Converts an IndexPattern to a Dataset.
 * @param indexPattern - The IndexPattern to convert.
 * @returns The resulting Dataset.
 */
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
