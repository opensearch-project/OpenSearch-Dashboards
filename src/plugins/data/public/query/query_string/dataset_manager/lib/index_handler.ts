/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { map } from 'rxjs/operators';
import {
  DEFAULT_DATA,
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
  DataStructureFeatureMeta,
  DatasetField,
  Dataset,
} from '../../../../../common';
import { DatasetHandlerConfig } from '../types';
import { getSearchService, getIndexPatterns } from '../../../../services';

const INDEX_INFO = {
  ID: DEFAULT_DATA.SET_TYPES.INDEX,
  TITLE: 'Indexes',
  ICON: 'logoOpenSearch',
  LOCAL_DATASOURCE: {
    id: '',
    title: 'Local Cluster',
    type: 'DATA_SOURCE',
  },
};

const meta = {
  type: DATA_STRUCTURE_META_TYPES.FEATURE,
  icon: INDEX_INFO.ICON,
  tooltip: INDEX_INFO.TITLE,
} as DataStructureFeatureMeta;

export const indexHandlerConfig: DatasetHandlerConfig = {
  id: DEFAULT_DATA.SET_TYPES.INDEX,
  title: 'Indexes',
  meta: {
    icon: { type: 'logoOpenSearch' },
    tooltip: 'OpenSearch Indexes',
  },

  toDataset: (path: DataStructure[]): Dataset => {
    const index = path[path.length - 1];
    const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');

    return {
      id: index.id,
      title: index.title,
      type: DEFAULT_DATA.SET_TYPES.INDEX,
      dataSource: dataSource
        ? {
            id: dataSource.id,
            title: dataSource.title,
            type: dataSource.type,
          }
        : INDEX_INFO.LOCAL_DATASOURCE,
    };
  },

  fetch: async (
    savedObjects: SavedObjectsClientContract,
    path: DataStructure[]
  ): Promise<DataStructure> => {
    const dataStructure = path[path.length - 1];
    switch (dataStructure.type) {
      case 'DATA_SOURCE': {
        const indices = await fetchIndices(dataStructure);
        return {
          ...dataStructure,
          isLeaf: true,
          columnHeader: 'Indices',
          children: indices.map((indexName) => ({
            id: `${dataStructure.id}::${indexName}`,
            title: indexName,
            type: DEFAULT_DATA.STRUCTURES.INDEX.type,
          })),
        };
      }

      default: {
        const dataSources = await fetchDataSources(savedObjects);
        return {
          ...dataStructure,
          columnHeader: 'Cluster',
          isLeaf: false,
          children: dataSources,
        };
      }
    }
  },

  fetchFields: async (dataset: Dataset): Promise<DatasetField[]> => {
    const fields = await getIndexPatterns().getFieldsForWildcard({
      pattern: dataset.title,
      dataSourceId: dataset.dataSource?.id,
    });
    return fields.map((field: any) => ({
      name: field.name,
      type: field.type,
    }));
  },

  supportedLanguages: async (): Promise<string[]> => {
    return ['SQL', 'PPL'];
  },
};

const fetchDataSources = async (client: SavedObjectsClientContract) => {
  const resp = await client.find<any>({
    type: 'data-source',
    perPage: 10000,
  });
  const dataSources: DataStructure[] = [INDEX_INFO.LOCAL_DATASOURCE];
  return dataSources.concat(
    resp.savedObjects.map((savedObject) => ({
      id: savedObject.id,
      title: savedObject.attributes.title,
      type: 'DATA_SOURCE',
    }))
  );
};

const fetchIndices = async (dataStructure: DataStructure): Promise<string[]> => {
  const search = getSearchService();
  const buildSearchRequest = () => ({
    params: {
      ignoreUnavailable: true,
      expand_wildcards: 'all',
      index: '*',
      body: {
        size: 0,
        aggs: {
          indices: {
            terms: {
              field: '_index',
              size: 100,
            },
          },
        },
      },
    },
    dataSourceId: dataStructure.id,
  });

  const searchResponseToArray = (response: any) => {
    const { rawResponse } = response;
    return rawResponse.aggregations
      ? rawResponse.aggregations.indices.buckets.map((bucket: { key: any }) => bucket.key)
      : [];
  };

  return search
    .getDefaultSearchInterceptor()
    .search(buildSearchRequest())
    .pipe(map(searchResponseToArray))
    .toPromise();
};
