/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DataSourceAttributes } from '../../../../../../data_source/common/data_sources';
import {
  DEFAULT_DATA,
  DataStructure,
  DatasetField,
  Dataset,
  IIndexPattern,
  DATA_STRUCTURE_META_TYPES,
} from '../../../../../common';
import { DatasetTypeConfig } from '../types';
import { getIndexPatterns } from '../../../../services';

export const indexPatternTypeConfig: DatasetTypeConfig = {
  id: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
  title: 'Index Patterns',
  meta: {
    icon: { type: 'indexPatternApp' },
    tooltip: 'OpenSearch Index Patterns',
  },

  toDataset: (path) => {
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
    } as Dataset;
  },

  fetch: async (savedObjects, path) => {
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

  supportedLanguages: (dataset): string[] => {
    if (dataset.dataSource?.type === 'OpenSearch Serverless') {
      return ['DQL', 'Lucene'];
    }
    return ['DQL', 'Lucene', 'PPL', 'SQL'];
  },
};

const fetchIndexPatterns = async (client: SavedObjectsClientContract): Promise<DataStructure[]> => {
  const resp = await client.find<IIndexPattern>({
    type: 'index-pattern',
    fields: ['title', 'timeFieldName', 'references'],
    search: `*`,
    searchFields: ['title'],
    perPage: 100,
  });

  // Get all unique data source ids
  const datasourceIds = Array.from(
    new Set(
      resp.savedObjects
        .filter((savedObject) => savedObject.references.length > 0)
        .map((savedObject) => savedObject.references.find((ref) => ref.type === 'data-source')?.id)
        .filter(Boolean)
    )
  ) as string[];

  const dataSourceMap: Record<string, DataSourceAttributes> = {};
  if (datasourceIds.length > 0) {
    const dataSourceResp = await client.bulkGet<DataSourceAttributes>(
      datasourceIds.map((id) => ({ id, type: 'data-source' }))
    );

    dataSourceResp.savedObjects.forEach((savedObject) => {
      dataSourceMap[savedObject.id] = savedObject.attributes;
    });
  }

  return resp.savedObjects.map(
    (savedObject): DataStructure => {
      const dataSourceId = savedObject.references.find((ref) => ref.type === 'data-source')?.id;
      const dataSource = dataSourceId ? dataSourceMap[dataSourceId] : undefined;

      const indexPatternDataStructure: DataStructure = {
        id: savedObject.id,
        title: savedObject.attributes.title,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        meta: {
          type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          timeFieldName: savedObject.attributes.timeFieldName,
        },
      };

      if (dataSource) {
        indexPatternDataStructure.parent = {
          id: dataSourceId!, // Since we know it exists
          title: dataSource.title,
          type: dataSource.dataSourceEngineType ?? DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        };
      }
      return indexPatternDataStructure;
    }
  );
};
