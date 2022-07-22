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

import { PluginConfigDescriptor } from 'opensearch-dashboards/server';

import { PluginInitializerContext } from '../../../core/server';
import { CredentialManagementPlugin } from './plugin';
import { configSchema, ConfigSchema } from '../config';

// TODO: Add exposeToBrowser for conditional rendering
export const config: PluginConfigDescriptor<ConfigSchema> = {
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new CredentialManagementPlugin(initializerContext);
}

export { CredentialManagementPluginSetup, CredentialManagementPluginStart } from './types';
export { CryptographySingleton, generateCryptoMaterials } from './crypto';
