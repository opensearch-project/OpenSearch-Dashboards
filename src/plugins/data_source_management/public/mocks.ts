/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { throwError } from 'rxjs';
import { HttpStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { AuthType, DataSourceAttributes, DataSourceTableItem } from './types';
import { coreMock } from '../../../core/public/mocks';
import {
  DataSourceManagementPlugin,
  DataSourceManagementPluginSetup,
  DataSourceManagementPluginStart,
} from './plugin';
import { managementPluginMock } from '../../management/public/mocks';
import { mockManagementPlugin as indexPatternManagementPluginMock } from '../../index_pattern_management/public/mocks';
import { AuthenticationMethod, AuthenticationMethodRegistry } from './auth_registry';
import {
  ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME,
  ACCELERATION_REFRESH_TIME_INTERVAL,
  ACCELERATION_TIME_INTERVAL,
} from '../framework/constants';
import {
  CreateAccelerationForm,
  IntegrationConfig,
  MaterializedViewQueryType,
  SkippingIndexRowType,
} from '../framework/types';
import { AvailableIntegrationsTableProps } from './components/direct_query_data_sources_components/integrations/available_integration_table';
import { navigationPluginMock } from '../../navigation/public/mocks';
import packageInfo from '../../../../package.json';
import { ConfigSchema } from '../config';

export const mockInitializerContext = {
  config: {
    get: jest.fn(
      (): ConfigSchema => ({
        manageableBy: 'all',
        dataSourceAdmin: { groups: [] as string[] },
        dashboardDirectQuerySyncEnabled: false,
      })
    ),
  },
};

export const managementMock = {
  sections: {
    register: jest.fn(),
    section: {
      ingest: {
        registerApp: jest.fn(),
        apps: [],
        getApp: jest.fn(),
        getAppsEnabled: jest.fn(),
        id: 'ingest',
        title: 'Ingest',
        order: 0,
        showExperimentalBadge: false,
        enabled: true,
        disable: jest.fn(),
        enable: jest.fn(),
      },
      data: {
        registerApp: jest.fn(),
        apps: [],
        getApp: jest.fn(),
        getAppsEnabled: jest.fn(),
        id: 'data',
        title: 'Data',
        order: 0,
        showExperimentalBadge: false,
        enabled: true,
        disable: jest.fn(),
        enable: jest.fn(),
      },
      insightsAndAlerting: {
        registerApp: jest.fn(),
        apps: [],
        getApp: jest.fn(),
        getAppsEnabled: jest.fn(),
        id: 'insightsAndAlerting',
        title: 'Insights and Alerting',
        order: 0,
        showExperimentalBadge: false,
        enabled: true,
        disable: jest.fn(),
        enable: jest.fn(),
      },
      security: {
        registerApp: jest.fn(),
        apps: [],
        getApp: jest.fn(),
        getAppsEnabled: jest.fn(),
        id: 'security',
        title: 'Security',
        order: 0,
        showExperimentalBadge: false,
        enabled: true,
        disable: jest.fn(),
        enable: jest.fn(),
      },
      stack: {
        registerApp: jest.fn(),
        apps: [],
        getApp: jest.fn(),
        getAppsEnabled: jest.fn(),
        id: 'stack',
        title: 'Stack',
        order: 0,
        showExperimentalBadge: false,
        enabled: true,
        disable: jest.fn(),
        enable: jest.fn(),
      },
      opensearchDashboards: {
        registerApp: jest.fn(),
        apps: [],
        getApp: jest.fn(),
        getAppsEnabled: jest.fn(),
        id: 'opensearchDashboards',
        title: 'OpenSearch Dashboards',
        order: 0,
        showExperimentalBadge: false,
        enabled: true,
        disable: jest.fn(),
        enable: jest.fn(),
      },
    },
  },
};

export const indexPatternManagementMock = {
  creation: {
    addCreationConfig: jest.fn(),
  },
  list: {
    addListConfig: jest.fn(),
  },
  fieldFormatEditors: {
    register: jest.fn(),
  },
  environment: {
    update: jest.fn(),
  },
  columns: {
    register: jest.fn(),
  },
};

/* Mock Types */

export const docLinks = {
  links: {
    noDocumentation: {
      indexPatterns: {
        introduction: '',
      },
      scriptedFields: {},
    },
  },
};

export const authenticationMethodRegistry = new AuthenticationMethodRegistry();

const createDataSourceManagementContext = () => {
  const {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    workspaces,
  } = coreMock.createStart();
  const { http } = coreMock.createSetup();

  return {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    workspaces,
    http,
    docLinks,
    setBreadcrumbs: () => {},
    authenticationMethodRegistry,
    navigation: navigationPluginMock.createStartContract(),
  };
};

export const mockManagementPlugin = {
  createDataSourceManagementContext,
  docLinks,
};

export const getSingleDataSourceResponse = {
  savedObjects: [
    {
      id: 'test',
      type: 'data-source',
      description: 'test datasource',
      title: 'test',
      get(field: string) {
        const me: any = this || {};
        return me[field];
      },
    },
  ],
};

export const getDataSource = [
  {
    id: '1',
    type: '',
    references: [],
    attributes: {
      title: 'DataSource 1',
      endpoint: '',
      auth: { type: AuthType.NoAuth, credentials: undefined },
      name: AuthType.NoAuth,
      dataSourceVersion: packageInfo.version,
    },
  },
  {
    id: '2',
    type: '',
    references: [],
    attributes: {
      title: 'DataSource 2',
      endpoint: '',
      auth: { type: AuthType.NoAuth, credentials: undefined },
      name: AuthType.NoAuth,
      dataSourceVersion: packageInfo.version,
    },
  },
  {
    id: '3',
    type: '',
    references: [],
    attributes: {
      title: 'DataSource 1',
      endpoint: '',
      auth: { type: AuthType.NoAuth, credentials: undefined },
      name: AuthType.NoAuth,
      dataSourceVersion: packageInfo.version,
    },
  },
];

export const getDataSourceOptions = [
  {
    id: '1',
    label: 'DataSource 1',
  },
  {
    id: '2',
    label: 'DataSource 2',
  },
  {
    id: '3',
    label: 'DataSource 1',
  },
];

/* Mock data responses - JSON*/
export const getDataSourcesResponse = {
  savedObjects: [
    {
      id: 'test',
      type: 'data-source',
      description: 'test datasource',
      title: 'test',
      get(field: string) {
        const me: any = this || {};
        return me[field];
      },
    },
    {
      id: 'test2',
      type: 'data-source',
      description: 'test datasource2',
      title: 'test',
      get(field: string) {
        const me: any = this || {};
        return me[field];
      },
    },
    {
      id: 'alpha-test',
      type: 'data-source',
      description: 'alpha test datasource',
      title: 'alpha-test',
      get(field: string) {
        const me: any = this || {};
        return me[field];
      },
    },
    {
      id: 'beta-test',
      type: 'data-source',
      description: 'beta test datasource',
      title: 'beta-test',
      get(field: string) {
        const me: any = this || {};
        return me[field];
      },
    },
  ],
};

export const getDataSourcesWithFieldsResponse = {
  savedObjects: [
    {
      id: 'test1',
      type: 'data-source',
      attributes: {
        title: 'test1',
        auth: {
          type: AuthType.NoAuth,
        },
      },
    },
    {
      id: 'test2',
      type: 'data-source',
      description: 'test datasource2',
      attributes: {
        title: 'test2',
        auth: {
          type: AuthType.UsernamePasswordType,
        },
      },
    },
    {
      id: 'test3',
      type: 'data-source',
      description: 'test datasource3',
      attributes: {
        title: 'test3',
        auth: {
          type: AuthType.SigV4,
        },
      },
    },
  ],
};

export const remoteClusterConnections: DataSourceTableItem[] = [
  {
    id: 'connectionAlias1',
    type: 'OpenSearch(Cross-cluster search)',
    title: 'connectionAlias1',
    parentId: 'test1',
    description: '',
    connectionType: 0,
  },
  {
    id: 'connectionAlias2',
    type: 'OpenSearch(Cross-cluster search)',
    title: 'connectionAlias2',
    parentId: 'test1',
    description: '',
    connectionType: 0,
  },
];

export const getDataSourcesWithCrossClusterConnections = [
  {
    id: 'test1',
    type: 'OpenSearch',
    title: 'test1',
    connectionType: 'OpenSearchConnection',
    description: 'test datasource1',
    relatedConnections: remoteClusterConnections,
  },
  {
    id: 'test2',
    type: 'OpenSearch',
    description: 'test datasource2',
    title: 'test',
    connectionType: 'OpenSearchConnection',
    sort: 'test',
  },
  {
    id: 'alpha-test',
    type: 'OpenSearch',
    description: 'alpha test datasource',
    title: 'alpha-test',
    connectionType: 'OpenSearchConnection',
    sort: 'alpha-test',
  },
];

export const existingDatasourceNamesList = [
  'test123',
  'testTest20',
  'TeSt',
  'duplicateTest',
  'dup20',
];

export const directQueryConnections: DataSourceTableItem[] = [
  {
    id: 'DQ1',
    type: 'Amazon S3',
    title: 'DQ1',
    parentId: 'test1',
    description: 'DQ1 test resource',
  },
  {
    id: 'DQ2',
    type: 'Amazon S3',
    title: 'DQ2',
    parentId: 'test1',
    description: 'DQ2 test resource',
  },
];

export const getMappedDataSources = [
  {
    id: 'test1',
    type: 'OpenSearch',
    title: 'test1',
    connectionType: 'OpenSearchConnection',
    description: 'test datasource1',
    relatedConnections: directQueryConnections,
  },
  {
    id: 'test2',
    type: 'OpenSearch',
    description: 'test datasource2',
    title: 'test',
    connectionType: 'OpenSearchConnection',
    sort: 'test',
  },
  {
    id: 'alpha-test',
    type: 'OpenSearch',
    description: 'alpha test datasource',
    title: 'alpha-test',
    connectionType: 'OpenSearchConnection',
    sort: 'alpha-test',
  },
  {
    id: 'beta-test',
    type: 'OpenSearch',
    description: 'beta test datasource',
    title: 'beta-test',
    connectionType: 'OpenSearchConnection',
    sort: 'beta-test',
  },
];

export const getMappedDataSourcesWithEmptyDescription = [
  {
    id: 'test-null',
    type: 'OpenSearch',
    title: 'test-null',
    connectionType: 'OpenSearchConnection',
    description: null,
    relatedConnections: directQueryConnections,
  },
  {
    id: 'test-undefined',
    type: 'OpenSearch',
    title: 'test-undefined',
    connectionType: 'OpenSearchConnection',
    description: undefined,
    relatedConnections: directQueryConnections,
  },
  {
    id: 'test-no-description',
    type: 'OpenSearch',
    title: 'test-no-description',
    connectionType: 'OpenSearchConnection',
    // no description
    relatedConnections: directQueryConnections,
  },
];

export const fetchDataSourceMetaData = {
  dataSourceVersion: '2.11.0',
  installedPlugins: ['opensearch-ml', 'opensearch-sql'],
};

export const mockDataSourceAttributesWithAuth = {
  id: 'test',
  title: 'create-test-ds',
  description: 'jest testing',
  endpoint: 'https://test.com',
  auth: {
    type: AuthType.UsernamePasswordType,
    credentials: {
      username: 'test123',
      password: 'test123',
    },
  },
  dataSourceVersion: packageInfo.version,
};

export const mockDataSourceAttributesWithSigV4Auth = {
  id: 'test',
  title: 'create-test-ds',
  description: 'jest testing',
  endpoint: 'https://test.com',
  auth: {
    type: AuthType.SigV4,
    credentials: {
      accessKey: 'test123',
      secretKey: 'test123',
      region: 'us-east-1',
      service: 'es',
    },
  },
};

export const mockDataSourceAttributesWithNoAuth = {
  id: 'test123',
  title: 'create-test-ds123',
  description: 'jest testing',
  endpoint: 'https://test.com',
  auth: {
    type: AuthType.NoAuth,
    credentials: undefined,
  },
};

export const mockDataSourceAttributesWithRegisteredAuth = {
  id: 'testRegisteredAuth',
  title: 'create-test-ds-registered-auth',
  description: 'jest testing',
  endpoint: 'https://test.com',
  auth: {
    type: 'Some Auth Type',
    credentials: {} as { [key: string]: string },
  },
  dataSourceVersion: packageInfo.version,
} as DataSourceAttributes;

export const getDataSourceByIdWithCredential = {
  attributes: {
    id: 'alpha-test',
    title: 'alpha-test',
    endpoint: 'https://test.com',
    description: 'alpha test data source',
    auth: {
      type: AuthType.UsernamePasswordType,
      credentials: {
        username: 'test123',
      },
    },
  },
};

export const getDataSourceByIdWithoutCredential = {
  attributes: {
    ...getDataSourceByIdWithCredential.attributes,
    auth: {
      type: AuthType.NoAuth,
      credentials: undefined,
    },
  },
  references: [],
};

export const getDataSourceByIdWithNotFoundError = {
  attributes: {
    ...getDataSourceByIdWithCredential.attributes,
    Error: {
      statusCode: 404,
      errorMessage: 'Unable to find data source',
    },
  },
  references: [],
};
export const getDataSourceByIdWithNetworkError = {
  attributes: {
    ...getDataSourceByIdWithCredential.attributes,
    Error: {
      statusCode: 500,
      errorMessage: 'Internal server error',
    },
  },
  references: [],
};

export const mockResponseForSavedObjectsCalls = (
  savedObjectsClient: SavedObjectsClientContract,
  savedObjectsMethodName: 'get' | 'find' | 'create' | 'delete' | 'update',
  response: any
) => {
  (savedObjectsClient[savedObjectsMethodName] as jest.Mock).mockResolvedValue(response);
};

export const mockErrorResponseForSavedObjectsCalls = (
  savedObjectsClient: SavedObjectsClientContract,
  savedObjectsMethodName: 'get' | 'find' | 'create' | 'delete' | 'update'
) => {
  (savedObjectsClient[savedObjectsMethodName] as jest.Mock).mockRejectedValue(
    throwError(new Error('Error while fetching data sources'))
  );
};

export const mockUiSettingsCalls = (
  uiSettings: IUiSettingsClient,
  uiSettingsMethodName: 'get' | 'set' | 'get$' | 'getUserProvidedWithScope',
  response: any
) => {
  (uiSettings[uiSettingsMethodName] as jest.Mock).mockReturnValue(response);
};

export interface TestPluginReturn {
  setup: DataSourceManagementPluginSetup;
  doStart: () => DataSourceManagementPluginStart;
}

export const testDataSourceManagementPlugin = (
  coreSetup: any,
  coreStart: any
): TestPluginReturn => {
  const plugin = new DataSourceManagementPlugin(mockInitializerContext);
  const setup = plugin.setup(coreSetup, {
    management: managementPluginMock.createSetupContract(),
    indexPatternManagement: indexPatternManagementPluginMock.createSetupContract(),
    dataSource: {
      dataSourceEnabled: true,
      hideLocalCluster: true,
      noAuthenticationTypeEnabled: true,
      usernamePasswordAuthEnabled: true,
      awsSigV4AuthEnabled: true,
    },
  });
  const doStart = () => {
    const start = plugin.start(coreStart);
    return start;
  };
  return { setup, doStart };
};

export const createAuthenticationMethod = (
  authMethod: Partial<AuthenticationMethod>
): AuthenticationMethod => ({
  name: 'unknown',
  credentialForm: React.createElement('div', {}, 'Hello, world!'),
  credentialSourceOption: {
    value: 'unknown',
  },
  ...authMethod,
});

export const mockDataSourcePluginSetupWithShowLocalCluster: DataSourcePluginSetup = {
  dataSourceEnabled: true,
  hideLocalCluster: false,
  noAuthenticationTypeEnabled: true,
  usernamePasswordAuthEnabled: true,
  awsSigV4AuthEnabled: true,
};

export const mockDataSourcePluginSetupWithHideLocalCluster: DataSourcePluginSetup = {
  ...mockDataSourcePluginSetupWithShowLocalCluster,
  hideLocalCluster: true,
};

// direct query data source mocks
export const skippingIndexDataMock: SkippingIndexRowType[] = [
  {
    id: '1',
    fieldName: 'field1',
    dataType: 'string',
    accelerationMethod: 'PARTITION',
  },
  {
    id: '2',
    fieldName: 'field2',
    dataType: 'number',
    accelerationMethod: 'VALUE_SET',
  },
];

export const coveringIndexDataMock: string[] = ['field1', 'field2', 'field3'];

export const materializedViewEmptyDataMock = {
  columnsValues: [],
  groupByTumbleValue: {
    timeField: '',
    tumbleWindow: 0,
    tumbleInterval: '',
  },
};

export const materializedViewEmptyTumbleDataMock: MaterializedViewQueryType = {
  columnsValues: [
    {
      id: '1',
      functionName: 'count',
      functionParam: 'field1',
    },
  ],
  groupByTumbleValue: {
    timeField: '',
    tumbleWindow: 0,
    tumbleInterval: 'second',
  },
};

export const materializedViewStaleDataMock: MaterializedViewQueryType = {
  columnsValues: [],
  groupByTumbleValue: {
    timeField: 'timestamp',
    tumbleWindow: 10,
    tumbleInterval: 'hour',
  },
};

export const materializedViewValidDataMock: MaterializedViewQueryType = {
  columnsValues: [
    {
      id: '1',
      functionName: 'count',
      functionParam: 'field1',
    },
    {
      id: '2',
      functionName: 'sum',
      functionParam: 'field2',
    },
  ],
  groupByTumbleValue: {
    timeField: 'timestamp',
    tumbleWindow: 5,
    tumbleInterval: 'hour',
  },
};

export const createAccelerationEmptyDataMock: CreateAccelerationForm = {
  dataSource: '',
  dataTable: '',
  database: '',
  dataTableFields: [],
  accelerationIndexType: 'skipping',
  skippingIndexQueryData: [],
  coveringIndexQueryData: [],
  materializedViewQueryData: {
    columnsValues: [],
    groupByTumbleValue: {
      timeField: '',
      tumbleWindow: 0,
      tumbleInterval: '',
    },
  },
  accelerationIndexName: ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME,
  primaryShardsCount: 5,
  replicaShardsCount: 1,
  refreshType: 'autoInterval',
  checkpointLocation: undefined,
  refreshIntervalOptions: {
    refreshWindow: 15,
    refreshInterval: ACCELERATION_REFRESH_TIME_INTERVAL[0].value,
  },
  watermarkDelay: {
    delayWindow: 1,
    delayInterval: ACCELERATION_TIME_INTERVAL[1].value,
  },
  formErrors: {
    dataSourceError: [],
    databaseError: [],
    dataTableError: [],
    skippingIndexError: [],
    coveringIndexError: [],
    materializedViewError: [],
    indexNameError: [],
    primaryShardsError: [],
    replicaShardsError: [],
    refreshIntervalError: [],
    checkpointLocationError: [],
    watermarkDelayError: [],
  },
};

export const indexOptionsMock1: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  primaryShardsCount: 3,
  replicaShardsCount: 2,
  refreshType: 'autoInterval',
  refreshIntervalOptions: {
    refreshWindow: 15,
    refreshInterval: ACCELERATION_REFRESH_TIME_INTERVAL[0].value,
  },
};

export const indexOptionsMockResult1 = `WITH (
index_settings = '{"number_of_shards":3,"number_of_replicas":2}',
auto_refresh = true,
refresh_interval = '15 minutes'
)`;

export const indexOptionsMock2: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  primaryShardsCount: 3,
  replicaShardsCount: 2,
  refreshType: 'autoInterval',
  refreshIntervalOptions: {
    refreshWindow: 10,
    refreshInterval: ACCELERATION_REFRESH_TIME_INTERVAL[1].value,
  },
};

export const indexOptionsMockResult2 = `WITH (
index_settings = '{"number_of_shards":3,"number_of_replicas":2}',
auto_refresh = true,
refresh_interval = '10 hours'
)`;

export const indexOptionsMock3: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  primaryShardsCount: 3,
  replicaShardsCount: 2,
  refreshType: 'autoInterval',
  refreshIntervalOptions: {
    refreshWindow: 10,
    refreshInterval: ACCELERATION_REFRESH_TIME_INTERVAL[1].value,
  },
  checkpointLocation: 's3://path/to/checkpoint',
};

export const indexOptionsMockResult3 = `WITH (
index_settings = '{"number_of_shards":3,"number_of_replicas":2}',
auto_refresh = true,
refresh_interval = '10 hours',
checkpoint_location = 's3://path/to/checkpoint'
)`;

export const indexOptionsMock4: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  primaryShardsCount: 3,
  replicaShardsCount: 2,
  refreshType: 'manual',
};

export const indexOptionsMockResult4 = `WITH (
index_settings = '{"number_of_shards":3,"number_of_replicas":2}',
auto_refresh = false,
incremental_refresh = false
)`;

export const indexOptionsMock5: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  accelerationIndexType: 'materialized',
  primaryShardsCount: 3,
  replicaShardsCount: 2,
  refreshType: 'manual',
  watermarkDelay: {
    delayWindow: 10,
    delayInterval: 'minute',
  },
};

export const indexOptionsMockResult5 = `WITH (
index_settings = '{"number_of_shards":3,"number_of_replicas":2}',
auto_refresh = false,
incremental_refresh = false,
watermark_delay = '10 minutes'
)`;

export const indexOptionsMock7: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  primaryShardsCount: 3,
  replicaShardsCount: 2,
  refreshType: 'manualIncrement',
  checkpointLocation: 's3://ckpt',
};

export const indexOptionsMockResult7 = `WITH (
index_settings = '{"number_of_shards":3,"number_of_replicas":2}',
auto_refresh = false,
incremental_refresh = true,
checkpoint_location = 's3://ckpt'
)`;

export const skippingIndexBuilderMock1: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  dataSource: 'datasource',
  database: 'database',
  dataTable: 'table',
  skippingIndexQueryData: [
    {
      id: '1',
      fieldName: 'field1',
      dataType: 'string',
      accelerationMethod: 'PARTITION',
    },
    {
      id: '2',
      fieldName: 'field2',
      dataType: 'int',
      accelerationMethod: 'VALUE_SET',
    },
    {
      id: '3',
      fieldName: 'field3',
      dataType: 'boolean',
      accelerationMethod: 'MIN_MAX',
    },
  ],
  primaryShardsCount: 9,
  replicaShardsCount: 2,
  refreshType: 'autoInterval',
  refreshIntervalOptions: {
    refreshWindow: 1,
    refreshInterval: 'minute',
  },
  checkpointLocation: 's3://test/',
};

export const indexOptionsMock6: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  primaryShardsCount: 1,
  replicaShardsCount: 1,
  refreshType: 'manual',
  checkpointLocation: 's3://dsfsad/dasda',
};

export const indexOptionsMockResult6 = `WITH (
index_settings = '{"number_of_shards":1,"number_of_replicas":1}',
auto_refresh = false,
incremental_refresh = false
)`;

export const skippingIndexBuilderMockResult1 = `CREATE SKIPPING INDEX
ON datasource.database.table (
   \`field1\` PARTITION, 
   \`field2\` VALUE_SET, 
   \`field3\` MIN_MAX
  ) WITH (
index_settings = '{"number_of_shards":9,"number_of_replicas":2}',
auto_refresh = true,
refresh_interval = '1 minute',
checkpoint_location = 's3://test/'
)`;

export const skippingIndexBuilderMock2: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  dataSource: 'datasource',
  database: 'database',
  dataTable: 'table',
  skippingIndexQueryData: [
    {
      id: '1',
      fieldName: 'field1',
      dataType: 'string',
      accelerationMethod: 'PARTITION',
    },
  ],
  primaryShardsCount: 5,
  replicaShardsCount: 3,
  refreshType: 'manual',
  checkpointLocation: 's3://test/',
};

export const skippingIndexBuilderMockResult2 = `CREATE SKIPPING INDEX
ON datasource.database.table (
   \`field1\` PARTITION
  ) WITH (
index_settings = '{"number_of_shards":5,"number_of_replicas":3}',
auto_refresh = false,
incremental_refresh = false
)`;

export const coveringIndexBuilderMock1: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  dataSource: 'datasource',
  database: 'database',
  dataTable: 'table',
  accelerationIndexName: 'index_name',
  coveringIndexQueryData: ['field1', 'field2', 'field3'],
  primaryShardsCount: 9,
  replicaShardsCount: 2,
  refreshType: 'autoInterval',
  refreshIntervalOptions: {
    refreshWindow: 1,
    refreshInterval: 'minute',
  },
  checkpointLocation: 's3://test/',
};

export const coveringIndexBuilderMockResult1 = `CREATE INDEX index_name
ON datasource.database.table (
   \`field1\`, 
   \`field2\`, 
   \`field3\`
  ) WITH (
index_settings = '{"number_of_shards":9,"number_of_replicas":2}',
auto_refresh = true,
refresh_interval = '1 minute',
checkpoint_location = 's3://test/'
)`;

export const coveringIndexBuilderMock2: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  dataSource: 'datasource',
  database: 'database',
  dataTable: 'table',
  accelerationIndexName: 'index_name',
  coveringIndexQueryData: ['field1'],
  primaryShardsCount: 5,
  replicaShardsCount: 3,
  refreshType: 'manualIncrement',
  checkpointLocation: 's3://test/',
};

export const coveringIndexBuilderMockResult2 = `CREATE INDEX index_name
ON datasource.database.table (
   \`field1\`
  ) WITH (
index_settings = '{"number_of_shards":5,"number_of_replicas":3}',
auto_refresh = false,
incremental_refresh = true,
checkpoint_location = 's3://test/'
)`;

export const materializedViewBuilderMock1: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  dataSource: 'datasource',
  database: 'database',
  dataTable: 'table',
  accelerationIndexType: 'materialized',
  accelerationIndexName: 'index_name',
  materializedViewQueryData: {
    columnsValues: [
      { id: '1', functionName: 'count', functionParam: 'field', fieldAlias: 'counter' },
      { id: '2', functionName: 'count', functionParam: '*', fieldAlias: 'counter1' },
      { id: '3', functionName: 'sum', functionParam: 'field2' },
      { id: '4', functionName: 'avg', functionParam: 'field3', fieldAlias: 'average' },
      { id: '5', functionName: 'window.start', fieldAlias: 'start' },
    ],
    groupByTumbleValue: {
      timeField: 'timestamp',
      tumbleWindow: 1,
      tumbleInterval: 'minute',
    },
  },
  primaryShardsCount: 9,
  replicaShardsCount: 2,
  refreshType: 'autoInterval',
  refreshIntervalOptions: {
    refreshWindow: 1,
    refreshInterval: 'minute',
  },
  watermarkDelay: {
    delayWindow: 1,
    delayInterval: 'minute',
  },
  checkpointLocation: 's3://test/',
};

export const materializedViewBuilderMockResult1 = `CREATE MATERIALIZED VIEW datasource.database.index_name
AS SELECT
   count(\`field\`) AS \`counter\`, 
   count(*) AS \`counter1\`, 
   sum(\`field2\`), 
   avg(\`field3\`) AS \`average\`, 
   window.start AS \`start\`
FROM datasource.database.table
GROUP BY TUMBLE (\`timestamp\`, '1 minute')
 WITH (
index_settings = '{"number_of_shards":9,"number_of_replicas":2}',
auto_refresh = true,
refresh_interval = '1 minute',
watermark_delay = '1 minute',
checkpoint_location = 's3://test/'
)`;

export const materializedViewBuilderMock2: CreateAccelerationForm = {
  ...createAccelerationEmptyDataMock,
  dataSource: 'datasource',
  database: 'database',
  dataTable: 'table',
  accelerationIndexType: 'materialized',
  accelerationIndexName: 'index_name',
  materializedViewQueryData: {
    columnsValues: [{ id: '1', functionName: 'count', functionParam: 'field' }],
    groupByTumbleValue: {
      timeField: 'timestamp',
      tumbleWindow: 2,
      tumbleInterval: 'hour',
    },
  },
  primaryShardsCount: 5,
  replicaShardsCount: 3,
  refreshType: 'manualIncrement',
  checkpointLocation: 's3://test/',
  watermarkDelay: {
    delayWindow: 2,
    delayInterval: 'minute',
  },
};

export const materializedViewBuilderMockResult2 = `CREATE MATERIALIZED VIEW datasource.database.index_name
AS SELECT
   count(\`field\`)
FROM datasource.database.table
GROUP BY TUMBLE (\`timestamp\`, '2 hours')
 WITH (
index_settings = '{"number_of_shards":5,"number_of_replicas":3}',
auto_refresh = false,
incremental_refresh = true,
watermark_delay = '2 minutes',
checkpoint_location = 's3://test/'
)`;

export const mockDatasourcesQuery = {
  data: {
    ok: true,
    resp:
      '[{  "name": "my_glue",  "description": "",  "connector": "S3GLUE",  "allowedRoles": [],  "properties": {      "glue.indexstore.opensearch.uri": "",      "glue.indexstore.opensearch.region": ""  }}]',
  },
};

// direct query data source integration mocks
export const mockHttp: Partial<HttpStart> = {
  basePath: {
    prepend: (url: string) => url,
  },
};

export const availableTableViewData: AvailableIntegrationsTableProps = {
  data: {
    hits: [
      {
        name: 'nginx',
        version: '1.0.1',
        displayName: 'NginX Dashboard',
        description: 'Nginx HTTP server collector',
        license: 'Apache-2.0',
        type: 'logs',
        author: 'John Doe',
        sourceUrl: 'https://github.com/',
        statics: {
          logo: { annotation: 'NginX Logo', path: 'logo.svg' },
          gallery: [
            { annotation: 'NginX Dashboard', path: 'dashboard1.png' },
            { annotation: 'NginX Logo', path: 'logo.svg' },
          ],
        },
        components: [
          { name: 'communication', version: '1.0.0' },
          { name: 'http', version: '1.0.0' },
          { name: 'logs', version: '1.0.0' },
        ],
        assets: [
          { name: 'nginx', version: '1.0.1', extension: 'ndjson', type: 'savedObjectBundle' },
        ],
      },
    ],
  },
  loading: false,
  isCardView: false,
  setCardView: () => {},
  http: mockHttp as HttpStart, // Added the mock http property here
};

export const TEST_INTEGRATION_CONFIG: IntegrationConfig = {
  name: 'sample',
  version: '2.0.0',
  license: 'Apache-2.0',
  type: 'logs',
  workflows: [
    {
      name: 'workflow1',
      label: 'Workflow 1',
      description: 'This is a test workflow.',
      enabled_by_default: true,
    },
  ],
  components: [
    {
      name: 'logs',
      version: '1.0.0',
    },
  ],
  assets: [
    {
      name: 'sample',
      version: '1.0.1',
      extension: 'ndjson',
      type: 'savedObjectBundle',
    },
  ],
};

export const TEST_INTEGRATION_SETUP_INPUTS: IntegrationSetupInputs = {
  displayName: 'Test Instance Name',
  connectionType: 'index',
  connectionDataSource: 'ss4o_logs-nginx-test',
  connectionTableName: '',
  connectionLocation: '',
  checkpointLocation: '',
  enabledWorkflows: [],
};
