/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DataSourcePluginSetup {
  dataSourceEnabled: boolean;
  hideLocalCluster: boolean;
  noAuthenticationTypeEnabled: boolean;
  usernamePasswordAuthEnabled: boolean;
  awsSigV4AuthEnabled: boolean;
}

export interface DataSourcePluginStart {
  dataSourceEnabled: boolean;
  hideLocalCluster: boolean;
  noAuthenticationTypeEnabled: boolean;
  usernamePasswordAuthEnabled: boolean;
  awsSigV4AuthEnabled: boolean;
}
