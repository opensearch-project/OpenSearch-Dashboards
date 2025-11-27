/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock, httpServerMock, savedObjectsClientMock } from '../../../server/mocks';
import { DynamicConfigControlledUiSettingsWrapper } from './dynamic_config_controlled_ui_settings_wrapper';
import { SavedObjectsErrorHelpers } from '../../../server';
import { dynamicConfigServiceMock } from '../../config/dynamic_config_service.mock';

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

describe('DynamicConfigControlledUiSettingsWrapper', () => {
  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const mockedClient = savedObjectsClientMock.create();
  const requestMock = httpServerMock.createOpenSearchDashboardsRequest();
  const dynamicConfigService = dynamicConfigServiceMock.createInternalSetupContract();

  // Helper to build wrapper instance
  const buildWrapperInstance = (isDashboardAdmin = true, globalScopeEditable = true) => {
    const getConfigMock = jest.fn().mockResolvedValue({
      globalScopeEditable: {
        enabled: globalScopeEditable,
      },
    });
    jest.spyOn(dynamicConfigService, 'getStartService').mockResolvedValue({
      ...dynamicConfigService.getStartService(),
      getAsyncLocalStore: jest.fn(),
      getClient: () => ({
        getConfig: getConfigMock,
        bulkGetConfigs: jest.fn(),
        listConfigs: jest.fn(),
      }),
    });

    const wrapperInstance = new DynamicConfigControlledUiSettingsWrapper(dynamicConfigService);

    // Set isDashboardAdmin property on request
    (requestMock as any).isDashboardAdmin = isDashboardAdmin;

    const wrapperClient = wrapperInstance.wrapperFactory({
      client: mockedClient,
      typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      request: requestMock,
    });
    return wrapperClient;
  };

  describe('#create', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass through non-config type requests', async () => {
      const wrapperClient = buildWrapperInstance();
      await wrapperClient.get('dashboard', 'test-id');
      expect(mockedClient.get).toBeCalledWith('dashboard', 'test-id');
    });

    it('should handle regular config requests', async () => {
      const wrapperClient = buildWrapperInstance();
      const mockResponse = {
        id: '3.0.0',
        type: 'config',
        attributes: { 'csv:quoteValues': 'true' },
        references: [],
      };
      mockedClient.get.mockResolvedValue(mockResponse);

      const result = await wrapperClient.get('config', '3.0.0');

      expect(mockedClient.get).toBeCalledWith('config', '3.0.0');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('#update', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass through non-config type requests', async () => {
      const wrapperClient = buildWrapperInstance();
      const attributes = { 'csv:quoteValues': 'true' };
      await wrapperClient.update('dashboard', 'test-id', attributes);
      expect(mockedClient.update).toBeCalledWith('dashboard', 'test-id', attributes, {});
    });

    it('should pass through regular config requests when globalScopeEditable is enabled', async () => {
      const wrapperClient = buildWrapperInstance();
      const attributes = { 'csv:quoteValues': 'true' };
      await wrapperClient.update('config', '3.0.0', attributes);
      expect(mockedClient.update).toBeCalledWith('config', '3.0.0', attributes, {});
    });
    it('should only consider global ui settings updates', async () => {
      const wrapperClient = buildWrapperInstance(false, false);
      const attributes = { 'csv:quoteValues': 'true' };
      await wrapperClient.update('config', '<current_user>_3.0.0', attributes);
      expect(mockedClient.update).toBeCalledWith('config', '<current_user>_3.0.0', attributes, {});
    });

    it('should update global settings when user is dashboard admin even globalScopeEditable is disabled', async () => {
      const wrapperClient = buildWrapperInstance(true, false);
      const attributes = { 'csv:quoteValues': 'true' };
      const mockResponse = {
        id: '3.0.0',
        type: 'config',
        attributes,
        references: [],
      };

      mockedClient.update.mockResolvedValue(mockResponse);

      await wrapperClient.update('config', '3.0.0', attributes);

      expect(mockedClient.update).toBeCalledWith('config', '3.0.0', attributes, {});
    });

    it('should throw error when user is not dashboard admin and globalScopeEditable is disabled', async () => {
      const wrapperClient = buildWrapperInstance(false, false);
      const attributes = { permissionControlledSetting: true };

      mockedClient.update.mockImplementation(() => {
        throw SavedObjectsErrorHelpers.createGenericNotFoundError('config', '3.0.0');
      });

      await expect(wrapperClient.update('config', '3.0.0', attributes)).rejects.toThrow(
        'No permission for UI settings operations'
      );
    });
  });

  describe('#bulkUpdate', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass through bulk update requests', async () => {
      const attributes = { 'csv:quoteValues': 'true' };
      const wrapperClient = buildWrapperInstance();
      const objects = [
        {
          type: 'config',
          id: '3.0.0',
          attributes,
        },
      ];

      await wrapperClient.bulkUpdate(objects);

      expect(mockedClient.bulkUpdate).toBeCalledWith(objects);
    });
  });
});
