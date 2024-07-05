/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthStatus } from '../../../core/server';
import {
  httpServerMock,
  httpServiceMock,
  savedObjectsClientMock,
} from '../../../core/server/mocks';
import {
  generateRandomId,
  getOSDAdminConfigFromYMLConfig,
  getPrincipalsFromRequest,
  updateDashboardAdminStateForRequest,
  transferCurrentUserInPermissions,
  getDataSourcesList,
} from './utils';
import { getWorkspaceState } from '../../../core/server/utils';
import { Observable, of } from 'rxjs';

describe('workspace utils', () => {
  const mockAuth = httpServiceMock.createAuth();
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

  it('should return empty map when request do not have authentication', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    mockAuth.get.mockReturnValueOnce({
      status: AuthStatus.unknown,
      state: {
        authInfo: {
          user_name: 'bar',
          backend_roles: ['foo'],
        },
      },
    });
    const result = getPrincipalsFromRequest(mockRequest, mockAuth);
    expect(result).toEqual({});
  });

  it('should return normally when request has authentication', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    mockAuth.get.mockReturnValueOnce({
      status: AuthStatus.authenticated,
      state: {
        authInfo: {
          user_name: 'bar',
          backend_roles: ['foo'],
        },
      },
    });
    const result = getPrincipalsFromRequest(mockRequest, mockAuth);
    expect(result.users).toEqual(['bar']);
    expect(result.groups).toEqual(['foo']);
  });

  it('should throw error when request is not authenticated', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    mockAuth.get.mockReturnValueOnce({
      status: AuthStatus.unauthenticated,
      state: {},
    });
    expect(() => getPrincipalsFromRequest(mockRequest, mockAuth)).toThrow('NOT_AUTHORIZED');
  });

  it('should throw error when authentication status is not expected', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    mockAuth.get.mockReturnValueOnce({
      // @ts-ignore
      status: 'foo',
      state: {},
    });
    expect(() => getPrincipalsFromRequest(mockRequest, mockAuth)).toThrow(
      'UNEXPECTED_AUTHORIZATION_STATUS'
    );
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

  it('should be dashboard admin when configGroups and configUsers are []', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const groups: string[] = ['user1'];
    const users: string[] = [];
    const configGroups: string[] = [];
    const configUsers: string[] = [];
    updateDashboardAdminStateForRequest(mockRequest, groups, users, configGroups, configUsers);
    expect(getWorkspaceState(mockRequest)?.isDashboardAdmin).toBe(true);
  });

  it('should get correct admin config when admin config is enabled ', async () => {
    const globalConfig$: Observable<any> = of({
      opensearchDashboards: {
        dashboardAdmin: {
          groups: ['group1', 'group2'],
          users: ['user1', 'user2'],
        },
      },
    });
    const [groups, users] = await getOSDAdminConfigFromYMLConfig(globalConfig$);
    expect(groups).toEqual(['group1', 'group2']);
    expect(users).toEqual(['user1', 'user2']);
  });

  it('should get [] when admin config is not enabled', async () => {
    const globalConfig$: Observable<any> = of({});
    const [groups, users] = await getOSDAdminConfigFromYMLConfig(globalConfig$);
    expect(groups).toEqual([]);
    expect(users).toEqual([]);
  });

  it('should transfer current user placeholder in permissions', () => {
    expect(transferCurrentUserInPermissions('foo', undefined)).toBeUndefined();
    expect(
      transferCurrentUserInPermissions('foo', {
        library_write: {
          users: ['%current_user%', 'bar'],
        },
        write: {
          users: ['%current_user%'],
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
});
