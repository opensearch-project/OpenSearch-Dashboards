/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggerMock } from '@osd/logging/target/mocks';
import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { WorkspaceUiSettingsClientWrapper } from './workspace_ui_settings_client_wrapper';
import { SavedObjectsErrorHelpers, WORKSPACE_TYPE } from '../../../../core/server';
import {
  DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
  DEFAULT_INDEX_PATTERN_UI_SETTINGS_ID,
} from '../../../data_source_management/common';

import * as utils from '../../../../core/server/utils';

jest.mock('../../../../core/server/utils');

describe('WorkspaceUiSettingsClientWrapper', () => {
  const createWrappedClient = () => {
    const clientMock = savedObjectsClientMock.create();
    const getClientMock = jest.fn().mockReturnValue(clientMock);
    const requestHandlerContext = coreMock.createRequestHandlerContext();
    const requestMock = httpServerMock.createOpenSearchDashboardsRequest();
    const logger = loggerMock.create();

    clientMock.get.mockImplementation(async (type, id) => {
      if (type === 'config') {
        return Promise.resolve({
          id,
          references: [],
          type: 'config',
          attributes: {
            defaultDashboard: 'default-dashboard-global',
            [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: 'default-ds-global',
            [DEFAULT_INDEX_PATTERN_UI_SETTINGS_ID]: 'default-index-global',
          },
        });
      } else if (type === WORKSPACE_TYPE) {
        return Promise.resolve({
          id,
          references: [],
          type: WORKSPACE_TYPE,
          attributes: {
            uiSettings: {
              defaultDashboard: 'default-dashboard-workspace',
            },
          },
        });
      }
      return Promise.reject();
    });

    clientMock.bulkGet.mockImplementation(async (savedObjectsToGet) => {
      return {
        saved_objects: [
          {
            id: 'workspace-1',
            type: WORKSPACE_TYPE,
            references: [],
            attributes: {
              uiSettings: {
                defaultDashboard: 'default-dashboard-workspace',
                defaultIndex: 'index-pattern-1',
              },
            },
          },
        ].filter(
          (item) =>
            !!savedObjectsToGet?.find(
              (objectToGet) => objectToGet.id === item.id && objectToGet.type === item.type
            )
        ),
      };
    });

    const wrapper = new WorkspaceUiSettingsClientWrapper(logger);
    wrapper.setScopedClient(getClientMock);

    return {
      wrappedClient: wrapper.wrapperFactory({
        client: clientMock,
        request: requestMock,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      }),
      clientMock,
      logger,
    };
  };

  it('should return workspace ui settings and should return workspace default data / index pattern source and not extend global if in a workspace', async () => {
    // Currently in a workspace
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ requestWorkspaceId: 'workspace-id' });

    const { wrappedClient } = createWrappedClient();

    const result = await wrappedClient.get('config', '3.0.0');
    expect(result).toEqual({
      id: '3.0.0',
      references: [],
      type: 'config',
      attributes: {
        defaultDashboard: 'default-dashboard-workspace',
        [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: undefined,
        [DEFAULT_INDEX_PATTERN_UI_SETTINGS_ID]: undefined,
      },
    });
  });

  it('should return global ui settings if NOT in a workspace', async () => {
    // Currently NOT in a workspace
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({});

    const { wrappedClient } = createWrappedClient();

    const result = await wrappedClient.get('config', '3.0.0');
    expect(result).toEqual({
      id: '3.0.0',
      references: [],
      type: 'config',
      attributes: {
        defaultDashboard: 'default-dashboard-global',
        [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: 'default-ds-global',
        [DEFAULT_INDEX_PATTERN_UI_SETTINGS_ID]: 'default-index-global',
      },
    });
  });

  it('should update workspace ui settings', async () => {
    // Currently in a workspace
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ requestWorkspaceId: 'workspace-id' });

    const { wrappedClient, clientMock } = createWrappedClient();

    clientMock.update.mockResolvedValue({
      id: 'workspace-id',
      references: [],
      type: WORKSPACE_TYPE,
      attributes: {
        uiSettings: {
          defaultDashboard: 'new-dashboard-id',
        },
      },
    });

    await wrappedClient.update('config', '3.0.0', { defaultDashboard: 'new-dashboard-id' });

    expect(clientMock.update).toHaveBeenCalledWith(
      WORKSPACE_TYPE,
      'workspace-id',
      {
        uiSettings: { defaultDashboard: 'new-dashboard-id' },
      },
      {}
    );
  });

  it('should update global ui settings', async () => {
    // Currently NOT in a workspace
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({});

    const { wrappedClient, clientMock } = createWrappedClient();

    await wrappedClient.update('config', '3.0.0', { defaultDashboard: 'new-dashboard-id' });

    expect(clientMock.update).toHaveBeenCalledWith(
      'config',
      '3.0.0',
      {
        defaultDashboard: 'new-dashboard-id',
      },
      {}
    );
  });

  it('should not throw error if the workspace id is not valid', async () => {
    const invalidWorkspaceId = 'invalid-workspace-id';
    // Currently in a workspace
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: invalidWorkspaceId });

    const { wrappedClient, clientMock, logger } = createWrappedClient();
    clientMock.get.mockImplementation(async (type, id) => {
      if (type === 'config') {
        return Promise.resolve({
          id,
          references: [],
          type: 'config',
          attributes: {
            defaultDashboard: 'new-dashboard-id',
          },
        });
      }
      return Promise.reject('not found');
    });

    const config = await wrappedClient.get('config', '3.0.0');
    expect(config).toEqual({
      attributes: {
        defaultDashboard: 'new-dashboard-id',
      },
      id: '3.0.0',
      references: [],
      type: 'config',
    });
    expect(logger.error).toBeCalledWith(
      `Unable to get workspaceObject with id: ${invalidWorkspaceId}`
    );
  });

  it('should throw bad request error when not permitted to update ui settings', async () => {
    const { wrappedClient, clientMock } = createWrappedClient();
    clientMock.bulkUpdate.mockImplementation(async () => {
      throw new Error('Failed to update ui setting');
    });
    clientMock.get.mockImplementation(async (type, id) => {
      if (type === 'index-pattern') {
        return Promise.resolve({
          id: 'index-pattern-1',
          references: [],
          type: 'index-pattern',
          attributes: {},
          workspaces: ['workspace-1'],
        });
      }
      return Promise.reject('not found');
    });

    let error;
    try {
      await wrappedClient.delete('index-pattern', 'index-pattern-1');
    } catch (e) {
      error = e;
    }
    expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBe(true);
  });

  it('should able to delete global index pattern', async () => {
    const { wrappedClient, clientMock } = createWrappedClient();
    clientMock.get.mockImplementation(async (type) => {
      if (type === 'index-pattern') {
        return Promise.resolve({
          id: 'global-index-pattern-1',
          references: [],
          type: 'index-pattern',
          attributes: {},
        });
      }
      return Promise.reject('not found');
    });

    let error;
    try {
      await wrappedClient.delete('index-pattern', 'global-index-pattern-1');
    } catch (e) {
      error = e;
    }
    expect(error).toBeUndefined();
    expect(clientMock.delete).toHaveBeenCalled();
  });

  it('should able to delete not index pattern saved objects', async () => {
    const { wrappedClient, clientMock } = createWrappedClient();

    let error;
    try {
      await wrappedClient.delete('workspace', 'workspace-1');
    } catch (e) {
      error = e;
    }
    expect(error).toBeUndefined();
    expect(clientMock.delete).toHaveBeenCalled();
  });

  it('should able to delete global index pattern if permitted', async () => {
    const { wrappedClient, clientMock } = createWrappedClient();

    clientMock.get.mockImplementation(async (type, id) => {
      if (type === 'config') {
        return Promise.resolve({
          id,
          references: [],
          type: 'config',
          attributes: {
            defaultDashboard: 'new-dashboard-id',
            defaultIndex: 'index-pattern-1',
          },
          workspaces: ['workspace-1'],
        });
      } else if (type === 'index-pattern') {
        return Promise.resolve({
          id: 'index-pattern-1',
          references: [],
          type: 'index-pattern',
          attributes: {},
          workspaces: ['workspace-1'],
        });
      }
      return Promise.reject('not found');
    });

    let error;
    try {
      await wrappedClient.delete('index-pattern', 'index-pattern-1');
    } catch (e) {
      error = e;
    }
    expect(error).toBeUndefined();
    expect(clientMock.delete).toHaveBeenCalled();
  });
});
