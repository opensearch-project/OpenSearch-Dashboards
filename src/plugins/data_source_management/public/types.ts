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
  WorkspacesStart,
} from 'src/core/public';
import { ManagementAppMountParams } from 'src/plugins/management/public';
import { i18n } from '@osd/i18n';
import { EuiComboBoxOptionOption } from '@elastic/eui';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { AuthType } from '../../data_source/common/data_sources';
import { SigV4ServiceName } from '../../data_source/common/data_sources';
import { OpenSearchDashboardsReactContextValue } from '../../opensearch_dashboards_react/public';
import { AuthenticationMethodRegistry } from './auth_registry';

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
  navigation: NavigationPublicPluginStart;
  setBreadcrumbs: ManagementAppMountParams['setBreadcrumbs'];
  authenticationMethodRegistry: AuthenticationMethodRegistry;
  workspaces: WorkspacesStart;
}

export enum DataSourceConnectionType {
  OpenSearchConnection,
  DirectQueryConnection,
}

export interface DataSourceTableItem {
  id: string;
  type?: string;
  title: string;
  parentId?: string;
  connectionType?: DataSourceConnectionType;
  description?: string;
  sort?: string;
  relatedConnections?: DataSourceTableItem[];
  // This is used to identify the type of the data connection saved object
  objectType?: string;
}

/**
 * @deprecated Use `DataSourceManagementToastMessageItem` instead.
 */
export interface ToastMessageItem {
  id: string;
  defaultMessage: string;
  success?: boolean;
}

export interface DataSourceManagementToastMessageItem {
  message: string;
  success?: boolean;
}

export type DataSourceManagementContextValue = OpenSearchDashboardsReactContextValue<
  DataSourceManagementContext
>;

export const defaultAuthType = AuthType.UsernamePasswordType;

export const noAuthCredentialOption = {
  value: AuthType.NoAuth,
  inputDisplay: i18n.translate('dataSourcesManagement.credentialSourceOptions.NoAuthentication', {
    defaultMessage: 'No authentication',
  }),
};

export const noAuthCredentialField = {};

export const noAuthCredentialAuthMethod = {
  name: AuthType.NoAuth,
  credentialSourceOption: noAuthCredentialOption,
  credentialFormField: noAuthCredentialField,
};

export const usernamePasswordCredentialOption = {
  value: AuthType.UsernamePasswordType,
  inputDisplay: i18n.translate('dataSourcesManagement.credentialSourceOptions.UsernamePassword', {
    defaultMessage: 'Username & Password',
  }),
};

export const usernamePasswordCredentialField = {
  username: '',
  password: '',
};

export const usernamePasswordAuthMethod = {
  name: AuthType.UsernamePasswordType,
  credentialSourceOption: usernamePasswordCredentialOption,
  credentialFormField: usernamePasswordCredentialField,
};

export const sigV4CredentialOption = {
  value: AuthType.SigV4,
  inputDisplay: i18n.translate('dataSourcesManagement.credentialSourceOptions.AwsSigV4', {
    defaultMessage: 'AWS SigV4',
  }),
};

export const sigV4ServiceOptions = [
  {
    value: SigV4ServiceName.OpenSearch,
    inputDisplay: i18n.translate('dataSourcesManagement.SigV4ServiceOptions.OpenSearch', {
      defaultMessage: 'Amazon OpenSearch Service',
    }),
  },
  {
    value: SigV4ServiceName.OpenSearchServerless,
    inputDisplay: i18n.translate('dataSourcesManagement.SigV4ServiceOptions.OpenSearchServerless', {
      defaultMessage: 'Amazon OpenSearch Serverless',
    }),
  },
];

export const sigV4CredentialField = {
  region: '',
  accessKey: '',
  secretKey: '',
  service: SigV4ServiceName.OpenSearch,
};

export const sigV4AuthMethod = {
  name: AuthType.SigV4,
  credentialSourceOption: sigV4CredentialOption,
  credentialFormField: sigV4CredentialField,
};

export const credentialSourceOptions = [
  noAuthCredentialOption,
  usernamePasswordCredentialOption,
  sigV4CredentialOption,
];

export interface MenuPanelItem {
  name?: string;
  disabled: boolean;
}

export {
  AuthType,
  UsernamePasswordTypedContent,
  SigV4Content,
  DataSourceAttributes,
  DataSourceError,
} from '../../data_source/common/data_sources';

// Direct Query datasources types
export type DirectQueryDatasourceType = 'S3GLUE' | 'PROMETHEUS';

export type DirectQueryDatasourceStatus = 'ACTIVE' | 'DISABLED';

export type AuthMethod = 'noauth' | 'basicauth' | 'awssigv4';

export type Role = EuiComboBoxOptionOption;

export interface S3GlueProperties {
  'glue.indexstore.opensearch.uri': string;
  'glue.indexstore.opensearch.region': string;
}

export interface PrometheusProperties {
  'prometheus.uri': string;
}

export interface DirectQueryDatasourceDetails {
  allowedRoles: string[];
  name: string;
  connector: DirectQueryDatasourceType;
  description: string;
  properties: S3GlueProperties | PrometheusProperties;
  status: DirectQueryDatasourceStatus;
}

export interface PermissionsConfigurationProps {
  roles: Role[];
  selectedRoles: Role[];
  setSelectedRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  layout: 'horizontal' | 'vertical';
  hasSecurityAccess: boolean;
}
