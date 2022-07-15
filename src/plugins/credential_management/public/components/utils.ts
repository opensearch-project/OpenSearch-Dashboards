/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { Credential } from '../../common';
import { CredentialsTableItem } from './types';

export async function getCredentials(
  savedObjectsClient: SavedObjectsClientContract,
  defaultIndex: string
) {
  return await (savedObjectsClient
    .find<Credential.ICredential>({
      type: 'credential',
      fields: ['id', 'title', 'credential_type'],
      perPage: 10000,
    })
    .then((response) =>
      response.savedObjects
        .map((source) => {
          const id = source.id;
          const title = source.get('title');
          const credentialType = source.get('credential_type');
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
  // TODO: Refactor it
  selectedCredentials.forEach(function (selectedCredential) {
    savedObjectsClient.delete('credential', selectedCredential.id);
  });
}
