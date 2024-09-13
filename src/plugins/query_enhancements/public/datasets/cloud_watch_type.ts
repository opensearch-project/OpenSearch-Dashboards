/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import {
  Dataset,
  DataStructure,
  DataStructureCustomMeta,
  DEFAULT_DATA,
} from '../../../data/common';
import { DatasetTypeConfig } from '../../../data/public';
import type { DataConnectionSavedObjectAttributes } from '../../../data_source/common/data_connections';
import CLOUD_WATCH_ICON from '../assets/cloud_watch_mark.svg';
import { DATASET } from '../../common';

export const cloudWatchTypeConfig: DatasetTypeConfig = {
  id: DATASET.CLOUD_WATCH,
  title: 'CloudWatch Logs',
  meta: {
    icon: { type: CLOUD_WATCH_ICON },
    tooltip: 'Amazon CloudWatch Logs',
  },

  toDataset: (path) => {
    const index = path[path.length - 1];
    const dataConnection = path.find((ds) => ds.type === 'DATA_CONNECTION');
    const indexMeta = index.meta as DataStructureCustomMeta;
    if (!dataConnection) {
      throw new Error('Data connection is required for cloudwatch config.');
    }

    return {
      id: index.id,
      title: index.title,
      type: DATASET.CLOUD_WATCH,
      timeFieldName: indexMeta?.timeFieldName,
      dataConnection: {
        id: dataConnection.id,
        title: dataConnection.title,
        type: dataConnection.type,
      },
    };
  },

  fetch: async (services, path) => {
    const currDataStructure = path[path.length - 1];
    switch (currDataStructure.type) {
      case 'DATA_CONNECTION': {
        const logGroups = Array.from({ length: 30 }, (_, i) => `test${i + 1}`);
        return {
          ...currDataStructure,
          hasNext: false,
          columnHeader: 'Log groups',
          multiSelect: true,
          children: logGroups.map((indexName) => ({
            id: `${currDataStructure.id}::${indexName}`,
            title: indexName,
            type: 'LOG_GROUP',
          })),
        };
      }

      case DATASET.CLOUD_WATCH:
      default: {
        const dataConnections = await fetchDataConnections(services.savedObjects.client);
        return {
          ...currDataStructure,
          columnHeader: 'Connnection',
          hasNext: true,
          children: dataConnections,
        };
      }
    }
  },

  fetchFields: async (dataset) => {
    /* const fields = await getIndexPatterns().getFieldsForWildcard({
      pattern: dataset.title,
      dataSourceId: dataset.dataSource?.id,
    });
    return fields.map((field: any) => ({
      name: field.name,
      type: field.type,
    })); */
    return [
      { name: 'test-field', type: 'string' },
      { name: 'date-test', type: 'date' },
    ];
  },

  supportedLanguages: (dataset: Dataset): string[] => {
    return ['SQL'];
  },
};

const fetchDataConnections = async (client: SavedObjectsClientContract) => {
  const response = await client.find<DataConnectionSavedObjectAttributes>({
    type: 'data-connection',
    perPage: 10000,
  });
  const dataConnections: DataStructure[] = response.savedObjects
    .filter((savedObject) => savedObject.attributes.type === 'AWS CloudWatch') // this is {@link DataConnectionType.CloudWatch}
    .map((savedObject) => ({
      id: savedObject.id,
      title: savedObject.attributes.connectionId,
      type: 'DATA_CONNECTION',
    }));
  return dataConnections;
};
