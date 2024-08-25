/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DEFAULT_DATA, DataStructure, DatasetField, Dataset } from '../../../../../common';
import { DatasetTypeConfig } from '../types';
import { getIndexPatterns } from '../../../../services';

export const indexPatternTypeConfig: DatasetTypeConfig = {
  id: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
  title: 'Index Patterns',
  meta: {
    icon: { type: 'indexPatternApp' },
    tooltip: 'OpenSearch Index Patterns',
  },

  toDataset: (path: DataStructure[]): Dataset => {
    const pattern = path[path.length - 1];
    return {
      id: pattern.id,
      title: pattern.title,
      type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      dataSource: pattern.parent
        ? {
            id: pattern.parent.id,
            title: pattern.parent.title,
            type: pattern.parent.type,
          }
        : undefined,
    };
  },

  fetch: async (
    savedObjects: SavedObjectsClientContract,
    path: DataStructure[]
  ): Promise<DataStructure> => {
    const dataStructure = path[path.length - 1];
    const indexPatterns = await fetchIndexPatterns(savedObjects);
    return {
      ...dataStructure,
      columnHeader: 'Index patterns',
      children: indexPatterns,
      hasNext: false,
    };
  },

  fetchFields: async (dataset: Dataset): Promise<DatasetField[]> => {
    const indexPattern = await getIndexPatterns().get(dataset.id);
    return indexPattern.fields.map((field: any) => ({
      name: field.name,
      type: field.type,
    }));
  },

  supportedLanguages: (): string[] => {
    return ['SQL', 'PPL', 'DQL', 'Lucene'];
  },
};

const fetchIndexPatterns = async (client: SavedObjectsClientContract): Promise<DataStructure[]> => {
  const resp = await client.find<any>({
    type: 'index-pattern',
    fields: ['title'],
    perPage: 10000,
  });
  return resp.savedObjects.map((savedObject) => ({
    id: savedObject.id,
    title: savedObject.attributes.title,
    type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
  }));
};
