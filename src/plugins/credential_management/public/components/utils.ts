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
      fields: ['id', 'title', 'credentialType'],
      perPage: 10000,
    })
    .then((response) =>
      response.savedObjects
        .map((source) => {
          const id = source.id;
          const title = source.get('title');
          const credentialType = source.get('credentialType');
          return {
            id,
            title,
            credentialType,
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
    ) || []);
}

export async function deleteCredentials(
  savedObjectsClient: SavedObjectsClientContract,
  selectedCredentials: CredentialsTableItem[]
) {
  // TODO: Refactor with nonblocking IO
  for (const credential of selectedCredentials) {
    await savedObjectsClient.delete('credential', credential.id);
  }
}
