/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CspConfigurationProviderPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CspConfigurationProviderPluginStart {}

export interface CspClient {
  exists(configurationName: string): Promise<boolean>;

  get(configurationName: string, cspRulesName: string): Promise<string>;
}
