/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpSetup,
  SavedObjectsClientContract,
  SimpleSavedObject,
} from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import {
  DATA_STRUCTURE_META_TYPES,
  DEFAULT_DATA,
  DataStructure,
  DataStructureCustomMeta,
  Dataset,
} from '../../../../../common';
import { DatasetTypeConfig } from '../types';
import { getIndexPatterns, getQueryService } from '../../../../services';
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
    const dataSourceMeta = dataSource?.meta as DataStructureCustomMeta | undefined;
    // Prefer the engine type/version carried on the DATA_SOURCE node's meta; fall back to the leaf
    // index's meta (stashed defensively in `fetch`) in case the node's meta did not survive.
    const dataSourceEngineType =
      dataSourceMeta?.dataSourceEngineType ?? indexMeta?.dataSourceEngineType;
    const dataSourceVersion = dataSourceMeta?.dataSourceVersion ?? indexMeta?.dataSourceVersion;

    // Build dataset title from multi-selections (wildcards and/or exact indices)
    let datasetTitle = index.title;

    if (indexMeta?.isMultiWildcard || indexMeta?.isMultiIndex) {
      const titles: string[] = [];

      // Add wildcard patterns if present
      if (indexMeta.wildcardPatterns?.length) {
        titles.push(...indexMeta.wildcardPatterns);
      }

      // Add exact indices if present
      if (indexMeta.selectedTitles?.length) {
        titles.push(...indexMeta.selectedTitles);
      }

      if (titles.length > 0) {
        datasetTitle = titles.join(',');
      }
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
            engineType: dataSourceEngineType,
            version: dataSourceVersion ?? '',
          }
        : DEFAULT_DATA.STRUCTURES.LOCAL_DATASOURCE,
    } as Dataset;
  },

  fetch: async (services, path) => {
    const dataStructure = path[path.length - 1];
    switch (dataStructure.type) {
      case 'DATA_SOURCE': {
        const indices = await fetchAllIndices(dataStructure, services.http); // contains all indices

        // Defensively stash the engine type + version (carried on the DATA_SOURCE node's meta) onto
        // each child INDEX leaf, so `toDataset` can recover them even if the DATA_SOURCE node's meta
        // does not survive to selection time.
        const dataSourceMeta = dataStructure.meta as DataStructureCustomMeta | undefined;

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
              dataSourceEngineType: dataSourceMeta?.dataSourceEngineType,
              dataSourceVersion: dataSourceMeta?.dataSourceVersion,
            },
          })),
        };
      }

      default: {
        const dataSources = await fetchDataSources(services.savedObjects.client, services.http);
        const datasetService = getQueryService().queryString.getDatasetService();
        const filteredDataSources = dataSources.filter((ds) => {
          const meta = ds.meta as DataStructureCustomMeta | undefined;
          if (!meta?.dataSourceEngineType && !meta?.dataSourceVersion) return true;
          const fakeDataset: Dataset = {
            id: ds.id,
            title: ds.title,
            type: DEFAULT_DATA.SET_TYPES.INDEX,
            dataSource: {
              id: ds.id,
              title: ds.title,
              type: meta.dataSourceEngineType ?? '',
              engineType: meta.dataSourceEngineType,
              version: meta.dataSourceVersion ?? '',
            },
          };
          return datasetService.isDatasetAllowed(fakeDataset, services.appName);
        });
        return {
          ...dataStructure,
          columnHeader: 'Data sources',
          hasNext: true,
          children: filteredDataSources,
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
      savedObject?.attributes?.dataSourceEngineType === DataSourceEngineType.OpenSearch ||
      savedObject?.attributes?.dataSourceEngineType === DataSourceEngineType.AnalyticEngine
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

  // Always carry the engine type + version through CUSTOM meta so `toDataset` can populate
  // `dataSource.engineType`/`dataSource.version` for per-dataset language gating. Merge the
  // cross-cluster-search icon when remote connections exist.
  const meta: DataStructureCustomMeta = {
    type: DATA_STRUCTURE_META_TYPES.CUSTOM,
    dataSourceEngineType: savedObject.attributes.dataSourceEngineType,
    dataSourceVersion: savedObject.attributes.dataSourceVersion,
    ...(relevantRemoteConnections && relevantRemoteConnections.length > 0
      ? {
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
      : {}),
  };

  return {
    id: dataSourceId,
    title: dataSourceTitle,
    type: 'DATA_SOURCE',
    remoteConnections: relevantRemoteConnections,
    meta,
  };
};

interface ResolveIndexResponse {
  indices?: Array<{ name: string; attributes?: string[] }>;
  aliases?: Array<{ name: string }>;
  data_streams?: Array<{ name: string }>;
}

const fetchIndices = async (dataStructure: DataStructure, http: HttpSetup): Promise<string[]> => {
  try {
    const query: any = {};

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
