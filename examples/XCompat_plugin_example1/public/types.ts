/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface ExamplePlugin1PluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExamplePlugin1PluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
