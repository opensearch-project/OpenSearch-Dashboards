/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { DataExplorerPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new DataExplorerPlugin();
}
export { DataExplorerPluginSetup, DataExplorerPluginStart, ViewRedirectParams } from './types';
export { ViewMountParameters, ViewDefinition } from './services/view_service';
