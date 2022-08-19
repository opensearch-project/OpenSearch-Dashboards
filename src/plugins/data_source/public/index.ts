/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourcePublicPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new DataSourcePublicPlugin();
}

export { DataSourcePublicPluginSetup, DataSourcePublicPluginStart } from './types';

export {
  CredentialMaterialsType,
  CredentialSavedObjectAttributes,
  CredentialMaterials,
  UsernamePasswordTypedContent,
  CREDENTIAL_SAVED_OBJECT_TYPE,
} from '../common';
