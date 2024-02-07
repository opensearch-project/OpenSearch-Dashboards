/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DataSourcePluginSetup {
  dataSourceEnabled: boolean;
  defaultClusterEnabled: boolean;
}

export interface DataSourcePluginStart {
  dataSourceEnabled: boolean;
  defaultClusterEnabled: boolean;
}
