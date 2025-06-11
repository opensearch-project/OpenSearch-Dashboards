/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock, httpServerMock, savedObjectsClientMock } from '../../../server/mocks';
import { PermissionControlledUiSettingsWrapper } from './permission_controlled_ui_settings_wrapper';
import { SavedObjectsErrorHelpers } from '../../../server';
import { DASHBOARD_ADMIN_SETTINGS_ID } from '../utils';

// Mock the getWorkspaceState function
jest.mock('opensearch-dashboards/server/utils', () => ({
  getWorkspaceState: jest.fn().mockImplementation((request) => ({
    isDashboardAdmin: request.isDashboardAdmin,
  })),
  pkg: {
    build: {
      distributable: true,
      release: true,
    },
  },
}));

describe('PermissionControlledUiSettingsWrapper', () => {
  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const mockedClient = savedObjectsClientMock.create();
  const requestMock = httpServerMock.createOpenSearchDashboardsRequest();

  // Helper to build wrapper instance
  const buildWrapperInstance = (permissionEnabled: boolean, isDashboardAdmin = true) => {
    const wrapperInstance = new PermissionControlledUiSettingsWrapper(permissionEnabled);
    // Set isDashboardAdmin property on request
    (requestMock as any).isDashboardAdmin = isDashboardAdmin;

    const wrapperClient = wrapperInstance.wrapperFactory({
      client: mockedClient,
      typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      request: requestMock,
    });
    return wrapperClient;
  };

  describe('#get', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass through non-config type requests', async () => {
      const wrapperClient = buildWrapperInstance(true);
      await wrapperClient.get('dashboard', 'test-id');
      expect(mockedClient.get).toBeCalledWith('dashboard', 'test-id');
    });

    it('should handle regular config requests', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const mockResponse = {
        id: '3.0.0',
        type: 'config',
        attributes: { 'regular.setting': 'value' },
        references: [],
      };
      mockedClient.get.mockResolvedValue(mockResponse);

      const result = await wrapperClient.get('config', '3.0.0');

      expect(mockedClient.get).toBeCalledWith('config', '3.0.0');
      expect(result).toEqual(mockResponse);
    });

    it('should handle admin settings requests', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const adminSettings = {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        type: 'config',
        attributes: { 'test.setting': 'admin_value' },
        references: [],
      };
      mockedClient.get.mockResolvedValue(adminSettings);

      const result = await wrapperClient.get('config', DASHBOARD_ADMIN_SETTINGS_ID);

      expect(mockedClient.get).toBeCalledWith('config', DASHBOARD_ADMIN_SETTINGS_ID);
      expect(result).toEqual(adminSettings);
    });

    it('should propagate errors other than not found', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const error = new Error('Database error');
      mockedClient.get.mockRejectedValue(error);

      await expect(wrapperClient.get('config', DASHBOARD_ADMIN_SETTINGS_ID)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('#create', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass through non-config type requests', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const attributes = { title: 'Test Dashboard' };
      await wrapperClient.create('dashboard', attributes);
      expect(mockedClient.create).toBeCalledWith('dashboard', attributes, {});
    });

    it('should pass through regular config requests', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const attributes = { 'regular.setting': 'value' };
      await wrapperClient.create('config', attributes);
      expect(mockedClient.create).toBeCalledWith('config', attributes, {});
    });

    it('should create admin settings when user is dashboard admin', async () => {
      const wrapperClient = buildWrapperInstance(true, true);
      const attributes = { permissionControlledSetting: true };
      const mockResponse = {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        type: 'config',
        attributes,
        references: [],
      };

      mockedClient.create.mockResolvedValue(mockResponse);

      await wrapperClient.create('config', attributes, { id: DASHBOARD_ADMIN_SETTINGS_ID });

      expect(mockedClient.create).toBeCalledWith('config', attributes, {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        overwrite: true,
        permissions: expect.any(Object),
      });
    });

    it('should throw permission error when user is not dashboard admin', async () => {
      const wrapperClient = buildWrapperInstance(true, false);
      const attributes = { permission: true };

      await expect(
        wrapperClient.create('config', attributes, { id: DASHBOARD_ADMIN_SETTINGS_ID })
      ).rejects.toThrow('No permission for admin UI settings operations');
    });

    it('should not add permissions when permission control is disabled', async () => {
      const wrapperClient = buildWrapperInstance(false, true);
      const attributes = { permissionControlled: true };

      await wrapperClient.create('config', attributes, { id: DASHBOARD_ADMIN_SETTINGS_ID });

      expect(mockedClient.create).toBeCalledWith('config', attributes, {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        overwrite: true,
      });
      expect(mockedClient.create.mock.calls[0][2]).not.toHaveProperty('permissions');
    });
  });

  describe('#update', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass through non-config type requests', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const attributes = { title: 'Updated Dashboard' };
      await wrapperClient.update('dashboard', 'test-id', attributes);
      expect(mockedClient.update).toBeCalledWith('dashboard', 'test-id', attributes, {});
    });

    it('should pass through regular config requests', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const attributes = { 'regular.setting': 'updated_value' };
      await wrapperClient.update('config', '3.0.0', attributes);
      expect(mockedClient.update).toBeCalledWith('config', '3.0.0', attributes, {});
    });

    it('should update admin settings when user is dashboard admin', async () => {
      const wrapperClient = buildWrapperInstance(true, true);
      const attributes = { permissionControlledSetting: false };
      const mockResponse = {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        type: 'config',
        attributes,
        references: [],
      };

      mockedClient.update.mockResolvedValue(mockResponse);

      await wrapperClient.update('config', DASHBOARD_ADMIN_SETTINGS_ID, attributes);

      expect(mockedClient.update).toBeCalledWith(
        'config',
        DASHBOARD_ADMIN_SETTINGS_ID,
        attributes,
        {}
      );
    });

    it('should create admin settings if they do not exist during update', async () => {
      const wrapperClient = buildWrapperInstance(true, true);
      const attributes = { permissionControlledSetting: true };

      mockedClient.update.mockImplementation(() => {
        throw SavedObjectsErrorHelpers.createGenericNotFoundError(
          'config',
          DASHBOARD_ADMIN_SETTINGS_ID
        );
      });

      await wrapperClient.update('config', DASHBOARD_ADMIN_SETTINGS_ID, attributes);

      expect(mockedClient.create).toBeCalledWith('config', attributes, {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        overwrite: true,
        permissions: expect.any(Object),
      });
    });
  });

  describe('#bulkCreate', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass through regular bulk create requests', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const objects = [
        { type: 'dashboard', id: 'test-id', attributes: { title: 'Test Dashboard' } },
      ];

      await wrapperClient.bulkCreate(objects);

      expect(mockedClient.bulkCreate).toBeCalledWith(objects, undefined);
    });

    it('should throw error when trying to bulk create with admin settings ID', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const objects = [
        { type: 'dashboard', id: 'test-id', attributes: { title: 'Test Dashboard' } },
      ];

      await expect(
        wrapperClient.bulkCreate(objects, { id: DASHBOARD_ADMIN_SETTINGS_ID })
      ).rejects.toThrow('Bulk create is not supported for admin settings');
    });

    it('should throw error when trying to bulk create admin settings', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const objects = [
        {
          type: 'config',
          id: DASHBOARD_ADMIN_SETTINGS_ID,
          attributes: { permissionControlledSetting: true },
        },
      ];

      await expect(wrapperClient.bulkCreate(objects)).rejects.toThrow(
        'Bulk create is not supported for admin settings'
      );
    });
  });

  describe('#bulkUpdate', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass through regular bulk update requests', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const objects = [
        {
          type: 'dashboard',
          id: 'test-id',
          attributes: { title: 'Updated Dashboard' },
        },
      ];

      await wrapperClient.bulkUpdate(objects);

      expect(mockedClient.bulkUpdate).toBeCalledWith(objects, undefined);
    });

    it('should throw error when trying to bulk update admin settings', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const objects = [
        {
          type: 'config',
          id: DASHBOARD_ADMIN_SETTINGS_ID,
          attributes: { permissionControlledSetting: true },
        },
      ];

      await expect(wrapperClient.bulkUpdate(objects)).rejects.toThrow(
        'Bulk update is not supported for admin settings'
      );
    });
  });
});
