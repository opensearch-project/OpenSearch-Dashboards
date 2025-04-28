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
  NotificationsStart,
  HttpSetup,
} from 'src/core/public';
import { deepFreeze } from '@osd/std';
import uuid from 'uuid';
import {
  DataSourceAttributes,
  DataSourceConnectionType,
  DataSourceTableItem,
  DirectQueryDatasourceDetails,
  defaultAuthType,
  noAuthCredentialAuthMethod,
} from '../types';
import { UiSettingScope } from '../../../../core/public';
import { AuthenticationMethodRegistry } from '../auth_registry';
import { DataSourceOption } from './data_source_menu/types';
import { DataSourceGroupLabelOption } from './data_source_menu/types';
import { createGetterSetter } from '../../../opensearch_dashboards_utils/public';
import { toMountPoint } from '../../../opensearch_dashboards_react/public';
import { getManageDataSourceButton, getReloadButton } from './toast_button';
import { DatasourceTypeToDisplayName, DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from './constants';
import {
  DataSourceSelectionService,
  defaultDataSourceSelection,
} from '../service/data_source_selection_service';
import { DataSourceError } from '../types';
import { DATACONNECTIONS_BASE, LOCAL_CLUSTER } from '../constants';
import { DataConnectionSavedObjectAttributes } from '../../../data_source/common/data_connections';
import { DataSourceEngineType } from '../../../data_source/common/data_sources';

export const getDirectQueryConnections = async (dataSourceId: string, http: HttpSetup) => {
  const endpoint = `${DATACONNECTIONS_BASE}/dataSourceMDSId=${dataSourceId}`;
  const res = await http.get(endpoint);
  if (!Array.isArray(res)) {
    throw new Error('Unexpected response format: expected an array of direct query connections.');
  }
  const directQueryConnections: DataSourceTableItem[] = res.map(
    (dataConnection: DirectQueryDatasourceDetails) => ({
      id: `${dataSourceId}-${dataConnection.name}`,
      title: dataConnection.name,
      type:
        {
          S3GLUE: DatasourceTypeToDisplayName.S3GLUE,
          PROMETHEUS: DatasourceTypeToDisplayName.PROMETHEUS,
        }[dataConnection.connector] || dataConnection.connector,
      connectionType: DataSourceConnectionType.DirectQueryConnection,
      description: dataConnection.description,
      parentId: dataSourceId,
    })
  );
  return directQueryConnections;
};

export const getRemoteClusterConnections = async (dataSourceId: string, http: HttpSetup) => {
  const response = await http.get(`/api/enhancements/remote_cluster/list`, {
    query: {
      dataSourceId,
    },
  });

  const remoteClusterConnections: DataSourceTableItem[] = response.map(
    (remoteClusterConnection: { connectionAlias: string }) => ({
      id: `${dataSourceId}:${remoteClusterConnection.connectionAlias}`,
      title: remoteClusterConnection.connectionAlias,
      type: DataSourceEngineType.OpenSearchCrossCluster,
      connectionType: DataSourceConnectionType.OpenSearchConnection,
      description: '',
      parentId: dataSourceId,
    })
  );

  return remoteClusterConnections;
};

export const getLocalClusterConnections = async (http: HttpSetup) => {
  const res = await http.get(`${DATACONNECTIONS_BASE}/dataSourceMDSId=`);
  const localClusterConnections: DataSourceTableItem[] = res.map(
    (dataConnection: DirectQueryDatasourceDetails) => ({
      id: `${dataConnection.name}`,
      title: dataConnection.name,
      type:
        {
          S3GLUE: 'Amazon S3',
          PROMETHEUS: 'Prometheus',
        }[dataConnection.connector] || dataConnection.connector,
      connectionType: DataSourceConnectionType.DirectQueryConnection,
      description: dataConnection.description,
      parentId: LOCAL_CLUSTER,
    })
  );
  return localClusterConnections;
};

export const mergeDataSourcesWithConnections = (
  dataSources: DataSourceTableItem[],
  directQueryConnections: DataSourceTableItem[],
  remoteClusterConnections: DataSourceTableItem[],
  localClusterConnections?: DataSourceTableItem[]
): DataSourceTableItem[] => {
  const dataSourcesList: DataSourceTableItem[] = [];
  dataSources.forEach((ds) => {
    const relatedConnections = directQueryConnections.filter(
      (directQueryConnection) => directQueryConnection.parentId === ds.id
    );

    dataSourcesList.push({
      id: ds.id,
      type: ds.type,
      connectionType: DataSourceConnectionType.OpenSearchConnection,
      title: ds.title,
      description: ds.description,
      relatedConnections,
    });
  });

  if (localClusterConnections) {
    dataSourcesList.push({
      id: LOCAL_CLUSTER,
      type: 'OpenSearch',
      connectionType: DataSourceConnectionType.OpenSearchConnection,
      title: LOCAL_CLUSTER,
      relatedConnections: localClusterConnections,
    });
  }

  // Add the remoteCluster Connections to the parent connections as relatedConnections
  return dataSourcesList.map((ds) => {
    const relatedRemoteConnections = remoteClusterConnections.filter(
      (remoteConnection) => remoteConnection.parentId === ds.id
    );

    return {
      ...ds,
      relatedConnections: ds.relatedConnections
        ? ds.relatedConnections.concat(relatedRemoteConnections)
        : relatedRemoteConnections,
    };
  });
};

export const fetchDataSourceConnections = async (
  dataSources: DataSourceTableItem[],
  http: HttpSetup | undefined,
  notifications: NotificationsStart | undefined,
  directQueryTable: boolean,
  hideLocalCluster: boolean = false,
  showRemoteOpensearchConnection: boolean = false
) => {
  try {
    const directQueryConnectionsPromises = dataSources.map((ds) =>
      getDirectQueryConnections(ds.id, http!).catch(() => [])
    );
    const directQueryConnectionsResult = await Promise.all(directQueryConnectionsPromises);
    const directQueryConnections = directQueryConnectionsResult.flat();
    const localClusterConnections =
      directQueryTable && !hideLocalCluster ? await getLocalClusterConnections(http!) : undefined;

    const remoteClusterConnections = showRemoteOpensearchConnection
      ? await fetchRemoteClusterConnections(dataSources, http)
      : [];

    return mergeDataSourcesWithConnections(
      dataSources,
      directQueryConnections,
      remoteClusterConnections,
      localClusterConnections
    );
  } catch (error) {
    notifications?.toasts.addDanger(
      i18n.translate('dataSourcesManagement.fetchDataSourceConnections', {
        defaultMessage: 'Cannot fetch data sources',
      })
    );
    return [];
  }
};

export const fetchRemoteClusterConnections = async (
  dataSources: DataSourceTableItem[],
  http: HttpSetup | undefined
): Promise<DataSourceTableItem[]> => {
  if (!http) {
    return [];
  }

  const remoteClusterConnectionsPromises = dataSources.map((ds) => {
    if (
      ds.type === DataSourceEngineType.OpenSearch ||
      ds.type === DataSourceEngineType.Elasticsearch
    ) {
      return getRemoteClusterConnections(ds.id, http).catch(() => []); // Incase of error, return empty array
    }
    return [];
  });
  const remoteClusterConnections = (await Promise.all(remoteClusterConnectionsPromises)).flat();

  return remoteClusterConnections;
};

export async function getDataSources(savedObjectsClient: SavedObjectsClientContract) {
  return savedObjectsClient
    .find({
      type: 'data-source',
      fields: [
        'id',
        'description',
        'title',
        'dataSourceVersion',
        'dataSourceEngineType',
        'installedPlugins',
      ],
      perPage: 10000,
    })
    .then(
      (response) =>
        response?.savedObjects?.map?.((source) => {
          const id = source.id;
          const title = source.get('title');
          const description = source.get('description');
          const datasourceversion = source.get('dataSourceVersion');
          const type = source.get('dataSourceEngineType');
          const installedplugins = source.get('installedPlugins');

          return {
            id,
            title,
            description,
            sort: `${title}`,
            datasourceversion,
            type,
            installedplugins,
          };
        }) || []
    );
}

export async function getDataConnections(savedObjectsClient: SavedObjectsClientContract) {
  return savedObjectsClient
    .find<DataConnectionSavedObjectAttributes>({
      type: 'data-connection',
      perPage: 10000,
    })
    .then((response) => {
      return response?.savedObjects ?? [];
    });
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
  uiSettings: IUiSettingsClient,
  scope: UiSettingScope
) {
  if (!getDefaultDataSourceId(uiSettings, scope)) {
    return await setFirstDataSourceAsDefault(savedObjectsClient, uiSettings, false, scope);
  }
}

export async function setFirstDataSourceAsDefault(
  savedObjectsClient: SavedObjectsClientContract,
  uiSettings: IUiSettingsClient,
  exists: boolean,
  scope: UiSettingScope
) {
  if (exists) {
    uiSettings.remove(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID, scope);
  }
  const listOfDataSources: DataSourceTableItem[] = await getDataSources(savedObjectsClient);
  if (Array.isArray(listOfDataSources) && listOfDataSources.length >= 1) {
    const datasourceId = listOfDataSources[0].id;
    return await uiSettings.set(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID, datasourceId, scope);
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

  const notificationTitle = incompatibleDataSourcesExist
    ? i18n.translate('dataSourcesManagement.noCompatibleDataSourceError', {
        defaultMessage: 'No compatible data sources are available. Add a compatible data source.',
      })
    : i18n.translate('dataSourcesManagement.noAvailableDataSourceError', {
        defaultMessage: 'No data sources connected yet. Connect your data sources to get started.',
      });

  changeState();
  if (callback) callback([]);
  notifications.add({
    title: notificationTitle,
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

export function getDefaultDataSourceId(uiSettings?: IUiSettingsClient, scope?: UiSettingScope) {
  if (!uiSettings) return null;
  // if specify the scope, then we will call getUserProvided to request from server
  // otherwise, we will call get to get defaultDataSource stored in cache
  if (scope)
    return uiSettings.getUserProvided<string | null>(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID, scope);
  return uiSettings.get<string | null>(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID);
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
    const statusCode = response.error?.statusCode;
    if (statusCode === 404) {
      throw new DataSourceError({ statusCode, body: 'Unable to find data source' });
    }
    throw new DataSourceError({ statusCode, body: response.error?.message });
  }

  const attributes: any = response?.attributes || {};
  return {
    id: response.id,
    title: attributes.title,
    endpoint: attributes.endpoint,
    description: attributes.description || '',
    auth: attributes.auth,
    datasourceversion: attributes.dataSourceVersion,
    installedplugins: attributes.installedPlugins,
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
    title: i18n.translate('dataSourcesManagement.error.fetchDataSources', {
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

export const formatError = (name: string, message: string, details: string) => {
  return {
    name,
    message,
    body: {
      attributes: {
        error: {
          caused_by: {
            type: '',
            reason: details,
          },
        },
      },
    },
  };
};

export const isPluginInstalled = async (
  pluginId: string,
  notifications: NotificationsStart,
  http: HttpStart
): Promise<boolean> => {
  try {
    const response = await http.get('/api/status');
    // Check if response.status and response.status.statuses exist before using them
    if (response && response.status && Array.isArray(response.status.statuses)) {
      const pluginExists = response.status.statuses.some((status: { id: string }) =>
        status.id.includes(pluginId)
      );
      return pluginExists;
    }
    return false;
  } catch (error) {
    notifications.toasts.addDanger(`Error checking ${pluginId} Plugin Installation status.`);
    // eslint-disable-next-line no-console
    console.error(error);
    return false;
  }
};
