/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { Dataset, DataStructure, DataStructureCustomMeta } from '../../../data/common';
import { DatasetTypeConfig } from '../../../data/public';
import type { DataConnectionSavedObjectAttributes } from '../../../data_source/common/data_connections';
import { DATASET } from '../../common';
import CLOUD_WATCH_ICON from '../assets/cloud_watch_mark.svg';

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
      dataSource: {
        id: dataConnection.id,
        title: dataConnection.title,
        type: dataConnection.type,
      },
    };
  },

  fetch: async (services, path, options) => {
    const currDataStructure = path[path.length - 1];
    switch (currDataStructure.type) {
      case 'DATA_CONNECTION': {
        const logGroups = await fetchLogGroups(
          currDataStructure,
          options?.paginationToken,
          options?.search
        );
        const newDataStructure = {
          ...currDataStructure,
          hasNext: false,
          columnHeader: 'Log groups',
          multiSelect: true,
          paginationToken: logGroups.paginationToken,
          children: logGroups.logGroups,
        };
        return newDataStructure;
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

const fetchLogGroups = async (
  current: DataStructure,
  paginationToken?: string,
  search?: string
) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const logGroups = (paginationToken
    ? Array.from({ length: 5 }, (_, i) => `log-group-${i + 5 * Number(paginationToken) + 1}`)
    : Array.from({ length: 5 }, (_, i) => `log-group-${i + 1}`)
  ).map((name) => ({
    id: name,
    title: name,
    type: 'LOG_GROUP',
  }));

  const filteredLogGroups = logGroups.filter((group) => group.title.includes(search || ''));

  return {
    logGroups: paginationToken
      ? [...(current.children || []), ...filteredLogGroups]
      : filteredLogGroups,
    paginationToken: String(Number(paginationToken || '0') + 1),
  };
};
