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

export interface CredentialsComboBoxItem {
  checked: boolean | 'on' | 'off' | null;
  id: string;
  title: string;
  description: string;
  credentialtype: string;
  label: string;
}

export interface CreateDataSourceFormType {
  title: string;
  description: string;
  endpoint: string;
  credentialId: string;
  credentialType: string;
  newCredential?: CreateNewCredentialType;
}

export interface EditDataSourceFormType {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  credentialId: string;
  credentialType: string;
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

export enum CredentialSourceType {
  CreateCredential = 'createCredential',
  ExistingCredential = 'existingCredential',
  NoAuth = 'noAuth',
}

export interface CreateNewCredentialType {
  title: string;
  description: string;
  credentialMaterials: {
    credentialMaterialsType: string;
    credentialMaterialsContent: {
      username: string;
      password: string;
    };
  };
}
