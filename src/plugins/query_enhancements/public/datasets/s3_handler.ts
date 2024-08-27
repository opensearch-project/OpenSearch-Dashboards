/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DataStructure, Dataset, DatasetField } from 'src/plugins/data/common';
import { DatasetTypeConfig } from 'src/plugins/data/public';

const S3_ICON = 'visTable';
const S3_ID = 'S3';

export const s3TypeConfig: DatasetTypeConfig = {
  id: S3_ID,
  title: S3_ID,
  meta: {
    icon: { type: S3_ICON },
    tooltip: 'S3 Data Source',
  },

  toDataset: (path: DataStructure[]): Dataset => {
    const s3 = path[path.length - 1];
    const dataSource = path.find((ds) => ds.type === S3_ID);

    return {
      id: s3.id,
      title: s3.title,
      type: S3_ID,
      dataSource: dataSource
        ? {
            id: dataSource.id,
            title: dataSource.title,
            type: dataSource.type,
          }
        : undefined,
    };
  },

  fetch: async (
    savedObjects: SavedObjectsClientContract,
    path: DataStructure[]
  ): Promise<DataStructure> => {
    const dataStructure = path[path.length - 1];
    switch (dataStructure.type) {
      case S3_ID:
        return {
          ...dataStructure,
          columnHeader: 'Connections',
          hasNext: true,
          children: [
            {
              id: `${dataStructure.id}::mys3`,
              title: 'mys3',
              type: 'CONNECTION',
            },
          ],
        };
      case 'CONNECTION':
        return {
          ...dataStructure,
          columnHeader: 'Databases',
          hasNext: true,
          children: [
            {
              id: `${dataStructure.id}.defaultDb`,
              title: 'defaultDb',
              type: 'DATABASE',
            },
          ],
        };
      case 'DATABASE':
        return {
          ...dataStructure,
          columnHeader: 'Tables',
          hasNext: false,
          children: [
            {
              id: `${dataStructure.id}.table1`,
              title: 'table1',
              type: 'TABLE',
            },
            {
              id: `${dataStructure.id}.table2`,
              title: 'table2',
              type: 'TABLE',
            },
          ],
        };
      default:
        const s3DataSources = await fetchS3DataSources(savedObjects);
        return {
          ...dataStructure,
          columnHeader: 'S3 Data Sources',
          hasNext: false,
          children: s3DataSources,
        };
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

const fetchS3DataSources = async (client: SavedObjectsClientContract): Promise<DataStructure[]> => {
  return [];
};
