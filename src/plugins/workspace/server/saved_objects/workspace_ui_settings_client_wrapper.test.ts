/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggerMock } from '@osd/logging/target/mocks';
import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { WorkspaceUiSettingsClientWrapper } from './workspace_ui_settings_client_wrapper';
import {
  WORKSPACE_TYPE,
  CURRENT_WORKSPACE_PLACEHOLDER,
  SavedObjectsErrorHelpers,
} from '../../../../core/server';
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

  it('should just return workspace settings if trying to get workspace level settings in a workspace', async () => {
    // Currently in a workspace
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ requestWorkspaceId: 'workspace-id' });

    const { wrappedClient } = createWrappedClient();

    const result = await wrappedClient.get(`config`, `${CURRENT_WORKSPACE_PLACEHOLDER}_3.0.0`);
    expect(result).toEqual({
      attributes: {
        defaultDashboard: 'default-dashboard-workspace',
        [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: 'default-ds-workspace',
      },
    });
  });

  it('should return not found error if trying to get workspace level settings out of a workspace', async () => {
    let error;
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({});

    const { wrappedClient } = createWrappedClient();
    try {
      await wrappedClient.get(`config`, `${CURRENT_WORKSPACE_PLACEHOLDER}_3.0.0`);
    } catch (e) {
      error = e;
    }

    expect(SavedObjectsErrorHelpers.isNotFoundError(error)).toBe(true);
  });

  it('should update workspace ui settings if in a workspace', async () => {
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
      defaultDashboard: 'new-dashboard-id',
    });

    expect(clientMock.update).toHaveBeenCalledWith(
      WORKSPACE_TYPE,
      'workspace-id',
      {
        uiSettings: {
          defaultDashboard: 'new-dashboard-id',
          [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: 'default-ds-workspace',
        },
      },
      {}
    );
  });

  it('should throw error if try to update workspace level settings out of the workspace', async () => {
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({});

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
    let error;

    try {
      await wrappedClient.update('config', `${CURRENT_WORKSPACE_PLACEHOLDER}_3.0.0`, {
        defaultDashboard: 'new-dashboard-id',
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toEqual(
      ' It is forbidden to update workspace level uiSettings when out of a workspace'
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
});
