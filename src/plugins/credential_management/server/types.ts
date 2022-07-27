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
import { SavedObjectsServiceStart } from 'src/core/server';

export interface CredentialManagementPluginStartDeps {
  savedObjects: SavedObjectsServiceStart;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CredentialManagementPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CredentialManagementPluginStart {}
