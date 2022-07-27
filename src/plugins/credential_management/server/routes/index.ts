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

import { IRouter } from '../../../../core/server';
import { registerCreateRoute } from './create';
// import { registerUpdateRoute } from './update';
import { SavedObjectsServiceStart } from 'src/core/server';
import { ICredentialType } from '../../common';

// TODO: Refactor routing strategy https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1850
export function registerRoutes(router: IRouter, saved_object: SavedObjectsServiceStart) {
  registerCreateRoute(router, saved_object);
  // registerUpdateRoute(router, saved_object);
}

export type CredentialAttributes = {
  title: string,
  credentialType: ICredentialType,
  usernamePasswordCredentialMaterials: Record<string, string> | undefined,
  awsIamCredentialMaterials: Record<string, string> | undefined
}

export type EncryptedCredentialAttributes = {
  title: string,
  credential_type: ICredentialType,
  credential_material: any,
}
