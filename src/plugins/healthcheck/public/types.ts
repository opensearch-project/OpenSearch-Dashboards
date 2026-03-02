/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../navigation/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HealtcheckPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HealtcheckPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
