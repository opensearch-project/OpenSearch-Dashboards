/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggerMock } from '@osd/logging/target/mocks';
import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { WorkspaceUiSettingsClientWrapper } from './workspace_ui_settings_client_wrapper';
import { WORKSPACE_TYPE, CURRENT_WORKSPACE_PLACEHOLDER } from '../../../../core/server';
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
              [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: 'default-ds-workspace',
            },
          },
        });
      }
      return Promise.reject();
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

  it('should only return workspace ui settings if in a workspace', async () => {
    // Currently in a workspace
    // only return workspace ui settings
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ requestWorkspaceId: 'workspace-id' });

    const { wrappedClient } = createWrappedClient();

    const result = await wrappedClient.get('config', `${CURRENT_WORKSPACE_PLACEHOLDER}_3.0.0`);
    expect(result).toEqual({
      attributes: {
        defaultDashboard: 'default-dashboard-workspace',
        [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: 'default-ds-workspace',
      },
    });
  });

  it('should return global ui settings if NOT in a workspace', async () => {
    // Currently NOT in a workspace
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({});

    const { wrappedClient } = createWrappedClient();

    const result = await wrappedClient.get('config', `${CURRENT_WORKSPACE_PLACEHOLDER}_3.0.0`);
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

  it('should just update workspace ui settings if in a workspace', async () => {
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

    await wrappedClient.update('config', `${CURRENT_WORKSPACE_PLACEHOLDER}_3.0.0`, {
      [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: 'new-ds-workspace',
    });

    expect(clientMock.update).toHaveBeenCalledWith(
      WORKSPACE_TYPE,
      'workspace-id',
      {
        uiSettings: {
          defaultDashboard: 'default-dashboard-workspace',
          [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: 'new-ds-workspace',
        },
      },
      {}
    );
  });

  it('should update global ui settings', async () => {
    // Currently NOT in a workspace
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({});

    const { wrappedClient, clientMock } = createWrappedClient();

    await wrappedClient.update('config', `${CURRENT_WORKSPACE_PLACEHOLDER}_3.0.0`, {
      defaultDashboard: 'new-dashboard-id',
    });

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
    const config = await wrappedClient.get('config', `${CURRENT_WORKSPACE_PLACEHOLDER}_3.0.0`);
    expect(config).toEqual({
      attributes: {},
    });
    expect(logger.error).toBeCalledWith(
      `Unable to get workspaceObject with id: ${invalidWorkspaceId}`
    );
  });
});
