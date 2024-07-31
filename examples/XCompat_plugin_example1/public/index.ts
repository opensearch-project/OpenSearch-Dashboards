/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { ExamplePlugin1Plugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new ExamplePlugin1Plugin();
}
export { ExamplePlugin1PluginSetup, ExamplePlugin1PluginStart } from './types';
