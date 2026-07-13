/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock, httpServerMock, savedObjectsClientMock } from '../../../server/mocks';
import { dynamicConfigServiceMock } from '../../../server/config/mocks';
import { PermissionControlledUiSettingsWrapper } from './permission_controlled_ui_settings_wrapper';
import { SavedObjectsErrorHelpers } from '../../../server';
import {
  DASHBOARD_ADMIN_SETTINGS_ID,
  CURRENT_USER_PLACEHOLDER,
  CURRENT_WORKSPACE_PLACEHOLDER,
} from '../utils';

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

  // Helper to build wrapper instance. The wrapper is only ever registered when
  // permission control is enabled, so the only knob tests need is whether the current
  // request's user is a dashboard admin.
  // adminToggle controls what the admin-scoped ui settings client reports for the
  // ENABLE_GLOBAL_SETTING_CONTROL key: 'on'/'off' = admin explicitly set it, 'unset' =
  // never set (so the gate falls back to the legacy dynamic config).
  const buildWrapperInstance = (
    isDashboardAdmin = true,
    adminToggle: 'on' | 'off' | 'unset' = 'unset'
  ) => {
    const wrapperInstance = new PermissionControlledUiSettingsWrapper(
      dynamicConfigServiceMock.createInternalSetupContract()
    );
    // Set isDashboardAdmin property on request
    (requestMock as any).isDashboardAdmin = isDashboardAdmin;

    // Stub the ui settings client the wrapper reads the admin toggle through.
    const uiSettingsClientMock = {
      getUserProvided: jest
        .fn()
        .mockResolvedValue(
          adminToggle === 'unset'
            ? {}
            : { enableGlobalSettingControl: { userValue: adminToggle === 'on' } }
        ),
    };
    wrapperInstance.setAsScopedUiSettingsClient(
      jest.fn().mockReturnValue(uiSettingsClientMock) as any
    );

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
      const wrapperClient = buildWrapperInstance();
      await wrapperClient.get('dashboard', 'test-id');
      expect(mockedClient.get).toHaveBeenCalledWith('dashboard', 'test-id');
    });

    it('should handle regular config requests', async () => {
      const wrapperClient = buildWrapperInstance();
      const mockResponse = {
        id: '3.0.0',
        type: 'config',
        attributes: { 'regular.setting': 'value' },
        references: [],
      };
      mockedClient.get.mockResolvedValue(mockResponse);

      const result = await wrapperClient.get('config', '3.0.0');

      expect(mockedClient.get).toHaveBeenCalledWith('config', '3.0.0');
      expect(result).toEqual(mockResponse);
    });

    it('should handle admin settings requests', async () => {
      const wrapperClient = buildWrapperInstance();
      const adminSettings = {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        type: 'config',
        attributes: { 'test.setting': 'admin_value' },
        references: [],
      };
      mockedClient.get.mockResolvedValue(adminSettings);

      const result = await wrapperClient.get('config', DASHBOARD_ADMIN_SETTINGS_ID);

      expect(mockedClient.get).toHaveBeenCalledWith('config', DASHBOARD_ADMIN_SETTINGS_ID);
      expect(result).toEqual(adminSettings);
    });

    it('should propagate errors other than not found', async () => {
      const wrapperClient = buildWrapperInstance();
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
      const wrapperClient = buildWrapperInstance();
      const attributes = { title: 'Test Dashboard' };
      await wrapperClient.create('dashboard', attributes);
      expect(mockedClient.create).toHaveBeenCalledWith('dashboard', attributes, {});
    });

    it('should pass through regular config requests', async () => {
      const wrapperClient = buildWrapperInstance();
      const attributes = { 'regular.setting': 'value' };
      await wrapperClient.create('config', attributes);
      expect(mockedClient.create).toHaveBeenCalledWith('config', attributes, {});
    });

    it('should create admin settings when user is dashboard admin', async () => {
      const wrapperClient = buildWrapperInstance();
      const attributes = { permissionControlledSetting: true };
      const mockResponse = {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        type: 'config',
        attributes,
        references: [],
      };

      mockedClient.create.mockResolvedValue(mockResponse);

      await wrapperClient.create('config', attributes, { id: DASHBOARD_ADMIN_SETTINGS_ID });

      expect(mockedClient.create).toHaveBeenCalledWith('config', attributes, {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        overwrite: true,
        permissions: expect.any(Object),
      });
    });

    it('should throw permission error when user is not dashboard admin', async () => {
      const wrapperClient = buildWrapperInstance(false);
      const attributes = { permission: true };

      await expect(
        wrapperClient.create('config', attributes, { id: DASHBOARD_ADMIN_SETTINGS_ID })
      ).rejects.toThrow('No permission for admin UI settings operations');
    });

    it('adds read-for-all ACL permissions when creating admin settings', async () => {
      // The wrapper is only registered when permission control is enabled, so admin
      // settings are always created with an ACL granting read to all users.
      const wrapperClient = buildWrapperInstance();
      const attributes = { permissionControlled: true };

      await wrapperClient.create('config', attributes, { id: DASHBOARD_ADMIN_SETTINGS_ID });

      expect(mockedClient.create).toHaveBeenCalledWith('config', attributes, {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        overwrite: true,
        permissions: { read: { users: ['*'] } },
      });
    });
  });

  describe('#update', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass through non-config type requests', async () => {
      const wrapperClient = buildWrapperInstance();
      const attributes = { title: 'Updated Dashboard' };
      await wrapperClient.update('dashboard', 'test-id', attributes);
      expect(mockedClient.update).toHaveBeenCalledWith('dashboard', 'test-id', attributes, {});
    });

    it('should pass through regular config requests', async () => {
      const wrapperClient = buildWrapperInstance();
      const attributes = { 'regular.setting': 'updated_value' };
      await wrapperClient.update('config', '3.0.0', attributes);
      expect(mockedClient.update).toHaveBeenCalledWith('config', '3.0.0', attributes, {});
    });

    it('should update admin settings when user is dashboard admin', async () => {
      const wrapperClient = buildWrapperInstance();
      const attributes = { permissionControlledSetting: false };
      const mockResponse = {
        id: DASHBOARD_ADMIN_SETTINGS_ID,
        type: 'config',
        attributes,
        references: [],
      };

      mockedClient.update.mockResolvedValue(mockResponse);

      await wrapperClient.update('config', DASHBOARD_ADMIN_SETTINGS_ID, attributes);

      expect(mockedClient.update).toHaveBeenCalledWith(
        'config',
        DASHBOARD_ADMIN_SETTINGS_ID,
        attributes,
        {}
      );
    });

    it('should create admin settings if they do not exist during update', async () => {
      const wrapperClient = buildWrapperInstance();
      const attributes = { permissionControlledSetting: true };

      mockedClient.update.mockImplementation(() => {
        throw SavedObjectsErrorHelpers.createGenericNotFoundError(
          'config',
          DASHBOARD_ADMIN_SETTINGS_ID
        );
      });

      await wrapperClient.update('config', DASHBOARD_ADMIN_SETTINGS_ID, attributes);

      expect(mockedClient.create).toHaveBeenCalledWith('config', attributes, {
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
      const wrapperClient = buildWrapperInstance();
      const objects = [
        { type: 'dashboard', id: 'test-id', attributes: { title: 'Test Dashboard' } },
      ];

      await wrapperClient.bulkCreate(objects);

      expect(mockedClient.bulkCreate).toHaveBeenCalledWith(objects, undefined);
    });

    it('should throw error when trying to bulk create with admin settings ID', async () => {
      const wrapperClient = buildWrapperInstance();
      const objects = [
        { type: 'dashboard', id: 'test-id', attributes: { title: 'Test Dashboard' } },
      ];

      await expect(
        wrapperClient.bulkCreate(objects, { id: DASHBOARD_ADMIN_SETTINGS_ID })
      ).rejects.toThrow('Bulk create is not supported for admin settings');
    });

    it('should throw error when trying to bulk create admin settings', async () => {
      const wrapperClient = buildWrapperInstance();
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
      const wrapperClient = buildWrapperInstance();
      const objects = [
        {
          type: 'dashboard',
          id: 'test-id',
          attributes: { title: 'Updated Dashboard' },
        },
      ];

      await wrapperClient.bulkUpdate(objects);

      expect(mockedClient.bulkUpdate).toHaveBeenCalledWith(objects, undefined);
    });

    it('should throw error when trying to bulk update admin settings', async () => {
      const wrapperClient = buildWrapperInstance();
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

  describe('global setting control gate', () => {
    const VERSION = '3.0.0';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    // clearAllMocks() resets call records but not implementations, so reset the write
    // mocks to plain success (a prior test may have set them to throw).
    const resetWriteMocks = () => {
      mockedClient.update.mockReset();
      mockedClient.create.mockReset();
      mockedClient.bulkUpdate.mockReset();
      mockedClient.bulkCreate.mockReset();
    };

    it('blocks a non-admin from updating the global config doc when the toggle is on', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'on');

      await expect(
        wrapperClient.update('config', VERSION, { 'some.setting': 'value' })
      ).rejects.toThrowError(/No permission to update global settings/);
      expect(mockedClient.update).not.toBeCalled();
    });

    it('blocks a non-admin from creating the global config doc when the toggle is on', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'on');

      await expect(
        wrapperClient.create('config', { 'some.setting': 'value' }, { id: VERSION })
      ).rejects.toThrowError(/No permission to update global settings/);
      expect(mockedClient.create).not.toBeCalled();
    });

    it('allows a dashboard admin to update the global config doc when the toggle is on', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(true, 'on');

      await wrapperClient.update('config', VERSION, { 'some.setting': 'value' });
      expect(mockedClient.update).toBeCalledWith(
        'config',
        VERSION,
        { 'some.setting': 'value' },
        {}
      );
    });

    it('allows a non-admin to update the global config doc when the toggle is off', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'off');

      await wrapperClient.update('config', VERSION, { 'some.setting': 'value' });
      expect(mockedClient.update).toBeCalledWith(
        'config',
        VERSION,
        { 'some.setting': 'value' },
        {}
      );
    });

    it('allows a non-admin write when the admin toggle was never set (legacy fallback allows)', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'unset');

      await wrapperClient.update('config', VERSION, { 'some.setting': 'value' });
      expect(mockedClient.update).toBeCalled();
    });

    // Regression tests for the bug where enabling enableGlobalSettingControl made
    // User/Workspace settings writes fail with 403. The gate uses isGlobalScope(docId),
    // which only returns false while the doc id still carries its scope prefix
    // (<current_user>_ / <current_workspace>_). This wrapper must therefore run before
    // the user/workspace wrappers that strip those prefixes (see its wrapper priority).
    it('does not gate a user-scoped config update even when the toggle is on', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'on');

      const userScopedId = `${CURRENT_USER_PLACEHOLDER}_${VERSION}`;
      await wrapperClient.update('config', userScopedId, { 'some.setting': 'value' });
      expect(mockedClient.update).toBeCalledWith(
        'config',
        userScopedId,
        { 'some.setting': 'value' },
        {}
      );
    });

    it('does not gate a workspace-scoped config update even when the toggle is on', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'on');

      const workspaceScopedId = `${CURRENT_WORKSPACE_PLACEHOLDER}_${VERSION}`;
      await wrapperClient.update('config', workspaceScopedId, { 'some.setting': 'value' });
      expect(mockedClient.update).toBeCalledWith(
        'config',
        workspaceScopedId,
        { 'some.setting': 'value' },
        {}
      );
    });

    it('does not gate a user-scoped config create even when the toggle is on', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'on');

      const userScopedId = `${CURRENT_USER_PLACEHOLDER}_${VERSION}`;
      await wrapperClient.create('config', { 'some.setting': 'value' }, { id: userScopedId });
      expect(mockedClient.create).toBeCalledWith(
        'config',
        { 'some.setting': 'value' },
        { id: userScopedId }
      );
    });

    it('does not gate a user-scoped config bulkUpdate even when the toggle is on', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'on');

      const userScopedId = `${CURRENT_USER_PLACEHOLDER}_${VERSION}`;
      await wrapperClient.bulkUpdate([
        { type: 'config', id: userScopedId, attributes: { 'some.setting': 'value' } },
      ]);
      expect(mockedClient.bulkUpdate).toBeCalled();
    });

    it('does not gate a workspace-scoped config bulkCreate even when the toggle is on', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'on');

      const workspaceScopedId = `${CURRENT_WORKSPACE_PLACEHOLDER}_${VERSION}`;
      await wrapperClient.bulkCreate([
        { type: 'config', id: workspaceScopedId, attributes: { 'some.setting': 'value' } },
      ]);
      expect(mockedClient.bulkCreate).toBeCalled();
    });

    it('blocks a non-admin bulkUpdate that targets the global config doc', async () => {
      resetWriteMocks();
      const wrapperClient = buildWrapperInstance(false, 'on');

      await expect(
        wrapperClient.bulkUpdate([
          { type: 'config', id: VERSION, attributes: { 'some.setting': 'value' } },
        ])
      ).rejects.toThrowError(/No permission to update global settings/);
      expect(mockedClient.bulkUpdate).not.toBeCalled();
    });
  });
});
