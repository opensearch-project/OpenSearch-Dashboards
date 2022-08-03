/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChromeStart,
  ApplicationStart,
  IUiSettingsClient,
  OverlayStart,
  SavedObjectsStart,
  NotificationsStart,
  DocLinksStart,
} from 'src/core/public';
import { NavigationPublicPluginStart } from '../../navigation/public';
import { ManagementAppMountParams } from '../../management/public';

import { OpenSearchDashboardsReactContextValue } from '../../opensearch_dashboards_react/public';

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

export interface CredentialManagementContext {
  chrome: ChromeStart;
  application: ApplicationStart;
  savedObjects: SavedObjectsStart;
  uiSettings: IUiSettingsClient;
  notifications: NotificationsStart;
  overlays: OverlayStart;
  docLinks: DocLinksStart;
  setBreadcrumbs: ManagementAppMountParams['setBreadcrumbs'];
}

export type CredentialManagmentContextValue = OpenSearchDashboardsReactContextValue<
  CredentialManagementContext
>;
