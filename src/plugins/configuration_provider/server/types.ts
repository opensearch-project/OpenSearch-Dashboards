/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConfigurationProviderPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConfigurationProviderPluginStart {}

export interface ConfigurationClient {
  existsCspRules(): Promise<boolean>;

  getCspRules(): Promise<string>;

  updateCspRules(cspRules: string): Promise<string>;

  deleteCspRules(): Promise<string>;
}
