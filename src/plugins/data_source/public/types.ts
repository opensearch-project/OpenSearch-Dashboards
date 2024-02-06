/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DataSourcePluginSetup {
  dataSourceEnabled: boolean;
  defaultClusterEnabled: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourcePluginStart {}
