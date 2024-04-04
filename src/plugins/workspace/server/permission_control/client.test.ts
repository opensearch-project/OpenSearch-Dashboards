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

  it('should return false and log not permitted saved objects', async () => {
    const logger = loggerMock.create();
    const permissionControlClient = new SavedObjectsPermissionControl(logger);
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
              users: ['foo'],
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
    expect(batchValidateResult.result).toEqual(false);
    expect(logger.debug).toHaveBeenCalledTimes(1);
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

  describe('validateSavedObjectsACL', () => {
    it("should return true if saved objects don't have permissions property", () => {
      const permissionControlClient = new SavedObjectsPermissionControl(loggerMock.create());
      expect(
        permissionControlClient.validateSavedObjectsACL([{ type: 'workspace', id: 'foo' }], {}, [])
      ).toBe(true);
    });
    it('should return true if principals permitted to saved objects', () => {
      const permissionControlClient = new SavedObjectsPermissionControl(loggerMock.create());
      expect(
        permissionControlClient.validateSavedObjectsACL(
          [{ type: 'workspace', id: 'foo', permissions: { write: { users: ['bar'] } } }],
          { users: ['bar'] },
          ['write']
        )
      ).toBe(true);
    });
    it('should return false and log saved objects if not permitted', () => {
      const logger = loggerMock.create();
      const permissionControlClient = new SavedObjectsPermissionControl(logger);
      expect(
        permissionControlClient.validateSavedObjectsACL(
          [{ type: 'workspace', id: 'foo', permissions: { write: { users: ['bar'] } } }],
          { users: ['foo'] },
          ['write']
        )
      ).toBe(false);
      expect(logger.debug).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringMatching(
          /Authorization failed, principals:.*has no.*permissions on the requested saved object:.*foo/
        )
      );
    });
  });
});
