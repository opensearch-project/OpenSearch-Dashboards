/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DEFAULT_DATA, DataStructure, Dataset, DatasetField } from 'src/plugins/data/common';
import { DatasetTypeConfig, IDataPluginServices } from 'src/plugins/data/public';
import { DATASET } from '../../common';

const S3_ICON = 'visTable';

export const s3TypeConfig: DatasetTypeConfig = {
  id: DATASET.S3,
  title: DATASET.S3,
  meta: {
    icon: { type: S3_ICON },
    tooltip: 'S3 Data Source',
  },

  toDataset: (path: DataStructure[]): Dataset => {
    const s3 = path[path.length - 1];
    const dataSource = path.find((ds) => ds.type === DATASET.S3);

    return {
      id: s3.id,
      title: s3.title,
      type: DATASET.S3,
      dataSource: dataSource
        ? {
            id: dataSource.id,
            title: dataSource.title,
            type: dataSource.type,
          }
        : undefined,
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
        const databases = await fetchDatabases(http, dataStructure);
        return {
          ...dataStructure,
          columnHeader: 'Databases',
          hasNext: true,
          children: databases.map((db) => ({
            id: `${dataStructure.id}.${db}`,
            title: db,
            type: 'DATABASE',
          })),
        };
      }
      case 'DATABASE': {
        const tables = await fetchTables(http, dataStructure);
        return {
          ...dataStructure,
          columnHeader: 'Tables',
          hasNext: false,
          children: tables.map((table) => ({
            id: `${dataStructure.id}.${table}`,
            title: table,
            type: 'TABLE',
          })),
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

  fetchFields: async (dataset: Dataset): Promise<DatasetField[]> => {
    // This is a placeholder. You'll need to implement the actual logic to fetch S3 fields.
    // For now, we'll return an empty array.
    return [];
  },

  supportedLanguages: (): string[] => {
    return ['sql']; // Assuming S3 only supports SQL queries
  },
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
    }))
  );
};

const fetchConnections = async (
  http: HttpSetup,
  dataSource: DataStructure
): Promise<DataStructure[]> => {
  const response = await http.fetch(`../../api/enhancements/datasource/external`, {
    query: {
      id: dataSource.id,
    },
  });

  return response
    .filter((cluster: { connector: string }) => cluster.connector === 'S3GLUE')
    .map((cluster: { name: any }) => ({
      id: `${dataSource.id}::${cluster.name}`,
      title: cluster.name,
      type: 'CONNECTION',
      dataSource,
    }));
};

const fetchDatabases = async (http: HttpSetup, connection: DataStructure): Promise<string[]> => {
  const response = await http.fetch(`../../api/enhancements/datasource/external`, {
    query: {
      id: `SHOW DATABASES IN ${connection}`,
    },
  });
  return ['database1', 'database2'];
};

const fetchTables = async (http: HttpSetup, database: DataStructure): Promise<string[]> => {
  // Implement logic to fetch tables for the given S3 database
  // This might involve querying the S3 metadata or a catalog service
  return ['table1', 'table2']; // Placeholder
};
