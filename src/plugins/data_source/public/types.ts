/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DataSourcePluginSetup {
  dataSourceEnabled: boolean;
  hideLocalCluster: boolean;
  enabledAuthTypes: string[];
}

export interface DataSourcePluginStart {
  dataSourceEnabled: boolean;
  hideLocalCluster: boolean;
  enabledAuthTypes: string[];
}
