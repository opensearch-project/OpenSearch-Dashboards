/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggerMock } from '@osd/logging/target/mocks';
import { SavedObjectsPermissionControl } from './client';
import {
  httpServerMock,
  httpServiceMock,
  savedObjectsClientMock,
} from '../../../../core/server/mocks';
import * as utilsExports from '../utils';

describe('PermissionControl', () => {
  jest.spyOn(utilsExports, 'getPrincipalsFromRequest').mockImplementation(() => ({
    users: ['bar'],
  }));
  const mockAuth = httpServiceMock.createAuth();

  it('validate should return error when no saved objects can be found', async () => {
    const permissionControlClient = new SavedObjectsPermissionControl(loggerMock.create());
    const getScopedClient = jest.fn();
    const clientMock = savedObjectsClientMock.create();
    getScopedClient.mockImplementation((request) => {
      return clientMock;
    });
    permissionControlClient.setup(getScopedClient, mockAuth);
    clientMock.bulkGet.mockResolvedValue({
      saved_objects: [],
    });
    const result = await permissionControlClient.validate(
      httpServerMock.createOpenSearchDashboardsRequest(),
      { id: 'foo', type: 'dashboard' },
      ['read']
    );
    expect(result.success).toEqual(false);
  });

  it('validate should return error when bulkGet return error', async () => {
    const permissionControlClient = new SavedObjectsPermissionControl(loggerMock.create());
    const getScopedClient = jest.fn();
    const clientMock = savedObjectsClientMock.create();
    getScopedClient.mockImplementation((request) => {
      return clientMock;
    });
    permissionControlClient.setup(getScopedClient, mockAuth);

    clientMock.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'foo',
          type: 'dashboard',
          references: [],
          attributes: {},
          error: {
            error: 'error_bar',
            message: 'error_bar',
            statusCode: 500,
          },
        },
      ],
    });
    const errorResult = await permissionControlClient.validate(
      httpServerMock.createOpenSearchDashboardsRequest(),
      { id: 'foo', type: 'dashboard' },
      ['read']
    );
    expect(errorResult.success).toEqual(false);
    expect(errorResult.error).toEqual('error_bar');
  });

  it('validate should return success normally', async () => {
    const permissionControlClient = new SavedObjectsPermissionControl(loggerMock.create());
    const getScopedClient = jest.fn();
    const clientMock = savedObjectsClientMock.create();
    getScopedClient.mockImplementation((request) => {
      return clientMock;
    });
    permissionControlClient.setup(getScopedClient, mockAuth);

    clientMock.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'foo',
          type: 'dashboard',
          references: [],
          attributes: {},
        },
        {
          id: 'bar',
          type: 'dashboard',
          references: [],
          attributes: {},
          permissions: {
            read: {
              users: ['bar'],
            },
          },
        },
      ],
    });
    const batchValidateResult = await permissionControlClient.batchValidate(
      httpServerMock.createOpenSearchDashboardsRequest(),
      [],
      ['read']
    );
    expect(batchValidateResult.success).toEqual(true);
    expect(batchValidateResult.result).toEqual(true);
  });

  describe('getPrincipalsFromRequest', () => {
    const permissionControlClient = new SavedObjectsPermissionControl(loggerMock.create());
    const getScopedClient = jest.fn();
    permissionControlClient.setup(getScopedClient, mockAuth);

    it('should return normally when calling getPrincipalsFromRequest', () => {
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      const result = permissionControlClient.getPrincipalsFromRequest(mockRequest);
      expect(result.users).toEqual(['bar']);
    });
  });
});
