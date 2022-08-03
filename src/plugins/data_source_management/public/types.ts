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
import { ManagementAppMountParams, ManagementSetup } from 'src/plugins/management/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourceManagementPluginStart {}

export interface DataSourceManagementSetupDependencies {
  management: ManagementSetup;
}

export interface DataSourceManagmentContext {
  chrome: ChromeStart;
  application: ApplicationStart;
  savedObjects: SavedObjectsStart;
  uiSettings: IUiSettingsClient;
  notifications: NotificationsStart;
  overlays: OverlayStart;
  http: HttpSetup;
  docLinks: DocLinksStart;
  setBreadcrumbs: ManagementAppMountParams['setBreadcrumbs'];
}
