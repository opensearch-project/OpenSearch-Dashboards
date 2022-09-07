/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { DataSourceTableItem, DataSourceAttributes } from '../types';

export async function getDataSources(savedObjectsClient: SavedObjectsClientContract) {
  return (
    savedObjectsClient
      .find({
        type: 'data-source',
        fields: ['id', 'description', 'title'],
        perPage: 10000,
      })
      .then((response) =>
        response.savedObjects
          .map((source) => {
            const id = source.id;
            const title = source.get('title');
            const description = source.get('description');

            return {
              id,
              title,
              description,
              sort: `${title}`,
            };
          })
          .sort((a, b) => {
            if (a.sort < b.sort) {
              return -1;
            } else if (a.sort > b.sort) {
              return 1;
            } else {
              return 0;
            }
          })
      ) || []
  );
}

export async function getDataSourceById(
  id: string,
  savedObjectsClient: SavedObjectsClientContract
) {
  return (
    savedObjectsClient.get('data-source', id).then((response) => {
      const attributes: any = response?.attributes || {};
      return {
        id: response.id,
        title: attributes.title,
        endpoint: attributes.endpoint,
        description: attributes.description || '',
        auth: attributes.auth,
      };
    }) || null
  );
}

export async function createSingleDataSource(
  savedObjectsClient: SavedObjectsClientContract,
  attributes: DataSourceAttributes
) {
  return savedObjectsClient.create('data-source', attributes);
}

export async function updateDataSourceById(
  savedObjectsClient: SavedObjectsClientContract,
  id: string,
  attributes: DataSourceAttributes
) {
  return savedObjectsClient.update('data-source', id, attributes);
}

export async function deleteDataSourceById(
  id: string,
  savedObjectsClient: SavedObjectsClientContract
) {
  return savedObjectsClient.delete('data-source', id);
}

export async function deleteMultipleDataSources(
  savedObjectsClient: SavedObjectsClientContract,
  selectedDataSources: DataSourceTableItem[]
) {
  await Promise.all(
    selectedDataSources.map(async (selectedDataSource) => {
      await deleteDataSourceById(selectedDataSource.id, savedObjectsClient);
    })
  );
}

export const isValidUrl = (endpoint: string) => {
  try {
    return Boolean(new URL(endpoint));
  } catch (e) {
    return false;
  }
};
