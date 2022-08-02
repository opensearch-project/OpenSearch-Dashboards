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
  HttpSetup,
} from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { NavigationPublicPluginStart } from '../../navigation/public';
import { ManagementAppMountParams } from '../../management/public';

import { CredentialManagementStart } from './index';
import { OpenSearchDashboardsReactContextValue } from '../../opensearch_dashboards_react/public';

export interface CredentialManagementPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CredentialManagementPluginStart {}

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
  http: HttpSetup;
  docLinks: DocLinksStart;
  data: DataPublicPluginStart;
  credentialManagementStart: CredentialManagementStart;
  setBreadcrumbs: ManagementAppMountParams['setBreadcrumbs'];
}

export type CredentialManagmentContextValue = OpenSearchDashboardsReactContextValue<
  CredentialManagementContext
>;
