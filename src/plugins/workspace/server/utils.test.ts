/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  httpServerMock,
  savedObjectsClientMock,
  uiSettingsServiceMock,
} from '../../../core/server/mocks';
import { UiSettingScope } from '../../../core/server';
import {
  generateRandomId,
  updateDashboardAdminStateForRequest,
  transferCurrentUserInPermissions,
  getDataSourcesList,
  checkAndSetDefaultDataSource,
} from './utils';
import { getWorkspaceState } from '../../../core/server/utils';
import { DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../../data_source_management/common';
import { OSD_ADMIN_WILDCARD_MATCH_ALL } from '../common/constants';

describe('workspace utils', () => {
  it('should generate id with the specified size', () => {
    expect(generateRandomId(6)).toHaveLength(6);
  });

  it('should generate random IDs', () => {
    const NUM_OF_ID = 10000;
    const ids = new Set<string>();
    for (let i = 0; i < NUM_OF_ID; i++) {
      ids.add(generateRandomId(6));
    }
    expect(ids.size).toBe(NUM_OF_ID);
  });

  it('should be dashboard admin when users match configUsers', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const groups: string[] = ['dashboard_admin'];
    const users: string[] = [];
    const configGroups: string[] = ['dashboard_admin'];
    const configUsers: string[] = [];
    updateDashboardAdminStateForRequest(mockRequest, groups, users, configGroups, configUsers);
    expect(getWorkspaceState(mockRequest)?.isDashboardAdmin).toBe(true);
  });

  it('should be dashboard admin when groups match configGroups', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const groups: string[] = [];
    const users: string[] = ['dashboard_admin'];
    const configGroups: string[] = [];
    const configUsers: string[] = ['dashboard_admin'];
    updateDashboardAdminStateForRequest(mockRequest, groups, users, configGroups, configUsers);
    expect(getWorkspaceState(mockRequest)?.isDashboardAdmin).toBe(true);
  });

  it('should be not dashboard admin when groups do not match configGroups', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const groups: string[] = ['dashboard_admin'];
    const users: string[] = [];
    const configGroups: string[] = [];
    const configUsers: string[] = ['dashboard_admin'];
    updateDashboardAdminStateForRequest(mockRequest, groups, users, configGroups, configUsers);
    expect(getWorkspaceState(mockRequest)?.isDashboardAdmin).toBe(false);
  });

  it('should be dashboard admin when groups and users are []', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const groups: string[] = [];
    const users: string[] = [];
    const configGroups: string[] = [];
    const configUsers: string[] = [];
    updateDashboardAdminStateForRequest(mockRequest, groups, users, configGroups, configUsers);
    expect(getWorkspaceState(mockRequest)?.isDashboardAdmin).toBe(true);
  });

  it('should not be dashboard admin when configGroups and configUsers are []', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const groups: string[] = [];
    const users: string[] = ['user1'];
    const configGroups: string[] = [];
    const configUsers: string[] = [];
    updateDashboardAdminStateForRequest(mockRequest, groups, users, configGroups, configUsers);
    expect(getWorkspaceState(mockRequest)?.isDashboardAdmin).toBe(false);
  });

  it('should be dashboard admin when configGroups or configUsers include wildcard *', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const groups: string[] = [];
    const users: string[] = ['user1'];
    const configGroups: string[] = [];
    const configUsers: string[] = [OSD_ADMIN_WILDCARD_MATCH_ALL];
    updateDashboardAdminStateForRequest(mockRequest, groups, users, configGroups, configUsers);
    expect(getWorkspaceState(mockRequest)?.isDashboardAdmin).toBe(true);
  });

  it('should transfer current user placeholder in permissions', () => {
    expect(transferCurrentUserInPermissions('foo', undefined)).toBeUndefined();
    expect(
      transferCurrentUserInPermissions('foo', {
        library_write: {
          users: ['%me%', 'bar'],
        },
        write: {
          users: ['%me%'],
        },
        read: {
          users: ['bar'],
        },
      })
    ).toEqual({
      library_write: {
        users: ['foo', 'bar'],
      },
      write: {
        users: ['foo'],
      },
      read: {
        users: ['bar'],
      },
    });
  });

  it('should return dataSources list when passed savedObject client', async () => {
    const savedObjectsClient = savedObjectsClientMock.create();
    const dataSources = [
      {
        id: 'ds-1',
      },
    ];
    savedObjectsClient.find = jest.fn().mockResolvedValue({
      saved_objects: dataSources,
    });
    const result = await getDataSourcesList(savedObjectsClient, []);
    expect(result).toEqual(dataSources);
  });

  it('should return empty array when finding no saved objects', async () => {
    const savedObjectsClient = savedObjectsClientMock.create();
    savedObjectsClient.find = jest.fn().mockResolvedValue({});
    const result = await getDataSourcesList(savedObjectsClient, []);
    expect(result).toEqual([]);
  });

  it('should set first data sources as default when not need check', async () => {
    const savedObjectsClient = savedObjectsClientMock.create();
    const uiSettings = uiSettingsServiceMock.createStartContract();
    const uiSettingsClient = uiSettings.asScopedToClient(savedObjectsClient);
    const dataSources = ['id1', 'id2'];
    await checkAndSetDefaultDataSource(uiSettingsClient, dataSources, false);
    expect(uiSettingsClient.set).toHaveBeenCalledWith(
      DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
      dataSources[0],
      UiSettingScope.WORKSPACE
    );
  });

  it('should not set default data source after checking if not needed', async () => {
    const savedObjectsClient = savedObjectsClientMock.create();
    const uiSettings = uiSettingsServiceMock.createStartContract();
    const uiSettingsClient = uiSettings.asScopedToClient(savedObjectsClient);
    const dataSources = ['id1', 'id2'];
    uiSettingsClient.get = jest.fn().mockResolvedValue(dataSources[0]);
    await checkAndSetDefaultDataSource(uiSettingsClient, dataSources, true);
    expect(uiSettingsClient.set).not.toBeCalled();
  });

  it('should check then set first data sources as default if needed when checking', async () => {
    const savedObjectsClient = savedObjectsClientMock.create();
    const uiSettings = uiSettingsServiceMock.createStartContract();
    const uiSettingsClient = uiSettings.asScopedToClient(savedObjectsClient);
    const dataSources = ['id1', 'id2'];
    uiSettingsClient.get = jest.fn().mockResolvedValue('');
    await checkAndSetDefaultDataSource(uiSettingsClient, dataSources, true);
    expect(uiSettingsClient.set).toHaveBeenCalledWith(
      DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
      dataSources[0],
      UiSettingScope.WORKSPACE
    );
  });

  it('should clear default data source if there is no new data source', async () => {
    const savedObjectsClient = savedObjectsClientMock.create();
    const uiSettings = uiSettingsServiceMock.createStartContract();
    const uiSettingsClient = uiSettings.asScopedToClient(savedObjectsClient);
    const dataSources: string[] = [];
    uiSettingsClient.get = jest.fn().mockResolvedValue('');
    await checkAndSetDefaultDataSource(uiSettingsClient, dataSources, true);
    expect(uiSettingsClient.set).toHaveBeenCalledWith(
      DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
      undefined,
      UiSettingScope.WORKSPACE
    );
  });
});
