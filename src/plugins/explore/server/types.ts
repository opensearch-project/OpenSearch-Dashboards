/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginSetup } from 'src/plugins/data/server';
import { DataSourcePluginSetup } from 'src/plugins/data_source/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExplorePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExplorePluginStart {}

export interface ExplorePluginSetupDependencies {
  data: PluginSetup;
  dataSource?: DataSourcePluginSetup;
}
