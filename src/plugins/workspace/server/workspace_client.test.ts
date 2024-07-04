/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceClient } from './workspace_client';

import { coreMock, httpServerMock } from '../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../data_source/common';
import { SavedObjectsServiceStart } from '../../../core/server';
import { IRequestDetail } from './types';

const coreSetup = coreMock.createSetup();

const mockWorkspaceId = 'workspace_id';
const mockWorkspaceName = 'workspace_name';

jest.mock('./utils', () => ({
  generateRandomId: () => mockWorkspaceId,
  getDataSourcesList: jest.fn().mockResolvedValue([
    {
      id: 'id1',
    },
    {
      id: 'id2',
    },
  ]),
}));

describe('#WorkspaceClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const find = jest.fn();
  const addToWorkspaces = jest.fn();
  const deleteFromWorkspaces = jest.fn();
  const savedObjects = ({
    ...coreSetup.savedObjects,
    getScopedClient: () => ({
      find,
      addToWorkspaces,
      deleteFromWorkspaces,
      get: jest.fn().mockResolvedValue({
        attributes: {
          name: mockWorkspaceName,
        },
      }),
    }),
  } as unknown) as SavedObjectsServiceStart;

  const mockRequestDetail = ({
    request: httpServerMock.createOpenSearchDashboardsRequest(),
    context: coreMock.createRequestHandlerContext(),
    logger: {},
  } as unknown) as IRequestDetail;

  it('create# should not call addToWorkspaces if no data sources passed', async () => {
    const client = new WorkspaceClient(coreSetup);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.create(mockRequestDetail, {
      permissions: {},
      dataSources: [],
      name: mockWorkspaceName,
    });
    expect(addToWorkspaces).not.toHaveBeenCalled();
  });

  it('create# should call addToWorkspaces with passed data sources normally', async () => {
    const client = new WorkspaceClient(coreSetup);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.create(mockRequestDetail, {
      name: mockWorkspaceName,
      permissions: {},
      dataSources: ['id1'],
    });

    expect(addToWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id1', [
      mockWorkspaceId,
    ]);
  });

  it('update# should not call addToWorkspaces if no new data sources added', async () => {
    const client = new WorkspaceClient(coreSetup);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.update(mockRequestDetail, mockWorkspaceId, {
      permissions: {},
      name: mockWorkspaceName,
      dataSources: ['id1', 'id2'],
    });

    expect(addToWorkspaces).not.toHaveBeenCalled();
  });

  it('update# should call deleteFromWorkspaces if there is data source to be removed', async () => {
    const client = new WorkspaceClient(coreSetup);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.update(mockRequestDetail, mockWorkspaceId, {
      permissions: {},
      name: 'workspace_name',
      dataSources: ['id3', 'id4'],
    });
    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id1', [
      mockWorkspaceId,
    ]);

    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id2', [
      mockWorkspaceId,
    ]);
  });
  it('update# should calculate data sources to be added and to be removed', async () => {
    const client = new WorkspaceClient(coreSetup);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.update(mockRequestDetail, mockWorkspaceId, {
      permissions: {},
      name: mockWorkspaceName,
      dataSources: ['id1', 'id3'],
    });
    expect(addToWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id3', [
      mockWorkspaceId,
    ]);

    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id2', [
      mockWorkspaceId,
    ]);
  });
});
