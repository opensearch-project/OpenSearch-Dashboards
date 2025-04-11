/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpSetup,
  SavedObjectsClientContract,
  SimpleSavedObject,
} from 'opensearch-dashboards/public';
import { map } from 'rxjs/operators';
import { i18n } from '@osd/i18n';
import {
  DATA_STRUCTURE_META_TYPES,
  DEFAULT_DATA,
  DataStructure,
  DataStructureCustomMeta,
  Dataset,
} from '../../../../../common';
import { DatasetTypeConfig } from '../types';
import { getSearchService, getIndexPatterns } from '../../../../services';
import {
  getRemoteClusterConnections,
  getRemoteClusterIndices,
  injectMetaToDataStructures,
} from './utils';
import { DataSourceEngineType } from '../../../../../../../plugins/data_source/common/data_sources';

export const DELIMITER = '::';

export const indexTypeConfig: DatasetTypeConfig = {
  id: DEFAULT_DATA.SET_TYPES.INDEX,
  title: 'Indexes',
  meta: {
    icon: { type: 'logoOpenSearch' },
    tooltip: 'OpenSearch Indexes',
    searchOnLoad: true,
  },

  toDataset: (path) => {
    const index = path[path.length - 1];
    const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');
    const indexMeta = index.meta as DataStructureCustomMeta;

    return {
      id: index.id,
      title: index.title,
      type: DEFAULT_DATA.SET_TYPES.INDEX,
      timeFieldName: indexMeta?.timeFieldName,
      isRemoteDataset: indexMeta?.isRemoteIndex,
      dataSource: dataSource
        ? {
            id: dataSource.id,
            title: dataSource.title,
            type: dataSource.type,
          }
        : DEFAULT_DATA.STRUCTURES.LOCAL_DATASOURCE,
    } as Dataset;
  },

  fetch: async (services, path) => {
    const dataStructure = path[path.length - 1];
    switch (dataStructure.type) {
      case 'DATA_SOURCE': {
        const indices = await fetchAllIndices(dataStructure, services.http); // contains all indices

        return {
          ...dataStructure,
          hasNext: false,
          columnHeader: 'Indexes',
          children: indices.map((index) => ({
            id: `${dataStructure.id}::${index.name}`,
            title: index.name,
            type: 'INDEX',
            meta: {
              type: DATA_STRUCTURE_META_TYPES.CUSTOM,
              isRemoteIndex: index.isRemoteIndex,
            },
          })),
        };
      }

      default: {
        const dataSources = await fetchDataSources(services.savedObjects.client, services.http);
        // enrich dataSources with remoteConnections
        return {
          ...dataStructure,
          columnHeader: 'Data sources',
          hasNext: true,
          children: dataSources,
        };
      }
    }
  },

  fetchFields: async (dataset) => {
    const fields = await getIndexPatterns().getFieldsForWildcard({
      pattern: dataset.title,
      dataSourceId: dataset.dataSource?.id,
    });
    return fields.map((field: any) => ({
      name: field.name,
      type: field.type,
      aggregatable: field?.aggregatable,
    }));
  },

  supportedLanguages: (dataset?: Dataset): string[] => {
    return ['SQL', 'PPL'];
  },

  getSampleQueries: (dataset?: Dataset, language?: string) => {
    if (!dataset || !language) return [];

    switch (language) {
      case 'PPL':
        return [
          {
            title: i18n.translate('data.indexType.sampleQuery.basicPPLQuery', {
              defaultMessage: 'Sample query for PPL',
            }),
            query: `source = ${dataset.title}`,
          },
        ];
      case 'SQL':
        return [
          {
            title: i18n.translate('data.indexType.sampleQuery.basicSQLQuery', {
              defaultMessage: 'Sample query for SQL',
            }),
            query: `SELECT * FROM ${dataset.title} LIMIT 10`,
          },
        ];
      default:
        return [];
    }
  },
};

const fetchDataSources = async (client: SavedObjectsClientContract, http: HttpSetup) => {
  const response = await client.find<any>({
    type: 'data-source',
    perPage: 10000,
  });

  const remoteConnectionPromises = response.savedObjects.map(async (savedObject) => {
    if (
      savedObject?.attributes?.dataSourceEngineType === DataSourceEngineType.Elasticsearch ||
      savedObject?.attributes?.dataSourceEngineType === DataSourceEngineType.OpenSearch
    ) {
      return getRemoteClusterConnections(savedObject.id, http).catch(() => []);
    }
    return [];
  });

  const remoteConnections = (await Promise.all(remoteConnectionPromises)).flat();

  const dataSources: DataStructure[] = response.savedObjects.map((savedObject) =>
    mapDataSourceSavedObjectToDataStructure(savedObject, remoteConnections)
  );
  return injectMetaToDataStructures(dataSources);
};

const mapDataSourceSavedObjectToDataStructure = (
  savedObject: SimpleSavedObject<any>,
  remoteConnections: any[]
): DataStructure => {
  const dataSourceId = savedObject.id;
  const dataSourceTitle = savedObject.attributes.title;

  const relevantRemoteConnections = remoteConnections
    .filter((connection) => connection.parentId === dataSourceId)
    .map((connection) => connection.connectionsAliases)?.[0]; // Each parentdatasourcce will have only one remote connections entry hence getting the first element

  return {
    id: dataSourceId,
    title: dataSourceTitle,
    type: 'DATA_SOURCE',
    remoteConnections: relevantRemoteConnections,
    meta:
      relevantRemoteConnections && relevantRemoteConnections.length > 0
        ? {
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            additionalAppendIcons: [
              {
                type: 'iInCircle',
                tooltip: i18n.translate(
                  'data.query.queryString.datasetExplorer.index.additonalmetaIcon.tooltip',
                  {
                    defaultMessage:
                      'Connnected with {remoteConnections} indexes using Cross cluster search.',
                    values: {
                      remoteConnections: relevantRemoteConnections.join(','),
                    },
                  }
                ),
              },
            ],
          }
        : undefined,
  };
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
    if (!rawResponse.aggregations) {
      return [];
    }

    return rawResponse.aggregations.indices.buckets.map((bucket: { key: string }) => {
      const key = bucket.key;
      // Note: Index names cannot contain ':' or '::' in OpenSearch, so these delimiters
      // are guaranteed not to be part of the regular format of index name
      const parts = key.split(DELIMITER);
      const lastPart = parts[parts.length - 1] || key;
      // extract index name or return original key if pattern doesn't match
      return lastPart.split(':')[0] || key;
    });
  };

  return search
    .getDefaultSearchInterceptor()
    .search(buildSearchRequest())
    .pipe(map(searchResponseToArray))
    .toPromise();
};

const fetchAllIndices = async (
  dataStructure: DataStructure,
  http: HttpSetup
): Promise<Array<{ name: string; isRemoteIndex: boolean }>> => {
  // Create promises for both local and remote indices
  const [localIndices, remoteIndices] = await Promise.all([
    // Fetch local indices
    fetchIndices(dataStructure).then((indices) =>
      indices.map((index) => ({
        name: index,
        isRemoteIndex: false,
      }))
    ),

    // Fetch remote indices if they exist
    dataStructure?.remoteConnections
      ? Promise.all(
          dataStructure.remoteConnections.map((connectionAlias) =>
            getRemoteClusterIndices(dataStructure.id, http, connectionAlias).catch(() => [])
          )
        ).then((indices) =>
          indices.flat().map((index) => ({
            name: index,
            isRemoteIndex: true,
          }))
        )
      : Promise.resolve([]),
  ]);

  // Combine local and remote indices
  return [...localIndices, ...remoteIndices];
};
