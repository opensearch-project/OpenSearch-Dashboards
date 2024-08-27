/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIconProps } from '@opensearch-project/oui';
import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DataStructure, Dataset, DatasetField } from '../../../data/common';
import { DatasetTypeConfig } from '../../../data/public';

const S3_INFO = {
  LOCAL_DATASOURCE: {
    id: '',
    title: 'Local Cluster',
    type: 'DATA_SOURCE',
  },
};

export class S3DatasetTypeConfig extends DatasetTypeConfig {
  id = 'S3';
  title = 'S3 Connections';
  meta: { icon: EuiIconProps; tooltip: string } = {
    icon: { type: 'visTable' },
    tooltip: 'Amazon S3 Connections',
  };

  constructor(private readonly http: HttpSetup) {
    super();
  }

  toDataset(path: DataStructure[]): Dataset {
    const s3 = path[path.length - 1];
    const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');

    return {
      id: s3.id,
      title: s3.title,
      type: this.id,
      dataSource: dataSource
        ? {
            id: dataSource.id,
            title: dataSource.title,
            type: dataSource.type,
          }
        : S3_INFO.LOCAL_DATASOURCE,
    };
  }

  async fetch(client: SavedObjectsClientContract, path: DataStructure[]): Promise<DataStructure> {
    const dataStructure = path[path.length - 1];

    switch (dataStructure.type) {
      case 'DATA_SOURCE': {
        const connections = await this.fetchConnections(dataStructure);
        return {
          ...dataStructure,
          hasNext: true,
          columnHeader: 'Connections',
          children: connections,
        };
      }
      case 'CONNECTION': {
        const databases = await this.fetchDatabases(dataStructure);
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
        const tables = await this.fetchTables(dataStructure);
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
        const dataSources = await this.fetchDataSources(client);
        return {
          ...dataStructure,
          columnHeader: 'Clusters',
          hasNext: true,
          children: dataSources,
        };
      }
    }
  }

  async fetchFields(dataset: Dataset): Promise<DatasetField[]> {
    // Implement field fetching logic for S3 datasets
    // This might involve querying the S3 metadata or schema information
    return [];
  }

  supportedLanguages(dataset: Dataset): string[] {
    return ['SQL'];
  }

  private async fetchDataSources(client: SavedObjectsClientContract): Promise<DataStructure[]> {
    const resp = await client.find<any>({
      type: 'data-source',
      perPage: 10000,
    });
    const dataSources: DataStructure[] = [S3_INFO.LOCAL_DATASOURCE];
    return dataSources.concat(
      resp.savedObjects.map((savedObject) => ({
        id: savedObject.id,
        title: savedObject.attributes.title,
        type: 'DATA_SOURCE',
      }))
    );
  }

  private async fetchConnections(dataSource: DataStructure): Promise<DataStructure[]> {
    const response = await this.http.fetch(`../../api/enhancements/datasource/external`, {
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
  }

  private async fetchDatabases(connection: DataStructure): Promise<string[]> {
    // Implement logic to fetch databases for the given S3 connection
    // This might involve querying the S3 metadata or a catalog service
    return ['database1', 'database2']; // Placeholder
  }

  private async fetchTables(database: DataStructure): Promise<string[]> {
    // Implement logic to fetch tables for the given S3 database
    // This might involve querying the S3 metadata or a catalog service
    return ['table1', 'table2']; // Placeholder
  }
}
