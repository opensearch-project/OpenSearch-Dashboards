/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import {
  DATA_STRUCTURE_META_TYPES,
  DEFAULT_DATA,
  DataSourceMeta,
  DataStructure,
  DataStructureCustomMeta,
  Dataset,
  DatasetField,
  OPENSEARCH_SQL_FIELD_TYPES,
  castSQLTypeToOSDFieldType,
} from '../../../data/common';
import { DatasetTypeConfig, IDataPluginServices } from '../../../data/public';
import { API, DATASET, handleQueryStatus } from '../../common';
import S3_ICON from '../assets/s3_mark.svg';

export const s3TypeConfig: DatasetTypeConfig = {
  id: DATASET.S3,
  title: 'S3 Connections',
  meta: {
    icon: { type: S3_ICON },
    tooltip: 'Amazon S3 Connections',
  },

  toDataset: (path: DataStructure[]): Dataset => {
    const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');
    const connection = path.find((ds) => ds.type === 'CONNECTION');
    const database = path.find((ds) => ds.type === 'DATABASE');
    const table = path[path.length - 1];

    return {
      id: table.id,
      title: `${connection?.title}.${database?.title}.${table.title}`,
      type: DATASET.S3,
      dataSource: dataSource
        ? {
            id: dataSource.id,
            title: dataSource.title,
            type: dataSource.type,
            meta: table.meta as DataSourceMeta,
          }
        : DEFAULT_DATA.STRUCTURES.LOCAL_DATASOURCE,
    };
  },

  fetch: async (services: IDataPluginServices, path: DataStructure[]): Promise<DataStructure> => {
    const dataStructure = path[path.length - 1];
    const {
      http,
      savedObjects: { client },
    } = services;

    switch (dataStructure.type) {
      case 'DATA_SOURCE': {
        const connections = await fetchConnections(http, dataStructure);
        return {
          ...dataStructure,
          hasNext: true,
          columnHeader: 'Connections',
          children: connections,
        };
      }
      case 'CONNECTION': {
        const databases = await fetchDatabases(http, path);
        return {
          ...dataStructure,
          columnHeader: 'Databases',
          hasNext: true,
          children: databases,
        };
      }
      case 'DATABASE': {
        const tables = await fetchTables(http, path);
        return {
          ...dataStructure,
          columnHeader: 'Tables',
          hasNext: false,
          children: tables,
        };
      }
      default: {
        const dataSources = await fetchDataSources(client);
        return {
          ...dataStructure,
          columnHeader: 'Clusters',
          hasNext: true,
          children: dataSources,
        };
      }
    }
  },

  fetchFields: async (services: IDataPluginServices, dataset: Dataset): Promise<DatasetField[]> => {
    const { http } = services;
    return fetchFields(http, dataset);
  },

  supportedLanguages: (dataset: Dataset): string[] => {
    return ['SQL'];
  },
};

const fetch = async (
  http: HttpSetup,
  path: DataStructure[],
  type: 'DATABASE' | 'TABLE'
): Promise<DataStructure[]> => {
  const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');
  const connection = path.find((ds) => ds.type === 'CONNECTION');
  const parent = path[path.length - 1];
  const meta = parent.meta as DataStructureCustomMeta;

  try {
    const response = await handleQueryStatus({
      fetchStatus: () =>
        http.fetch({
          method: 'GET',
          path: trimEnd(`${API.DATA_SOURCE.ASYNC_JOBS}`),
          query: {
            id: dataSource?.id,
            queryId: meta.queryId,
          },
        }),
    });

    return response.datarows.map((item: string[]) => ({
      id: `${parent.id}.${item[type === 'DATABASE' ? 0 : 1]}`,
      title: item[type === 'DATABASE' ? 0 : 1],
      type,
      meta: {
        type: DATA_STRUCTURE_META_TYPES.CUSTOM,
        sessionId: meta.sessionId,
        name: connection?.title,
      } as DataStructureCustomMeta,
    }));
  } catch (error) {
    throw error;
  }
};

const setMeta = (dataStructure: DataStructure, response: any) => {
  return {
    ...dataStructure.meta,
    queryId: response.queryId,
    sessionId: response.sessionId,
  } as DataStructureCustomMeta;
};

const fetchDataSources = async (client: SavedObjectsClientContract): Promise<DataStructure[]> => {
  const resp = await client.find<any>({
    type: 'data-source',
    perPage: 10000,
  });
  const dataSources: DataStructure[] = [DEFAULT_DATA.STRUCTURES.LOCAL_DATASOURCE];
  return dataSources.concat(
    resp.savedObjects.map((savedObject) => ({
      id: savedObject.id,
      title: savedObject.attributes.title,
      type: 'DATA_SOURCE',
      meta: {
        query: {
          id: savedObject.id,
        },
        type: DATA_STRUCTURE_META_TYPES.CUSTOM,
      } as DataStructureCustomMeta,
    }))
  );
};

const fetchConnections = async (
  http: HttpSetup,
  dataSource: DataStructure
): Promise<DataStructure[]> => {
  const abortController = new AbortController();
  const query =
    dataSource.id !== '' ? (dataSource.meta as DataStructureCustomMeta).query : undefined;
  const response = await http.fetch({
    method: 'GET',
    path: trimEnd(`${API.DATA_SOURCE.CONNECTIONS}/${query?.id || ''}`),
    signal: abortController.signal,
  });

  return response
    .filter((ds: any) => ds.connector === 'S3GLUE')
    .map((ds: any) => ({
      id: `${dataSource.id}::${ds.name}`,
      title: ds.name,
      type: 'CONNECTION',
      meta: {
        query,
        type: DATA_STRUCTURE_META_TYPES.CUSTOM,
      } as DataStructureCustomMeta,
    }));
};

const fetchDatabases = async (http: HttpSetup, path: DataStructure[]): Promise<DataStructure[]> => {
  const abortController = new AbortController();
  const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');
  const connection = path[path.length - 1];
  const meta = connection.meta as DataStructureCustomMeta;
  const response = await http.fetch({
    method: 'POST',
    path: trimEnd(`${API.DATA_SOURCE.ASYNC_JOBS}`),
    body: JSON.stringify({
      lang: 'sql',
      query: `SHOW DATABASES in ${connection.title}`,
      datasource: connection?.title,
      ...(meta.sessionId && { sessionId: meta.sessionId }),
    }),
    query: {
      id: dataSource?.id,
    },
    signal: abortController.signal,
  });

  connection.meta = setMeta(connection, response);

  return fetch(http, path, 'DATABASE');
};

const fetchTables = async (http: HttpSetup, path: DataStructure[]): Promise<DataStructure[]> => {
  const abortController = new AbortController();
  const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');
  const connection = path.find((ds) => ds.type === 'CONNECTION');
  const sessionId = (connection?.meta as DataStructureCustomMeta).sessionId;
  const database = path[path.length - 1];
  const response = await http.fetch({
    method: 'POST',
    path: trimEnd(`${API.DATA_SOURCE.ASYNC_JOBS}`),
    body: JSON.stringify({
      lang: 'sql',
      query: `SHOW TABLES in ${database.title}`,
      datasource: connection?.title,
      ...(sessionId && { sessionId }),
    }),
    query: {
      id: dataSource?.id,
    },
    signal: abortController.signal,
  });

  database.meta = setMeta(database, response);

  return fetch(http, path, 'TABLE');
};

// Function to process the input and map types using the new SQL to OSD mapping
export function mapResponseToFields(sqlOutput: {
  status: string;
  schema: Array<{ name: string; type: string }>;
  datarows: Array<Array<string | null>>;
  total: number;
  size: number;
}): DatasetField[] {
  return sqlOutput.datarows
    .filter((row) => row[1] && row[1] !== '') // Filter out rows with empty types
    .map((row) => {
      const [name, type] = row;
      const sqlType = type as OPENSEARCH_SQL_FIELD_TYPES; // Cast the type to SQL_TYPES enum
      return {
        name: name as string,
        type: castSQLTypeToOSDFieldType(sqlType),
      };
    });
}

const fetchFields = async (http: HttpSetup, dataset: Dataset): Promise<DatasetField[]> => {
  const abortController = new AbortController();
  try {
    const connection = (dataset.dataSource?.meta as DataStructureCustomMeta).name;
    const sessionId = (dataset.dataSource?.meta as DataStructureCustomMeta).sessionId;
    const response = await http.fetch({
      method: 'POST',
      path: trimEnd(`${API.DATA_SOURCE.ASYNC_JOBS}`),
      body: JSON.stringify({
        lang: 'sql',
        query: `DESCRIBE TABLE ${dataset.title}`,
        datasource: connection,
        ...(sessionId && { sessionId }),
      }),
      query: {
        id: dataset.dataSource?.id,
      },
      signal: abortController.signal,
    });
    const fetchResponse = await handleQueryStatus({
      fetchStatus: () =>
        http.fetch({
          method: 'GET',
          path: trimEnd(`${API.DATA_SOURCE.ASYNC_JOBS}`),
          query: {
            id: dataset.dataSource?.id,
            queryId: response.queryId,
          },
        }),
    });
    return mapResponseToFields(fetchResponse);
  } catch (error) {
    throw error;
  }
};
