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
import { ManagementAppMountParams } from 'src/plugins/management/public';
import { SavedObjectAttributes } from 'src/core/types';
import { OpenSearchDashboardsReactContextValue } from '../../opensearch_dashboards_react/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourceManagementPluginStart {}

export interface DataSourceManagementContext {
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

export interface DataSourceTableItem {
  id: string;
  title: string;
  description: string;
  sort: string;
}

export interface ToastMessageItem {
  id: string;
  defaultMessage: string;
  color: 'primary' | 'success' | 'warning' | 'danger';
  iconType: string;
}

export type DataSourceManagementContextValue = OpenSearchDashboardsReactContextValue<
  DataSourceManagementContext
>;

export interface UpdatePasswordFormType {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/* Datasource types */
export enum AuthType {
  NoAuth = 'no_auth',
  UsernamePasswordType = 'username_password',
}

export const credentialSourceOptions = [
  { value: AuthType.UsernamePasswordType, inputDisplay: 'Username & Password' },
  { value: AuthType.NoAuth, inputDisplay: 'No authentication' },
];

export interface DataSourceAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  endpoint?: string;
  auth: {
    type: AuthType;
    credentials: UsernamePasswordTypedContent | undefined;
  };
}

export interface UsernamePasswordTypedContent extends SavedObjectAttributes {
  username: string;
  password?: string;
}
