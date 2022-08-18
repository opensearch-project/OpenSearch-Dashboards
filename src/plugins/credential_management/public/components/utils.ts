/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { CredentialsTableItem } from './types';

export async function getCredentials(savedObjectsClient: SavedObjectsClientContract) {
  return await (savedObjectsClient
    .find({
      type: 'credential',
      fields: ['id', 'title', 'credentialMaterials'],
      perPage: 10000,
    })
    .then((response) =>
      response.savedObjects
        .map((source) => {
          const id = source.id;
          const title = source.get('title');
          const credentialMaterialsType = source.get('credentialMaterials')
            ?.credentialMaterialsType;
          return {
            id,
            title,
            credentialMaterialsType,
            sort: `${title}`,
          };
        })
        .sort((a, b) => {
          if (a.sort < b.sort) {
            return -1;
          }

          if (a.sort > b.sort) {
            return 1;
          }

          return 0;
        })
    ) || []);
}

export async function deleteCredentials(
  savedObjectsClient: SavedObjectsClientContract,
  selectedCredentials: CredentialsTableItem[]
) {
  await Promise.all(
    selectedCredentials.map(async (selectedCredential) => {
      await savedObjectsClient.delete('credential', selectedCredential.id);
    })
  );
}
