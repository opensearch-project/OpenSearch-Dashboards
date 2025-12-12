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
import { getIndexPatterns } from '../../../../services';
import {
  getRemoteClusterConnections,
  getRemoteClusterIndices,
  injectMetaToDataStructures,
} from './utils';
import { DataSourceEngineType } from '../../../../../../../plugins/data_source/common/data_sources';
import { IndexDataStructureCreator } from './index_data_structure_creator/index_data_structure_creator';

export const DELIMITER = '::';

export const indexTypeConfig: DatasetTypeConfig = {
  id: DEFAULT_DATA.SET_TYPES.INDEX,
  title: 'Indexes',
  meta: {
    icon: { type: 'logoOpenSearch' },
    tooltip: 'OpenSearch Indexes',
    searchOnLoad: true,
    cacheOptions: false,
  },

  toDataset: (path) => {
    const index = path[path.length - 1];
    const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');
    const indexMeta = index.meta as DataStructureCustomMeta;

    // Handle different types of multi-selections - preserve comma-separated format
    let datasetTitle = index.title;

    // Check if this is a multi-index selection
    if (indexMeta?.isMultiIndex && indexMeta?.selectedTitles?.length) {
      // Use the selected titles array to create comma-separated string
      datasetTitle = indexMeta.selectedTitles.join(',');
    }
    // Check if this is a multi-wildcard selection
    else if (indexMeta?.isMultiWildcard && indexMeta?.wildcardPatterns?.length) {
      // Use the wildcard patterns to create comma-separated string
      datasetTitle = indexMeta.wildcardPatterns.join(',');
    }

    return {
      id: index.id,
      title: datasetTitle,
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
          DataStructureCreator: IndexDataStructureCreator,
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

interface ResolveIndexResponse {
  indices?: Array<{ name: string; attributes?: string[] }>;
  aliases?: Array<{ name: string }>;
  data_streams?: Array<{ name: string }>;
}

const fetchIndices = async (dataStructure: DataStructure, http: HttpSetup): Promise<string[]> => {
  try {
    const query: any = {
      expand_wildcards: 'all',
    };

    if (dataStructure.id && dataStructure.id !== '') {
      query.data_source = dataStructure.id;
    }

    const response = await http.get<ResolveIndexResponse>(
      `/internal/index-pattern-management/resolve_index/*`,
      { query }
    );

    if (!response) {
      return [];
    }

    const indices: string[] = [];

    // Add regular indices
    if (response.indices) {
      response.indices.forEach((index) => {
        indices.push(index.name);
      });
    }

    // Add aliases as indices
    if (response.aliases) {
      response.aliases.forEach((alias) => {
        indices.push(alias.name);
      });
    }

    // Add data streams as indices
    if (response.data_streams) {
      response.data_streams.forEach((dataStream) => {
        indices.push(dataStream.name);
      });
    }

    return indices.sort();
  } catch (error) {
    return [];
  }
};

const fetchAllIndices = async (
  dataStructure: DataStructure,
  http: HttpSetup
): Promise<Array<{ name: string; isRemoteIndex: boolean }>> => {
  // Create promises for both local and remote indices
  const [localIndices, remoteIndices] = await Promise.all([
    // Fetch local indices
    fetchIndices(dataStructure, http).then((indices) =>
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
