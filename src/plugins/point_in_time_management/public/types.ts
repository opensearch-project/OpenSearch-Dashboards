/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart, ChromeStart } from 'opensearch-dashboards/public';
import { NavigationPublicPluginStart } from '../../navigation/public';
import { ManagementSetup } from '../../management/public';

export interface PointInTimeManagementContext {
  chrome: ChromeStart;
  application: ApplicationStart;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PointInTimeManagementPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PointInTimeManagementPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

export interface SetupDependencies {
  management: ManagementSetup;
}
