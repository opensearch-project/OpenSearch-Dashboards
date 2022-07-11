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
      fields: ['id', 'credential_name', 'credential_type'],
      perPage: 10000,
    })
    .then((response) =>
      response.savedObjects
        .map((source) => {
          const id = source.id;
          const title = source.get('title');
          const credentialName = source.get('credential_name');
          const credentialType = source.get('credential_type');
          return {
            id,
            title,
            credentialName,
            credentialType,
            sort: `${credentialName}`,
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
  selectedCredentials: CredentialsTableItem[]) {
  selectedCredentials.forEach(function (selectedCredential) {
    savedObjectsClient.delete('credential', selectedCredential.id);
  });
}
