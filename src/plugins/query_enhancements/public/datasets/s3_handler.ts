/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { Observable, Subscription, timer } from 'rxjs';
import { filter, map, mergeMap, takeWhile } from 'rxjs/operators';
import {
  DATA_STRUCTURE_META_TYPES,
  DEFAULT_DATA,
  DataStructure,
  DataStructureCustomMeta,
  Dataset,
  DatasetField,
} from '../../../data/common';
import { DatasetTypeConfig, IDataPluginServices } from '../../../data/public';
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

  fetchFields: async (dataset: Dataset): Promise<DatasetField[]> => {
    // Implement field fetching logic here
    return [];
  },

  supportedLanguages: (dataset: Dataset): string[] => {
    return ['SQL']; // Assuming S3 only supports SQL queries
  },
};

const fetch = (
  http: HttpSetup,
  path: DataStructure[],
  type: 'DATABASE' | 'TABLE'
): Observable<DataStructure[]> => {
  const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');
  const parent = path[path.length - 1];
  const meta = parent.meta as DataStructureCustomMeta;

  return timer(0, 5000).pipe(
    mergeMap(() =>
      http.fetch('../../api/enhancements/datasource/jobs', {
        query: {
          id: dataSource?.id,
          queryId: meta.query.id,
        },
      })
    ),
    takeWhile((response) => response.status !== 'SUCCESS' && response.status !== 'FAILED', true),
    filter((response) => response.status === 'SUCCESS'),
    map((response) => {
      if (response.status === 'FAILED') {
        throw new Error('Job failed');
      }
      return response.datarows.map((item: string[]) => ({
        id: `${parent.id}.${item[type === 'DATABASE' ? 0 : 1]}`,
        title: item[type === 'DATABASE' ? 0 : 1],
        type,
        meta: {
          type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          query: meta.query,
          session: meta.session,
        } as DataStructureCustomMeta,
      }));
    })
  );
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
  const query = (dataSource.meta as DataStructureCustomMeta).query;
  const response = await http.fetch(`../../api/enhancements/datasource/external`, {
    query,
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
  const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');
  const connection = path[path.length - 1];
  const query = (connection.meta as DataStructureCustomMeta).query;
  const jobResponse = await http.post(`../../api/enhancements/datasource/jobs`, {
    body: JSON.stringify({
      lang: 'sql',
      query: `SHOW DATABASES in ${connection.title}`,
      datasource: dataSource?.title,
    }),
    query,
  });

  connection.meta = {
    ...connection.meta,
    query: {
      id: jobResponse.queryId,
    },
    session: {
      id: jobResponse.sessionId,
    },
  } as DataStructureCustomMeta;

  return new Promise((resolve, reject) => {
    const subscription: Subscription = fetch(http, path, 'DATABASE').subscribe({
      next: (dataStructures) => {
        subscription.unsubscribe();
        resolve(dataStructures);
      },
      error: (error) => {
        subscription.unsubscribe();
        reject(error);
      },
    });
  });
};

const fetchTables = async (http: HttpSetup, path: DataStructure[]): Promise<DataStructure[]> => {
  const dataSource = path.find((ds) => ds.type === 'DATA_SOURCE');
  const database = path[path.length - 1];
  const jobResponse = await http.post(`../../api/enhancements/datasource/jobs`, {
    body: JSON.stringify({
      lang: 'sql',
      query: `SHOW TABLES in ${database.title}`,
      datasource: dataSource?.title,
    }),
    query: {
      id: dataSource?.id,
    },
  });

  database.meta = {
    ...database.meta,
    query: {
      id: jobResponse.queryId,
    },
    session: {
      id: jobResponse.sessionId,
    },
  } as DataStructureCustomMeta;

  return new Promise((resolve, reject) => {
    const subscription: Subscription = fetch(http, path, 'TABLE').subscribe({
      next: (dataStructures) => {
        subscription.unsubscribe();
        resolve(dataStructures);
      },
      error: (error) => {
        subscription.unsubscribe();
        reject(error);
      },
    });
  });
};
