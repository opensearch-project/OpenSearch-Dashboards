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
import { ManagementAppMountParams, ManagementSetup } from 'src/plugins/management/public';

import { OpenSearchDashboardsReactContextValue } from '../../opensearch_dashboards_react/public';

export interface CredentialManagementSetupDependencies {
  management: ManagementSetup;
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
