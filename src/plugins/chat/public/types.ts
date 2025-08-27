/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { NavigationPublicPluginStart } from '../../navigation/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ChatPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ChatPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
