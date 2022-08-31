/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { CreateNewCredentialType, CredentialSourceType, DataSourceTableItem } from '../types';

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
      let credentialId: string = '';
      if (response?.references?.length) {
        response.references.forEach((rec) => {
          if (rec.name === 'credential') {
            credentialId = rec.id;
          }
        });
      }
      return {
        id: response.id,
        title: attributes.title,
        endpoint: attributes.endpoint,
        description: attributes.description || '',
        credentialId: attributes.noAuth ? CredentialSourceType.NoAuth : credentialId,
        credentialType: credentialId
          ? CredentialSourceType.ExistingCredential
          : CredentialSourceType.NoAuth,
      };
    }) || null
  );
}

export async function createSingleDataSource(
  savedObjectsClient: SavedObjectsClientContract,
  attributes: { title: string; description: string; endpoint: string; noAuth: boolean },
  options?: { references: any[] }
) {
  return savedObjectsClient.create('data-source', attributes, options);
}

export async function updateDataSourceById(
  savedObjectsClient: SavedObjectsClientContract,
  id: string,
  attributes: { title: string; description: string; endpoint: string; noAuth: boolean },
  options?: { references: any[] }
) {
  return savedObjectsClient.update('data-source', id, attributes, options);
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

export async function createNewCredential(
  savedObjectsClient: SavedObjectsClientContract,
  newCredential: CreateNewCredentialType
) {
  return (
    savedObjectsClient.create('credential', newCredential).then((response) => response.id || '') ||
    null
  );
}

export async function getExistingCredentials(savedObjectsClient: SavedObjectsClientContract) {
  const type: string = 'credential';
  const fields: string[] = ['id', 'description', 'title', 'credentialMaterials'];
  const perPage: number = 10000;
  return savedObjectsClient.find({ type, fields, perPage }).then(
    (response) =>
      response.savedObjects.map((source) => {
        const id = source.id;
        const title = source.get('title');
        const description = source.get('description');
        const credentialtype = source.get('credentialMaterials')?.credentialMaterialsType;
        return {
          id,
          title,
          description,
          credentialtype,
          label: `${title}`,
          checked: null,
        };
      }) || []
  );
}

export const isValidUrl = (endpoint: string) => {
  try {
    return Boolean(new URL(endpoint));
  } catch (e) {
    return false;
  }
};
