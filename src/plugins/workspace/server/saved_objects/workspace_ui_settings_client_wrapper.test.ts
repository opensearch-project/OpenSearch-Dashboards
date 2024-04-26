/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { WorkspaceUiSettingsClientWrapper } from './workspace_ui_settings_client_wrapper';
import { WORKSPACE_TYPE } from '../../../../core/server';

import * as utils from '../../../../core/server/utils';

jest.mock('../../../../core/server/utils');

describe('WorkspaceUiSettingsClientWrapper', () => {
  const createWrappedClient = () => {
    const clientMock = savedObjectsClientMock.create();
    const getClientMock = jest.fn().mockReturnValue(clientMock);
    const requestHandlerContext = coreMock.createRequestHandlerContext();
    const requestMock = httpServerMock.createOpenSearchDashboardsRequest();

    clientMock.get.mockImplementation(async (type, id) => {
      if (type === 'config') {
        return Promise.resolve({
          id,
          references: [],
          type: 'config',
          attributes: {
            defaultIndex: 'default-index-global',
          },
        });
      } else if (type === WORKSPACE_TYPE) {
        return Promise.resolve({
          id,
          references: [],
          type: WORKSPACE_TYPE,
          attributes: {
            uiSettings: {
              defaultIndex: 'default-index-workspace',
            },
          },
        });
      }
      return Promise.reject();
    });

    const wrapper = new WorkspaceUiSettingsClientWrapper();
    wrapper.setScopedClient(getClientMock);

    return {
      wrappedClient: wrapper.wrapperFactory({
        client: clientMock,
        request: requestMock,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      }),
      clientMock,
    };
  };

  it('should return workspace ui settings if in a workspace', async () => {
    // Currently in a workspace
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ requestWorkspaceId: 'workspace-id' });

    const { wrappedClient } = createWrappedClient();

    const result = await wrappedClient.get('config', '3.0.0');
    expect(result).toEqual({
      id: '3.0.0',
      references: [],
      type: 'config',
      attributes: {
        defaultIndex: 'default-index-workspace',
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
        defaultIndex: 'default-index-global',
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
          defaultIndex: 'new-index-id',
        },
      },
    });

    await wrappedClient.update('config', '3.0.0', { defaultIndex: 'new-index-id' });

    expect(clientMock.update).toHaveBeenCalledWith(
      WORKSPACE_TYPE,
      'workspace-id',
      {
        uiSettings: { defaultIndex: 'new-index-id' },
      },
      {}
    );
  });

  it('should update global ui settings', async () => {
    // Currently NOT in a workspace
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({});

    const { wrappedClient, clientMock } = createWrappedClient();

    await wrappedClient.update('config', '3.0.0', { defaultIndex: 'new-index-id' });

    expect(clientMock.update).toHaveBeenCalledWith(
      'config',
      '3.0.0',
      {
        defaultIndex: 'new-index-id',
      },
      {}
    );
  });
});
