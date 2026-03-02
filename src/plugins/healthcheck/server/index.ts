/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/server';
import { HealtcheckPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new HealtcheckPlugin(initializerContext);
}

export { HealtcheckPluginSetup, HealtcheckPluginStart } from './types';
