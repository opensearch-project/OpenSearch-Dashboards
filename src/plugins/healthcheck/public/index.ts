/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { HealtcheckPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new HealtcheckPlugin();
}
export { HealtcheckPluginSetup, HealtcheckPluginStart } from './types';
