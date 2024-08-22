/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { map } from 'rxjs/operators';
import {
  Dataset,
  DEFAULT_DATA,
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
  DataStructureFeatureMeta,
} from '../../../../../common';
import { DatasetHandlerConfig } from '../types';
import { getIndexPatterns, getSearchService } from '../../../../services';

const INDEX_INFO = {
  ID: DEFAULT_DATA.SET_TYPES.INDEX,
  TITLE: 'Indexes',
  ICON: 'logoOpenSearch',
  LOCAL_DATASOURCE: {
    id: '',
    title: 'Local Cluster',
    type: 'data-source',
  },
};
const meta = {
  type: DATA_STRUCTURE_META_TYPES.FEATURE,
  icon: INDEX_INFO.ICON,
  tooltip: INDEX_INFO.TITLE,
} as DataStructureFeatureMeta;

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
    meta,
  }),

  fetchOptions: async (
    savedObjects: SavedObjectsClientContract,
    dataStructure: DataStructure
  ): Promise<DataStructure[]> => {
    switch (dataStructure.type) {
      case DEFAULT_DATA.STRUCTURES.ROOT.type: {
        const dataSources = await fetchDataSources(savedObjects);
        return [
          {
            id: INDEX_INFO.ID,
            title: INDEX_INFO.TITLE,
            type: DEFAULT_DATA.STRUCTURES.CATEGORY.type,
            children: dataSources,
          } as DataStructure,
        ];
      }
      case DEFAULT_DATA.STRUCTURES.CATEGORY.type: {
        return dataStructure.children || [];
      }
      case DEFAULT_DATA.STRUCTURES.DATA_SOURCE.type: {
        const indices = await fetchIndices(dataStructure);
        dataStructure.children = indices;
        return indices;
      }
      case DEFAULT_DATA.STRUCTURES.INDEX.type: {
        const fields = await getIndexPatterns().getFieldsForWildcard({
          pattern: dataStructure.title,
          dataSourceId: dataStructure.parent!.id,
        });

        dataStructure.children = fields.map(
          (field: any) =>
            ({
              id: `${dataStructure.id}-${field.name}`,
              title: field.name,
              type:
                field.type === 'date'
                  ? DEFAULT_DATA.STRUCTURES.TIME_FIELD.type
                  : DEFAULT_DATA.STRUCTURES.FIELD.type,
              parent: dataStructure,
              meta:
                field.type === 'date'
                  ? DEFAULT_DATA.STRUCTURES.TIME_FIELD.meta
                  : DEFAULT_DATA.STRUCTURES.FIELD.meta,
            } as DataStructure)
        );

        return dataStructure.children || [];
      }
      case DEFAULT_DATA.STRUCTURES.FIELD.type:
      case DEFAULT_DATA.STRUCTURES.TIME_FIELD.type: {
        return [
          {
            id: dataStructure.parent!.id,
            title: dataStructure.parent!.title,
            type: DEFAULT_DATA.STRUCTURES.DATASET.type,
            parent: dataStructure,
            meta: DEFAULT_DATA.STRUCTURES.DATASET.meta,
          } as DataStructure,
        ];
      }
    }
    return [dataStructure];
  },

  isLeaf: (dataStructure: DataStructure) => {
    return dataStructure.type === DEFAULT_DATA.STRUCTURES.DATASET.type;
  },
};

const fetchDataSources = async (client: SavedObjectsClientContract) => {
  const resp = await client.find<any>({
    type: 'data-source',
    perPage: 10000,
  });
  const dataSources: DataStructure[] = [INDEX_INFO.LOCAL_DATASOURCE];
  return dataSources.concat([
    ...(resp.savedObjects.map((savedObject) => ({
      id: savedObject.id,
      title: savedObject.attributes.title,
      type: 'data-source',
    })) as DataStructure[]),
  ]);
};

/**
 * Fetches indices and converts them to DataStructures.
 * @param client - The SavedObjectsClientContract for accessing index information.
 * @returns A promise that resolves to an array of DataStructures representing indices.
 */
const fetchIndices = async (dataStructure: DataStructure) => {
  const search = getSearchService();
  const buildSearchRequest = () => {
    const request = {
      params: {
        ignoreUnavailable: true,
        expand_wildcards: 'all',
        index: '*',
        body: {
          size: 0, // no hits
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
    };

    return request;
  };

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
