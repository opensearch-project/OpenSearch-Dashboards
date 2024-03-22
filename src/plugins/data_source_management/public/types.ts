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
import { i18n } from '@osd/i18n';
import { SigV4ServiceName } from '../../data_source/common/data_sources';
import { OpenSearchDashboardsReactContextValue } from '../../opensearch_dashboards_react/public';
import { AuthenticationMethodRegistery } from './auth_registry';

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
  authenticationMethodRegistery: AuthenticationMethodRegistery;
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
  success?: boolean;
}

export type DataSourceManagementContextValue = OpenSearchDashboardsReactContextValue<
  DataSourceManagementContext
>;

/* Datasource types */
export enum AuthType {
  NoAuth = 'no_auth',
  UsernamePasswordType = 'username_password',
  SigV4 = 'sigv4',
}

export const defaultAuthType = AuthType.UsernamePasswordType;

export const noAuthCredentialOption = {
  value: AuthType.NoAuth,
  inputDisplay: i18n.translate('dataSourceManagement.credentialSourceOptions.NoAuthentication', {
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
  inputDisplay: i18n.translate('dataSourceManagement.credentialSourceOptions.UsernamePassword', {
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
  inputDisplay: i18n.translate('dataSourceManagement.credentialSourceOptions.AwsSigV4', {
    defaultMessage: 'AWS SigV4',
  }),
};

export const sigV4ServiceOptions = [
  {
    value: SigV4ServiceName.OpenSearch,
    inputDisplay: i18n.translate('dataSourceManagement.SigV4ServiceOptions.OpenSearch', {
      defaultMessage: 'Amazon OpenSearch Service',
    }),
  },
  {
    value: SigV4ServiceName.OpenSearchServerless,
    inputDisplay: i18n.translate('dataSourceManagement.SigV4ServiceOptions.OpenSearchServerless', {
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

export interface DataSourceAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  endpoint?: string;
  dataSourceVersion?: string;
  auth: {
    type: AuthType | string;
    credentials:
      | UsernamePasswordTypedContent
      | SigV4Content
      | { [key: string]: string }
      | undefined;
  };
}

export interface UsernamePasswordTypedContent extends SavedObjectAttributes {
  username: string;
  password?: string;
}

export interface SigV4Content extends SavedObjectAttributes {
  accessKey: string;
  secretKey: string;
  region: string;
  service?: SigV4ServiceName;
}
