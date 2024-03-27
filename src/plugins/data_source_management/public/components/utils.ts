/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpStart,
  SavedObjectsClientContract,
  SavedObject,
  IUiSettingsClient,
} from 'src/core/public';
import {
  DataSourceAttributes,
  DataSourceTableItem,
  defaultAuthType,
  noAuthCredentialAuthMethod,
} from '../types';
import { AuthenticationMethodRegistry } from '../auth_registry';

export async function getDataSources(savedObjectsClient: SavedObjectsClientContract) {
  return savedObjectsClient
    .find({
      type: 'data-source',
      fields: ['id', 'description', 'title'],
      perPage: 10000,
    })
    .then(
      (response) =>
        response?.savedObjects?.map?.((source) => {
          const id = source.id;
          const title = source.get('title');
          const description = source.get('description');

          return {
            id,
            title,
            description,
            sort: `${title}`,
          };
        }) || []
    );
}

export async function getDataSourcesWithFields(
  savedObjectsClient: SavedObjectsClientContract,
  fields: string[]
): Promise<Array<SavedObject<DataSourceAttributes>>> {
  const response = await savedObjectsClient.find<DataSourceAttributes>({
    type: 'data-source',
    fields,
    perPage: 10000,
  });

  return response?.savedObjects;
}

export async function handleSetDefaultDatasource(
  savedObjectsClient: SavedObjectsClientContract,
  uiSettings: IUiSettingsClient
) {
  if (uiSettings.get('defaultDataSource', null) === null) {
    return await setFirstDataSourceAsDefault(savedObjectsClient, uiSettings, false);
  }
}

export async function setFirstDataSourceAsDefault(
  savedObjectsClient: SavedObjectsClientContract,
  uiSettings: IUiSettingsClient,
  exists: boolean
) {
  if (exists) {
    uiSettings.remove('defaultDataSource');
  }
  const listOfDataSources: DataSourceTableItem[] = await getDataSources(savedObjectsClient);
  if (Array.isArray(listOfDataSources) && listOfDataSources.length >= 1) {
    const datasourceId = listOfDataSources[0].id;
    return await uiSettings.set('defaultDataSource', datasourceId);
  }
}

export async function getDataSourceById(
  id: string,
  savedObjectsClient: SavedObjectsClientContract
) {
  return savedObjectsClient.get('data-source', id).then((response) => {
    const attributes: any = response?.attributes || {};
    return {
      id: response.id,
      title: attributes.title,
      endpoint: attributes.endpoint,
      description: attributes.description || '',
      auth: attributes.auth,
    };
  });
}

export async function createSingleDataSource(
  savedObjectsClient: SavedObjectsClientContract,
  attributes: DataSourceAttributes
) {
  return savedObjectsClient.create('data-source', attributes);
}

export async function updateDataSourceById(
  savedObjectsClient: SavedObjectsClientContract,
  id: string,
  attributes: DataSourceAttributes
) {
  return savedObjectsClient.update('data-source', id, attributes);
}

export async function deleteDataSourceById(
  id: string,
  savedObjectsClient: SavedObjectsClientContract
) {
  return savedObjectsClient.delete('data-source', id);
}

export async function deleteMultipleDataSources(
  savedObjectsClient: SavedObjectsClientContract,
  selectedDataSources: DataSourceTableItem[]
) {
  await Promise.all(
    selectedDataSources.map(async (selectedDataSource) => {
      await deleteDataSourceById(selectedDataSource.id, savedObjectsClient);
    })
  );
}

export async function testConnection(
  http: HttpStart,
  { endpoint, auth: { type, credentials } }: DataSourceAttributes,
  dataSourceID?: string
) {
  const query: any = {
    id: dataSourceID,
    dataSourceAttr: {
      endpoint,
      auth: {
        type,
        credentials,
      },
    },
  };

  await http.post(`/internal/data-source-management/validate`, {
    body: JSON.stringify(query),
  });
}

export async function fetchDataSourceVersion(
  http: HttpStart,
  { endpoint, auth: { type, credentials } }: DataSourceAttributes,
  dataSourceID?: string
) {
  const query: any = {
    id: dataSourceID,
    dataSourceAttr: {
      endpoint,
      auth: {
        type,
        credentials,
      },
    },
  };

  return await http.post(`/internal/data-source-management/fetchDataSourceVersion`, {
    body: JSON.stringify(query),
  });
}

export const isValidUrl = (endpoint: string) => {
  try {
    const url = new URL(endpoint);
    return Boolean(url) && (url.protocol === 'http:' || url.protocol === 'https:');
  } catch (e) {
    return false;
  }
};

export const getDefaultAuthMethod = (
  authenticationMethodRegistry: AuthenticationMethodRegistry
) => {
  const registeredAuthMethods = authenticationMethodRegistry.getAllAuthenticationMethods();

  const defaultAuthMethod =
    registeredAuthMethods.length > 0
      ? authenticationMethodRegistry.getAuthenticationMethod(registeredAuthMethods[0].name)
      : noAuthCredentialAuthMethod;

  const initialSelectedAuthMethod =
    authenticationMethodRegistry.getAuthenticationMethod(defaultAuthType) ?? defaultAuthMethod;

  return initialSelectedAuthMethod;
};

export const extractRegisteredAuthTypeCredentials = (
  currentCredentialState: { [key: string]: string },
  authType: string,
  authenticationMethodRegistry: AuthenticationMethodRegistry
) => {
  const registeredCredentials = {} as { [key: string]: string };
  const registeredCredentialField =
    authenticationMethodRegistry.getAuthenticationMethod(authType)?.credentialFormField ?? {};

  Object.keys(registeredCredentialField).forEach((credentialField) => {
    registeredCredentials[credentialField] =
      currentCredentialState[credentialField] ?? registeredCredentialField[credentialField];
  });

  return registeredCredentials;
};
