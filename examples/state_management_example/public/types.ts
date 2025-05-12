/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StateManagementExamplePluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StateManagementExamplePluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
