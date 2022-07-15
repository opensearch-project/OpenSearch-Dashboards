/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
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
  // TODO: Refactor it
  data: DataPublicPluginStart;
  credentialManagementStart: CredentialManagementStart;
  setBreadcrumbs: ManagementAppMountParams['setBreadcrumbs'];
}

export type CredentialManagmentContextValue = OpenSearchDashboardsReactContextValue<
  CredentialManagementContext
>;
