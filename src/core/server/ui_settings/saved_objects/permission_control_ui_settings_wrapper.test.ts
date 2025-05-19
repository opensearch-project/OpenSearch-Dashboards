/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  coreMock,
  httpServerMock,
  savedObjectsClientMock,
} from 'opensearch-dashboards/server/mocks';
import { PermissionControlUiSettingsWrapper } from './permission_control_ui_settings_wrapper';
import { SavedObjectsErrorHelpers } from 'opensearch-dashboards/server/saved_objects';

// Mock the getWorkspaceState function and pkg
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

// Mock the uiSettingWithPermission
jest.mock('./ui_settings_permissions', () => ({
  uiSettingWithPermission: {
    'test.setting': { value: 'default_value' },
    'test.setting2': { value: 'default_value2' },
  },
}));

describe('PermissionControlUiSettingsWrapper', () => {
  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const mockedClient = savedObjectsClientMock.create();
  const requestMock = httpServerMock.createOpenSearchDashboardsRequest();

  // Helper to build wrapper instance
  const buildWrapperInstance = (permissionEnabled: boolean, isDashboardAdmin = true) => {
    const wrapperInstance = new PermissionControlUiSettingsWrapper(permissionEnabled);
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
      expect(mockedClient.get).toBeCalledWith('dashboard', 'test-id', {});
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

      expect(mockedClient.get).toBeCalledWith('config', '3.0.0', {});
      expect(result).toEqual(mockResponse);
    });

    it('should merge admin settings with regular settings for dashboard admin', async () => {
      const wrapperClient = buildWrapperInstance(true, true);

      const regularSettings = {
        id: '3.0.0',
        type: 'config',
        attributes: { 'regular.setting': 'value' },
        references: [],
      };

      const adminSettings = {
        id: '_dashboard_admin',
        type: 'config',
        attributes: { 'test.setting': 'admin_value' },
        references: [],
      };

      mockedClient.get.mockImplementation((type, id) => {
        if (id === '3.0.0') {
          return Promise.resolve(regularSettings) as any;
        } else if (id === '_dashboard_admin') {
          return Promise.resolve(adminSettings) as any;
        }
      });

      const result = await wrapperClient.get('config', '3.0.0');

      expect(mockedClient.get).toHaveBeenNthCalledWith(1, 'config', '_dashboard_admin', {});
      expect(mockedClient.get).toHaveBeenNthCalledWith(2, 'config', '3.0.0', {});

      expect(result).toEqual({
        ...regularSettings,
        attributes: {
          'regular.setting': 'value',
          'test.setting': { value: 'admin_value', hasPermission: true },
        },
      });
    });

    it('should handle case when admin settings do not exist', async () => {
      const wrapperClient = buildWrapperInstance(true, true);

      const regularSettings = {
        id: '3.0.0',
        type: 'config',
        attributes: { 'regular.setting': 'value' },
        references: [],
      };

      mockedClient.get.mockImplementation((type, id) => {
        if (id === '3.0.0') {
          return Promise.resolve(regularSettings) as any;
        } else if (id === '_dashboard_admin') {
          throw SavedObjectsErrorHelpers.createGenericNotFoundError('config', '_dashboard_admin');
        }
      });

      const result = await wrapperClient.get('config', '3.0.0');

      expect(mockedClient.get).toHaveBeenNthCalledWith(1, 'config', '_dashboard_admin', {});
      expect(mockedClient.get).toHaveBeenNthCalledWith(2, 'config', '3.0.0', {});

      expect(result).toEqual(regularSettings);
    });

    it('should propagate errors other than not found', async () => {
      const wrapperClient = buildWrapperInstance(true, true);

      const error = new Error('Database error');

      mockedClient.get.mockImplementation((type, id) => {
        if (id === '_dashboard_admin') {
          return Promise.reject(error) as any;
        }
      });

      await expect(wrapperClient.get('config', '3.0.0')).rejects.toThrow('Database error');
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

    it('should handle regular attributes for config type', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const attributes = { 'regular.setting': 'value' };
      await wrapperClient.create('config', attributes);
      expect(mockedClient.create).toBeCalledWith('config', attributes, {});
    });

    it('should create admin settings for permission attributes when user is dashboard admin', async () => {
      const wrapperClient = buildWrapperInstance(true, true);
      const attributes = {
        'regular.setting': 'value',
        'test.setting': 'admin_value',
      };

      await wrapperClient.create('config', attributes);

      // Should create admin settings
      expect(mockedClient.create).toHaveBeenNthCalledWith(
        1,
        'config',
        { 'test.setting': 'admin_value' },
        {
          overwrite: true,
          id: '_dashboard_admin',
          permissions: expect.any(Object),
        }
      );

      // Should create regular settings
      expect(mockedClient.create).toHaveBeenNthCalledWith(
        2,
        'config',
        { 'regular.setting': 'value' },
        {}
      );
    });

    it('should not create admin settings when user is not dashboard admin', async () => {
      const wrapperClient = buildWrapperInstance(true, false);
      const attributes = {
        'regular.setting': 'value',
        'test.setting': 'admin_value',
      };

      await wrapperClient.create('config', attributes);

      // Should only create regular settings
      expect(mockedClient.create).toBeCalledTimes(1);
      expect(mockedClient.create).toBeCalledWith('config', { 'regular.setting': 'value' }, {});
    });

    it('should not add permissions when permission control is disabled', async () => {
      const wrapperClient = buildWrapperInstance(false, true);
      const attributes = {
        'regular.setting': 'value',
        'test.setting': 'admin_value',
      };

      await wrapperClient.create('config', attributes);

      // Should create admin settings without permissions
      expect(mockedClient.create).toHaveBeenNthCalledWith(
        1,
        'config',
        { 'test.setting': 'admin_value' },
        {
          overwrite: true,
          id: '_dashboard_admin',
        }
      );
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

    it('should handle regular attributes for config type', async () => {
      const wrapperClient = buildWrapperInstance(true);
      const attributes = { 'regular.setting': 'updated_value' };
      await wrapperClient.update('config', '3.0.0', attributes);
      expect(mockedClient.update).toBeCalledWith('config', '3.0.0', attributes, {});
    });

    it('should update admin settings for permission attributes', async () => {
      const wrapperClient = buildWrapperInstance(true, true);
      const attributes = {
        'regular.setting': 'updated_value',
        'test.setting': 'updated_admin_value',
      };

      await wrapperClient.update('config', '3.0.0', attributes);

      // Should update admin settings
      expect(mockedClient.update).toHaveBeenNthCalledWith(
        1,
        'config',
        '_dashboard_admin',
        { 'test.setting': 'updated_admin_value' },
        {}
      );

      // Should update regular settings
      expect(mockedClient.update).toHaveBeenNthCalledWith(
        2,
        'config',
        '3.0.0',
        { 'regular.setting': 'updated_value' },
        {}
      );
    });

    it('should create admin settings if they do not exist during update', async () => {
      const wrapperClient = buildWrapperInstance(true, true);
      const attributes = {
        'regular.setting': 'updated_value',
        'test.setting': 'updated_admin_value',
      };

      mockedClient.update.mockImplementation((type, id, attrs) => {
        if (id === '_dashboard_admin') {
          throw SavedObjectsErrorHelpers.createGenericNotFoundError('config', '_dashboard_admin');
        }
        return Promise.resolve({ id, type, attributes: attrs, references: [] });
      });

      await wrapperClient.update('config', '3.0.0', attributes);

      // Should try to update admin settings
      expect(mockedClient.update).toHaveBeenCalledWith(
        'config',
        '_dashboard_admin',
        { 'test.setting': 'updated_admin_value' },
        {}
      );

      // Should create admin settings since they don't exist
      expect(mockedClient.create).toHaveBeenCalledWith(
        'config',
        { 'test.setting': 'updated_admin_value' },
        {
          overwrite: true,
          id: '_dashboard_admin',
          permissions: expect.any(Object),
        }
      );

      // Should update regular settings
      expect(mockedClient.update).toHaveBeenCalledWith(
        'config',
        '3.0.0',
        { 'regular.setting': 'updated_value' },
        {}
      );
    });

    it('should propagate errors other than not found during admin settings update', async () => {
      const wrapperClient = buildWrapperInstance(true, true);
      const attributes = {
        'regular.setting': 'updated_value',
        'test.setting': 'updated_admin_value',
      };

      const error = new Error('Database error');
      mockedClient.update.mockImplementation((type, id, attrs) => {
        if (id === '_dashboard_admin') {
          return Promise.reject(error);
        }
        return Promise.resolve({ id, type, attributes: attrs, references: [] });
      });

      await expect(wrapperClient.update('config', '3.0.0', attributes)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
