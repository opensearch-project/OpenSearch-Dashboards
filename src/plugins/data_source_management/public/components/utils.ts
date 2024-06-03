/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import {
  HttpStart,
  SavedObjectsClientContract,
  SavedObject,
  IUiSettingsClient,
  ToastsStart,
  ApplicationStart,
  CoreStart,
} from 'src/core/public';
import { deepFreeze } from '@osd/std';
import uuid from 'uuid';
import {
  DataSourceAttributes,
  DataSourceTableItem,
  defaultAuthType,
  noAuthCredentialAuthMethod,
} from '../types';
import { AuthenticationMethodRegistry } from '../auth_registry';
import { DataSourceOption } from './data_source_menu/types';
import { DataSourceGroupLabelOption } from './data_source_menu/types';
import { createGetterSetter } from '../../../opensearch_dashboards_utils/public';
import { toMountPoint } from '../../../opensearch_dashboards_react/public';
import { getManageDataSourceButton, getReloadButton } from './toast_button';
import {
  ADD_COMPATIBLE_DATASOURCES_MESSAGE,
  CONNECT_DATASOURCES_MESSAGE,
  NO_COMPATIBLE_DATASOURCES_MESSAGE,
  NO_DATASOURCES_CONNECTED_MESSAGE,
  DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
} from './constants';
import {
  DataSourceSelectionService,
  defaultDataSourceSelection,
} from '../service/data_source_selection_service';

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
  if (getDefaultDataSourceId(uiSettings) === null) {
    return await setFirstDataSourceAsDefault(savedObjectsClient, uiSettings, false);
  }
}

export async function setFirstDataSourceAsDefault(
  savedObjectsClient: SavedObjectsClientContract,
  uiSettings: IUiSettingsClient,
  exists: boolean
) {
  if (exists) {
    uiSettings.remove(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID);
  }
  const listOfDataSources: DataSourceTableItem[] = await getDataSources(savedObjectsClient);
  if (Array.isArray(listOfDataSources) && listOfDataSources.length >= 1) {
    const datasourceId = listOfDataSources[0].id;
    return await uiSettings.set(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID, datasourceId);
  }
}

export interface HandleNoAvailableDataSourceErrorProps {
  changeState: () => void;
  notifications: ToastsStart;
  incompatibleDataSourcesExist: boolean;
  application?: ApplicationStart;
  callback?: (ds: DataSourceOption[]) => void;
}

export function handleNoAvailableDataSourceError(props: HandleNoAvailableDataSourceErrorProps) {
  const { changeState, notifications, application, callback, incompatibleDataSourcesExist } = props;

  const defaultMessage = incompatibleDataSourcesExist
    ? `${NO_COMPATIBLE_DATASOURCES_MESSAGE} ${ADD_COMPATIBLE_DATASOURCES_MESSAGE}`
    : `${NO_DATASOURCES_CONNECTED_MESSAGE} ${CONNECT_DATASOURCES_MESSAGE}`;

  changeState();
  if (callback) callback([]);
  notifications.add({
    title: i18n.translate('dataSource.noAvailableDataSourceError', { defaultMessage }),
    text: toMountPoint(getManageDataSourceButton(application)),
    color: 'warning',
  });
}

export function getFilteredDataSources(
  dataSources: Array<SavedObject<DataSourceAttributes>>,
  filter = (ds: SavedObject<DataSourceAttributes>) => true
): DataSourceOption[] {
  return dataSources
    .filter((ds) => filter!(ds))
    .map((ds) => ({
      id: ds.id,
      label: ds.attributes?.title || '',
    }))
    .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
}

export function getDefaultDataSourceId(uiSettings?: IUiSettingsClient) {
  if (!uiSettings) return null;
  return uiSettings.get<string | null>(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID, null);
}

export function getDefaultDataSourceId$(uiSettings?: IUiSettingsClient) {
  if (!uiSettings) return null;
  return uiSettings.get$<string | null>(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID, null);
}

export function getDefaultDataSource(
  dataSourcesOptions: DataSourceOption[],
  LocalCluster: DataSourceOption,
  defaultDataSourceId: string | null,
  hideLocalCluster?: boolean
) {
  const defaultDataSourceAfterCheck = dataSourcesOptions.find(
    (dataSource) => dataSource.id === defaultDataSourceId
  );
  if (defaultDataSourceAfterCheck) {
    return [
      {
        id: defaultDataSourceAfterCheck.id,
        label: defaultDataSourceAfterCheck.label,
      },
    ];
  }

  if (!hideLocalCluster) {
    return [LocalCluster];
  }

  if (dataSourcesOptions.length > 0) {
    return [
      {
        id: dataSourcesOptions[0].id,
        label: dataSourcesOptions[0].label,
      },
    ];
  }
  return [];
}

export async function getDataSourceById(
  id: string,
  savedObjectsClient: SavedObjectsClientContract
) {
  const response = await savedObjectsClient.get('data-source', id);

  if (!response || response.error) {
    throw new Error('Unable to find data source');
  }

  const attributes: any = response?.attributes || {};
  return {
    id: response.id,
    title: attributes.title,
    endpoint: attributes.endpoint,
    description: attributes.description || '',
    auth: attributes.auth,
  };
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

export async function fetchDataSourceMetaData(
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

  return await http.post(`/internal/data-source-management/fetchDataSourceMetaData`, {
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

export const handleDataSourceFetchError = (
  changeState: (state: { showError: boolean }) => void,
  notifications: ToastsStart,
  callback?: (ds: DataSourceOption[]) => void
) => {
  changeState({ showError: true });
  if (callback) callback([]);
  notifications.add({
    title: i18n.translate('dataSource.fetchDataSourceError', {
      defaultMessage: 'Failed to fetch data sources',
    }),
    text: toMountPoint(getReloadButton()),
    color: 'danger',
  });
};

interface DataSourceOptionGroupLabel {
  [key: string]: DataSourceGroupLabelOption;
}

export const dataSourceOptionGroupLabel = deepFreeze<Readonly<DataSourceOptionGroupLabel>>({
  opensearchCluster: {
    id: 'opensearchClusterGroupLabel',
    label: 'OpenSearch cluster',
    isGroupLabel: true,
  },
  // TODO: add other group labels if needed
});

export const [getApplication, setApplication] = createGetterSetter<ApplicationStart>('Application');
export const [getUiSettings, setUiSettings] = createGetterSetter<CoreStart['uiSettings']>(
  'UiSettings'
);

export interface HideLocalCluster {
  enabled: boolean;
}

export const [getHideLocalCluster, setHideLocalCluster] = createGetterSetter<HideLocalCluster>(
  'HideLocalCluster'
);

// This will maintain an unified data source selection instance among components and export it to other plugin.
const [getDataSourceSelectionInstance, setDataSourceSelection] = createGetterSetter<
  DataSourceSelectionService
>('DataSourceSelectionService');

const getDataSourceSelection = () => {
  try {
    // Usually set will be executed in the setup of DSM.
    return getDataSourceSelectionInstance();
  } catch (e) {
    // Since createGetterSetter doesn't support default value and will throw error if not found.
    // As dataSourceSelection isn't main part of data selector, will use a default to fallback safely.
    return defaultDataSourceSelection;
  }
};
export { getDataSourceSelection, setDataSourceSelection };

export const generateComponentId = () => {
  return uuid.v4();
};
