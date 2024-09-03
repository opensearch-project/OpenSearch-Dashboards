/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { UserUISettingsClientWrapper } from './user_ui_settings_client_wrapper';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { loggerMock } from '../../../../core/server/logging/logger.mock';
import { CURRENT_USER } from '../../../../core/server';

jest.mock('../utils', () => {
  return {
    extractUserName: jest.fn().mockReturnValue('test_user'),
  };
});

describe('UserUISettingsClientWrapper', () => {
  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const mockedClient = savedObjectsClientMock.create();
  const requestMock = httpServerMock.createOpenSearchDashboardsRequest();

  const buildWrapperInstance = (permissionEnabled: boolean) => {
    const wrapperInstance = new UserUISettingsClientWrapper(loggerMock.create(), permissionEnabled);
    const wrapperClient = wrapperInstance.wrapperFactory({
      client: mockedClient,
      typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      request: requestMock,
    });
    return wrapperClient;
  };

  const wrapperClient = buildWrapperInstance(false);

  describe('#get', () => {
    // beforeEach
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // test getUiSettings
    it('should skip replacing user id if not user level config', async () => {
      await wrapperClient.get('config', '3.0.0');

      expect(mockedClient.get).toBeCalledWith('config', '3.0.0', {});
    });

    it('should skip replacing user id if type is not config', async () => {
      await wrapperClient.get('config1', `${CURRENT_USER}_3.0.0`);

      expect(mockedClient.get).toBeCalledWith('config1', `${CURRENT_USER}_3.0.0`, {});
    });

    it('should replace user id placeholder with real user id', async () => {
      await wrapperClient.get('config', `${CURRENT_USER}_3.0.0`);

      expect(mockedClient.get).toBeCalledWith('config', 'test_user', {});
    });
  });

  describe('#update', () => {
    // beforeEach
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // test getUiSettings
    it('should skip replacing user id if not user level config', async () => {
      await wrapperClient.update('config', '3.0.0', {});

      expect(mockedClient.update).toBeCalledWith('config', '3.0.0', {}, {});
    });

    it('should skip replacing user id if type is not config', async () => {
      await wrapperClient.update('config1', `${CURRENT_USER}_3.0.0`, {});

      expect(mockedClient.update).toBeCalledWith('config1', `${CURRENT_USER}_3.0.0`, {}, {});
    });

    it('should replace user id placeholder with real user id', async () => {
      await wrapperClient.update('config', `${CURRENT_USER}_3.0.0`, {});

      expect(mockedClient.update).toBeCalledWith('config', 'test_user', {}, {});
    });
  });

  describe('#create', () => {
    // beforeEach
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // test getUiSettings
    it('should skip replacing user id if not user level config', async () => {
      await wrapperClient.create('config', {}, { id: '3.0.0' });

      expect(mockedClient.create).toBeCalledWith('config', {}, { id: '3.0.0' });
    });

    it('should skip replacing user id if type is not config', async () => {
      await wrapperClient.create('config1', {}, { id: `${CURRENT_USER}_3.0.0` });

      expect(mockedClient.create).toBeCalledWith('config1', {}, { id: `${CURRENT_USER}_3.0.0` });
    });

    it('should replace user id placeholder with real user id', async () => {
      await wrapperClient.create('config', {}, { id: `${CURRENT_USER}_3.0.0` });

      expect(mockedClient.create).toBeCalledWith(
        'config',
        {},
        {
          id: 'test_user',
          references: [
            {
              id: 'test_user',
              name: 'test_user',
              type: 'user',
            },
          ],
        }
      );
    });

    it('should replace user id placeholder with real user id and permission enabled', async () => {
      const wrapperClientWithPermission = buildWrapperInstance(true);
      await wrapperClientWithPermission.create('config', {}, { id: `${CURRENT_USER}_3.0.0` });

      expect(mockedClient.create).toBeCalledWith(
        'config',
        {},
        {
          id: 'test_user',
          references: [
            {
              id: 'test_user',
              name: 'test_user',
              type: 'user',
            },
          ],
          permissions: {
            write: {
              users: ['test_user'],
            },
          },
        }
      );
    });
  });

  describe('#find', () => {
    mockedClient.find.mockResolvedValue({
      saved_objects: [
        {
          score: 1,
          id: 'test_user_4.0.0',
          type: 'config',
          attributes: {},
          references: [],
        },
        {
          score: 1,
          id: 'test_user_4.1.0',
          type: 'config',
          attributes: {},
          references: [],
        },
      ],
      total: 2,
      per_page: 10,
      page: 1,
    });
    // beforeEach
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should replace user id', async () => {
      const resp = await wrapperClient.find({
        type: 'config',
        hasReference: {
          type: 'user',
          id: CURRENT_USER,
        },
      });

      expect(resp.saved_objects).toHaveLength(2);
      expect(resp.saved_objects[0].id).toEqual('4.0.0');
      expect(resp.saved_objects[1].id).toEqual('4.1.0');

      expect(mockedClient.find).toBeCalledWith({
        type: 'config',
        hasReference: {
          type: 'user',
          id: 'test_user',
        },
      });
    });

    it('should not replace user id if not hasReference', async () => {
      await wrapperClient.find({
        type: 'config',
      });

      expect(mockedClient.find).toBeCalledWith({
        type: 'config',
      });
    });

    it('should not replace user id if hasReference do not contains user id placeholder', async () => {
      await wrapperClient.find({
        type: 'config',
        hasReference: {
          type: 'user',
          id: 'test',
        },
      });

      expect(mockedClient.find).toBeCalledWith({
        type: 'config',
        hasReference: {
          type: 'user',
          id: 'test',
        },
      });
    });
  });
});

describe('UserUISettingsClientWrapper - security not enabled', () => {
  // security not enabled
  beforeEach(() => {
    jest.mock('../utils');
  });

  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const mockedClient = savedObjectsClientMock.create();
  const requestMock = httpServerMock.createOpenSearchDashboardsRequest();

  const buildWrapperInstance = (permissionEnabled: boolean) => {
    const wrapperInstance = new UserUISettingsClientWrapper(loggerMock.create(), permissionEnabled);
    const wrapperClient = wrapperInstance.wrapperFactory({
      client: mockedClient,
      typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      request: requestMock,
    });
    return wrapperClient;
  };

  const wrapperClient = buildWrapperInstance(false);

  describe('#get', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should replace user id placeholder with version', async () => {
      await wrapperClient.get('config', `${CURRENT_USER}_3.0.0`);

      expect(mockedClient.get).toBeCalledWith('config', '3.0.0', {});
    });
  });

  describe('#update', () => {
    it('should replace user id placeholder with version', async () => {
      await wrapperClient.update('config', `${CURRENT_USER}_3.0.0`, {});

      expect(mockedClient.update).toBeCalledWith('config', '3.0.0', {}, {});
    });
  });

  describe('#create', () => {
    it('should replace user id placeholder with version', async () => {
      await wrapperClient.create('config', {}, { id: `${CURRENT_USER}_3.0.0` });

      expect(mockedClient.create).toBeCalledWith(
        'config',
        {},
        {
          id: '3.0.0',
        }
      );
    });
  });
});
