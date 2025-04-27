/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSingleDataSource,
  deleteDataSourceById,
  deleteMultipleDataSources,
  extractRegisteredAuthTypeCredentials,
  getDataSourceById,
  getDataSources,
  getDefaultAuthMethod,
  isValidUrl,
  testConnection,
  updateDataSourceById,
  handleSetDefaultDatasource,
  setFirstDataSourceAsDefault,
  getFilteredDataSources,
  getDefaultDataSource,
  handleDataSourceFetchError,
  handleNoAvailableDataSourceError,
  getDataSourceSelection,
  setDataSourceSelection,
  getDefaultDataSourceId,
  getDefaultDataSourceId$,
} from './utils';
import { coreMock, notificationServiceMock } from '../../../../core/public/mocks';
import { UiSettingScope } from '../../../../core/public';
import {
  getDataSourceByIdWithCredential,
  getDataSourceByIdWithoutCredential,
  getDataSourcesResponse,
  getMappedDataSources,
  mockDataSourceAttributesWithAuth,
  mockErrorResponseForSavedObjectsCalls,
  mockResponseForSavedObjectsCalls,
  mockUiSettingsCalls,
  getSingleDataSourceResponse,
  getDataSource,
  getDataSourceOptions,
  getDataSourceByIdWithNotFoundError,
  getDataSourceByIdWithNetworkError,
} from '../mocks';
import {
  AuthType,
  noAuthCredentialAuthMethod,
  sigV4AuthMethod,
  usernamePasswordAuthMethod,
} from '../types';
import { HttpStart, IToasts, SavedObject } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { AuthenticationMethod, AuthenticationMethodRegistry } from '../auth_registry';
import { deepEqual } from 'assert';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import {
  ADD_COMPATIBLE_DATASOURCES_MESSAGE,
  CONNECT_DATASOURCES_MESSAGE,
  NO_COMPATIBLE_DATASOURCES_MESSAGE,
  NO_DATASOURCES_CONNECTED_MESSAGE,
} from './constants';
import {
  DataSourceSelectionService,
  defaultDataSourceSelection,
} from '../service/data_source_selection_service';
import { Observable, of } from 'rxjs';

const { savedObjects } = coreMock.createStart();
const { uiSettings } = coreMock.createStart();

describe('DataSourceManagement: Utils.ts', () => {
  describe('Get data source', () => {
    test('Success: getting data sources', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', getDataSourcesResponse);
      const fetchDataSources = await getDataSources(savedObjects.client);
      expect(fetchDataSources.length).toBe(getDataSourcesResponse.savedObjects.length);
    });
    test('Success but no data sources found: getting data sources', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', {});
      const fetchDataSources = await getDataSources(savedObjects.client);
      expect(fetchDataSources.length).toBe(0);
    });
    test('failure: getting data sources', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'find');
        await getDataSources(savedObjects.client);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Handle fetch data source error', () => {
    const { toasts } = notificationServiceMock.createStartContract();

    test('should send warning when data source fetch failed', () => {
      const changeStateMock = jest.fn();
      handleDataSourceFetchError(changeStateMock, toasts);
      expect(changeStateMock).toBeCalledWith({ showError: true });
      expect(toasts.add).toBeCalledTimes(1);
    });
  });

  describe('Handle no available data source error', () => {
    let toasts: IToasts;
    const noDataSourcesConnectedMessage =
      'No data sources connected yet. Connect your data sources to get started.';
    const noCompatibleDataSourcesMessage =
      'No compatible data sources are available. Add a compatible data source.';

    beforeEach(() => {
      toasts = notificationServiceMock.createStartContract().toasts;
    });

    test.each([
      {
        incompatibleDataSourcesExist: false,
        defaultMessage: noDataSourcesConnectedMessage,
      },
      {
        incompatibleDataSourcesExist: true,
        defaultMessage: noCompatibleDataSourcesMessage,
      },
    ])(
      'should send warning when data source is not available',
      ({ incompatibleDataSourcesExist, defaultMessage }) => {
        const changeState = jest.fn();
        handleNoAvailableDataSourceError({
          changeState,
          notifications: toasts,
          incompatibleDataSourcesExist,
        });
        expect(toasts.add).toBeCalledTimes(1);
        expect(toasts.add).toBeCalledWith(expect.objectContaining({ title: defaultMessage }));
      }
    );
  });

  describe('Get data source by ID', () => {
    test('Success: getting data source by ID with credential', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'get', getDataSourceByIdWithCredential);
      const dsById = await getDataSourceById('alpha-test', savedObjects.client);
      expect(dsById.title).toBe('alpha-test');
      expect(dsById.auth.type).toBe(AuthType.UsernamePasswordType);
    });
    test('Success: getting data source by ID without credential', async () => {
      mockResponseForSavedObjectsCalls(
        savedObjects.client,
        'get',
        getDataSourceByIdWithoutCredential
      );
      const dsById = await getDataSourceById('alpha-test', savedObjects.client);
      expect(dsById.title).toBe('alpha-test');
      expect(dsById.auth.type).toBe(AuthType.NoAuth);
    });
    test('Success but no data: getting data source by ID without credential', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'get', {});
      const dsById = await getDataSourceById('alpha-test', savedObjects.client);
      expect(dsById?.description).toBe('');
    });
    test('failure: getting data source by ID', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'get');
        await getDataSourceById('alpha-test', savedObjects.client);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
    test('failure: gets error when response contains not found error', async () => {
      try {
        mockResponseForSavedObjectsCalls(
          savedObjects.client,
          'get',
          getDataSourceByIdWithNotFoundError
        );
        await getDataSourceById('alpha-test', savedObjects.client);
      } catch (e) {
        expect(e.statusCode).toBe(404);
      }
    });
    test('failure: gets error when response contains other error', async () => {
      try {
        mockResponseForSavedObjectsCalls(
          savedObjects.client,
          'get',
          getDataSourceByIdWithNetworkError
        );
        await getDataSourceById('alpha-test', savedObjects.client);
      } catch (e) {
        expect(e.statusCode).toBe(500);
      }
    });
  });

  describe('Create data source', () => {
    test('Success: creating data source', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'create', {});
      const createDs = await createSingleDataSource(
        savedObjects.client,
        mockDataSourceAttributesWithAuth
      );
      expect(createDs).toBeTruthy();
    });
    test('failure: creating data source', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'create');
        await createSingleDataSource(savedObjects.client, mockDataSourceAttributesWithAuth);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Update data source by id', () => {
    test('Success: updating data source', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'update', {});
      const createDs = await updateDataSourceById(
        savedObjects.client,
        'ds-1234',
        mockDataSourceAttributesWithAuth
      );
      expect(createDs).toBeTruthy();
    });
    test('failure: updating data sources', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'update');
        await updateDataSourceById(
          savedObjects.client,
          'ds-1234',
          mockDataSourceAttributesWithAuth
        );
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Delete data source by id', () => {
    test('Success: deleting data source', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'delete', {});
      const createDs = await deleteDataSourceById('ds-1234', savedObjects.client);
      expect(createDs).toBeTruthy();
    });
    test('failure: deleting data sources', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'delete');
        await deleteDataSourceById('ds-1234', savedObjects.client);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Test connection to the endpoint of the data source - success', () => {
    let http: jest.Mocked<HttpStart>;
    const mockSuccess = jest.fn().mockResolvedValue({ body: { success: true } });
    const mockError = jest.fn().mockRejectedValue(null);
    beforeEach(() => {
      http = coreMock.createStart().http;
      http.post.mockResolvedValue(mockSuccess);
    });
    test('Success:  Test Connection to the endpoint while creating a new data source', async () => {
      await testConnection(http, getDataSourceByIdWithoutCredential.attributes);
      expect(http.post.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            "/internal/data-source-management/validate",
            Object {
              "body": "{\\"dataSourceAttr\\":{\\"endpoint\\":\\"https://test.com\\",\\"auth\\":{\\"type\\":\\"no_auth\\"}}}",
            },
          ],
        ]
      `);
    });

    test('Success: Test Connection to the endpoint while existing data source is updated', async () => {
      await testConnection(http, getDataSourceByIdWithoutCredential.attributes, 'test1234');
      expect(http.post.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            "/internal/data-source-management/validate",
            Object {
              "body": "{\\"id\\":\\"test1234\\",\\"dataSourceAttr\\":{\\"endpoint\\":\\"https://test.com\\",\\"auth\\":{\\"type\\":\\"no_auth\\"}}}",
            },
          ],
        ]
      `);
    });
    test('failure:  Test Connection to the endpoint while creating/updating a data source', async () => {
      try {
        http.post.mockRejectedValue(mockError);
        await testConnection(http, getDataSourceByIdWithoutCredential.attributes, 'test1234');
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Delete multiple data sources by id', () => {
    test('Success: deleting multiple data source', async () => {
      try {
        mockResponseForSavedObjectsCalls(savedObjects.client, 'delete', {});
        await deleteMultipleDataSources(savedObjects.client, getMappedDataSources);
        expect(true).toBe(true); // This will be executed if multiple delete call is successful.
      } catch (e) {
        // this block should not execute as the test case name suggests
        expect(e).toBeFalsy();
      }
    });
    test('failure: deleting multiple data sources', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'delete');
        await deleteMultipleDataSources(savedObjects.client, getMappedDataSources);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  test('check if url is valid', () => {
    /* False cases */
    expect(isValidUrl('')).toBeFalsy();
    expect(isValidUrl('test')).toBeFalsy();

    /* True cases */
    expect(isValidUrl('https://test.com')).toBeTruthy();
    expect(isValidUrl('http://test.com')).toBeTruthy();

    /* True cases: port number scenario*/
    expect(isValidUrl('http://192.168.1.1:1234/')).toBeTruthy();
  });

  describe('Check default auth method', () => {
    test('default auth method is Username & Password when Username & Password is enabled', () => {
      const authMethodCombinationsToBeTested = [
        [usernamePasswordAuthMethod],
        [sigV4AuthMethod, usernamePasswordAuthMethod],
        [noAuthCredentialAuthMethod, usernamePasswordAuthMethod],
        [noAuthCredentialAuthMethod, sigV4AuthMethod, usernamePasswordAuthMethod],
      ];

      authMethodCombinationsToBeTested.forEach((authOptions) => {
        const authenticationMethodRegistry = new AuthenticationMethodRegistry();

        authOptions.forEach((authMethod) => {
          authenticationMethodRegistry.registerAuthenticationMethod(authMethod);
        });

        expect(getDefaultAuthMethod(authenticationMethodRegistry)?.name).toBe(
          AuthType.UsernamePasswordType
        );
      });
    });

    test('default auth method is first one in AuthList when Username & Password is not enabled', () => {
      const authMethodCombinationsToBeTested = [
        [sigV4AuthMethod],
        [noAuthCredentialAuthMethod],
        [sigV4AuthMethod, noAuthCredentialAuthMethod],
      ];

      authMethodCombinationsToBeTested.forEach((authOptions) => {
        const authenticationMethodRegistry = new AuthenticationMethodRegistry();

        authOptions.forEach((authMethod) => {
          authenticationMethodRegistry.registerAuthenticationMethod(authMethod);
        });

        expect(getDefaultAuthMethod(authenticationMethodRegistry)?.name).toBe(authOptions[0].name);
      });
    });

    test('default auth type is NoAuth when no auth options registered in authenticationMethodRegistry, this should not happen in real customer scenario for MD', () => {
      const authenticationMethodRegistry = new AuthenticationMethodRegistry();
      expect(getDefaultAuthMethod(authenticationMethodRegistry)?.name).toBe(AuthType.NoAuth);
    });
  });
  describe('handle set default datasource', () => {
    beforeEach(() => {
      jest.clearAllMocks(); // Reset all mock calls before each test
    });
    test('should set default datasource when it does not have default datasource ', async () => {
      mockUiSettingsCalls(uiSettings, 'get', null);
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', getDataSourcesResponse);
      await handleSetDefaultDatasource(savedObjects.client, uiSettings);
      expect(uiSettings.set).toHaveBeenCalled();
    });
    test('should set default datasource when returned default datasource id is empty string', async () => {
      mockUiSettingsCalls(uiSettings, 'get', '');
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', getDataSourcesResponse);
      await handleSetDefaultDatasource(savedObjects.client, uiSettings);
      expect(uiSettings.set).toHaveBeenCalled();
    });
    test('should not set default datasource when it has default datasouce', async () => {
      mockUiSettingsCalls(uiSettings, 'get', 'test');
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', getDataSourcesResponse);
      await handleSetDefaultDatasource(savedObjects.client, uiSettings);
      expect(uiSettings.set).not.toHaveBeenCalled();
    });
  });
  describe('set first aataSource as default', () => {
    beforeEach(() => {
      jest.clearAllMocks(); // Reset all mock calls before each test
    });
    test('should set defaultDataSource if more than one data source exists', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', getDataSourcesResponse);
      await setFirstDataSourceAsDefault(
        savedObjects.client,
        uiSettings,
        true,
        UiSettingScope.GLOBAL
      );
      expect(uiSettings.set).toHaveBeenCalled();
    });
    test('should set defaultDataSource if only one data source exists', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', getSingleDataSourceResponse);
      await setFirstDataSourceAsDefault(
        savedObjects.client,
        uiSettings,
        true,
        UiSettingScope.GLOBAL
      );
      expect(uiSettings.set).toHaveBeenCalled();
    });
    test('should not set defaultDataSource if no data source exists', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', { savedObjects: [] });
      await setFirstDataSourceAsDefault(
        savedObjects.client,
        uiSettings,
        true,
        UiSettingScope.GLOBAL
      );
      expect(uiSettings.remove).toHaveBeenCalled();
      expect(uiSettings.set).not.toHaveBeenCalled();
    });
    test('should not set defaultDataSource if no data source exists and no default datasouce', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', { savedObjects: [] });
      await setFirstDataSourceAsDefault(
        savedObjects.client,
        uiSettings,
        false,
        UiSettingScope.GLOBAL
      );
      expect(uiSettings.remove).not.toHaveBeenCalled();
      expect(uiSettings.set).not.toHaveBeenCalled();
    });
  });
  describe('Check extractRegisteredAuthTypeCredentials method', () => {
    test('Should extract credential field successfully', () => {
      const authTypeToBeTested = 'Some Auth Type';

      const authMethodToBeTested = {
        name: authTypeToBeTested,
        credentialSourceOption: {
          value: authTypeToBeTested,
          inputDisplay: 'some input',
        },
        credentialFormField: {
          userNameRegistered: '',
          passWordRegistered: '',
        },
      } as AuthenticationMethod;

      const mockedCredentialState = {
        userName: 'some userName',
        passWord: 'some password',
        userNameRegistered: 'some filled in userName from registed auth credential form',
        passWordRegistered: 'some filled in password from registed auth credential form',
      } as { [key: string]: string };

      const expectExtractedAuthCredentials = {
        userNameRegistered: 'some filled in userName from registed auth credential form',
        passWordRegistered: 'some filled in password from registed auth credential form',
      };

      const authenticationMethodRegistry = new AuthenticationMethodRegistry();
      authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTested);

      const registedAuthTypeCredentials = extractRegisteredAuthTypeCredentials(
        mockedCredentialState,
        authTypeToBeTested,
        authenticationMethodRegistry
      );

      expect(deepEqual(registedAuthTypeCredentials, expectExtractedAuthCredentials));
    });

    test('Should extract empty object when no credentialFormField registered ', () => {
      const authTypeToBeTested = 'Some Auth Type';

      const authMethodToBeTested = {
        name: authTypeToBeTested,
        credentialSourceOption: {
          value: authTypeToBeTested,
          inputDisplay: 'some input',
        },
      } as AuthenticationMethod;

      const mockedCredentialState = {
        userName: 'some userName',
        passWord: 'some password',
      } as { [key: string]: string };

      const authenticationMethodRegistry = new AuthenticationMethodRegistry();
      authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTested);

      const registedAuthTypeCredentials = extractRegisteredAuthTypeCredentials(
        mockedCredentialState,
        authTypeToBeTested,
        authenticationMethodRegistry
      );

      expect(deepEqual(registedAuthTypeCredentials, {}));
    });

    test('Should fill in empty value when credentail state not have registered field', () => {
      const authTypeToBeTested = 'Some Auth Type';

      const authMethodToBeTested = {
        name: authTypeToBeTested,
        credentialSourceOption: {
          value: authTypeToBeTested,
          inputDisplay: 'some input',
        },
        credentialFormField: {
          userNameRegistered: '',
          passWordRegistered: '',
        },
      } as AuthenticationMethod;

      const mockedCredentialState = {
        userName: 'some userName',
        passWord: 'some password',
        userNameRegistered: 'some filled in userName from registed auth credential form',
      } as { [key: string]: string };

      const expectExtractedAuthCredentials = {
        userNameRegistered: 'some filled in userName from registed auth credential form',
        passWordRegistered: '',
      };

      const authenticationMethodRegistry = new AuthenticationMethodRegistry();
      authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTested);

      const registedAuthTypeCredentials = extractRegisteredAuthTypeCredentials(
        mockedCredentialState,
        authTypeToBeTested,
        authenticationMethodRegistry
      );

      expect(deepEqual(registedAuthTypeCredentials, expectExtractedAuthCredentials));
    });

    test('Should inherit value from registered field when credential state not have registered field', () => {
      const authTypeToBeTested = 'Some Auth Type';

      const authMethodToBeTested = {
        name: authTypeToBeTested,
        credentialSourceOption: {
          value: authTypeToBeTested,
          inputDisplay: 'some input',
        },
        credentialFormField: {
          registeredField: 'some value',
        },
      } as AuthenticationMethod;

      const mockedCredentialState = {} as { [key: string]: string };

      const expectExtractedAuthCredentials = {
        registeredField: 'some value',
      };

      const authenticationMethodRegistry = new AuthenticationMethodRegistry();
      authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTested);

      const registedAuthTypeCredentials = extractRegisteredAuthTypeCredentials(
        mockedCredentialState,
        authTypeToBeTested,
        authenticationMethodRegistry
      );

      expect(deepEqual(registedAuthTypeCredentials, expectExtractedAuthCredentials));
    });

    test('Should not inherit value from registered field when credentail state have registered field', () => {
      const authTypeToBeTested = 'Some Auth Type';

      const authMethodToBeTested = {
        name: authTypeToBeTested,
        credentialSourceOption: {
          value: authTypeToBeTested,
          inputDisplay: 'some input',
        },
        credentialFormField: {
          registeredField: 'Some value',
        },
      } as AuthenticationMethod;

      const mockedCredentialState = {
        registeredField: 'some other values',
      } as { [key: string]: string };

      const expectExtractedAuthCredentials = {
        registeredField: 'some other values',
      };

      const authenticationMethodRegistry = new AuthenticationMethodRegistry();
      authenticationMethodRegistry.registerAuthenticationMethod(authMethodToBeTested);

      const registedAuthTypeCredentials = extractRegisteredAuthTypeCredentials(
        mockedCredentialState,
        authTypeToBeTested,
        authenticationMethodRegistry
      );

      expect(deepEqual(registedAuthTypeCredentials, expectExtractedAuthCredentials));
    });
  });

  describe('Check on get filter datasource', () => {
    test('should return all data sources when no filter is provided', () => {
      const dataSources: Array<SavedObject<DataSourceAttributes>> = [
        {
          id: '1',
          type: '',
          references: [],
          attributes: {
            title: 'DataSource 1',
            endpoint: '',
            auth: { type: AuthType.NoAuth, credentials: undefined },
            name: AuthType.NoAuth,
          },
        },
      ];

      const result = getFilteredDataSources(dataSources);

      expect(result).toEqual([
        {
          id: '1',
          label: 'DataSource 1',
        },
      ]);
    });

    test('should return filtered data sources when a filter is provided', () => {
      const filter = (dataSource: SavedObject<DataSourceAttributes>) => dataSource.id === '2';
      const result = getFilteredDataSources(getDataSource, filter);
      expect(result).toEqual([
        {
          id: '2',
          label: 'DataSource 2',
        },
      ]);
    });
  });
  describe('getDefaultDataSource', () => {
    const LocalCluster = { id: 'local', label: 'Local Cluster' };
    const hideLocalCluster = false;
    const defaultOption = [{ id: '2', label: 'DataSource 2' }];

    it('should return the default option if it exists in the data sources', () => {
      mockUiSettingsCalls(uiSettings, 'get', '2');
      const result = getDefaultDataSource(
        getDataSourceOptions,
        LocalCluster,
        '2',
        hideLocalCluster
      );
      expect(result).toEqual([defaultOption[0]]);
    });

    it('should return local cluster if it exists and no default options in the data sources', () => {
      mockUiSettingsCalls(uiSettings, 'get', null);
      const result = getDefaultDataSource(getDataSource, LocalCluster, null, hideLocalCluster);
      expect(result).toEqual([LocalCluster]);
    });

    it('should return the default datasource if hideLocalCluster is false', () => {
      mockUiSettingsCalls(uiSettings, 'get', '2');
      const result = getDefaultDataSource(getDataSourceOptions, LocalCluster, '2', false);
      expect(result).toEqual([{ id: '2', label: 'DataSource 2' }]);
    });

    it('should return the first data source if no default option, hideLocalCluster is ture and no default datasource', () => {
      mockUiSettingsCalls(uiSettings, 'get', null);
      const result = getDefaultDataSource(getDataSourceOptions, LocalCluster, uiSettings, true);
      expect(result).toEqual([{ id: '1', label: 'DataSource 1' }]);
    });
  });

  describe('getDataSourceSelection and setDataSourceSelection', () => {
    it('should not throw error and return default fallback dataSourceSelection  if value is not set', () => {
      const result = getDataSourceSelection();
      expect(result).toEqual(defaultDataSourceSelection);
    });

    it('should return value normally if value is set', () => {
      const dataSourceSelection = new DataSourceSelectionService();
      setDataSourceSelection(dataSourceSelection);
      const result = getDataSourceSelection();
      expect(result).toEqual(dataSourceSelection);
    });
  });
  describe('getDefaultDataSourceId', () => {
    it('should return null if uiSettings is not passed', () => {
      mockUiSettingsCalls(uiSettings, 'get', 'id-1');
      const result = getDefaultDataSourceId();
      expect(result).toEqual(null);
    });

    it('should return string value normally', () => {
      mockUiSettingsCalls(uiSettings, 'get', 'id-1');
      const result = getDefaultDataSourceId(uiSettings);
      expect(result).toEqual('id-1');
    });
  });

  describe('getDefaultDataSourceId$', () => {
    it('should return null if uiSettings is not passed', () => {
      mockUiSettingsCalls(uiSettings, 'get', 'id-1');
      const result = getDefaultDataSourceId$();
      expect(result).toEqual(null);
    });

    it('should return observable value normally', () => {
      const id$ = of('id-1');
      mockUiSettingsCalls(uiSettings, 'get$', id$);
      const result$ = getDefaultDataSourceId$(uiSettings);
      expect(result$).toBeInstanceOf(Observable);
      expect(result$).toEqual(id$);
    });
  });
});
