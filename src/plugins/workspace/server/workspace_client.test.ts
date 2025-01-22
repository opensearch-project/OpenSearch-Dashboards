/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceClient } from './workspace_client';

import {
  coreMock,
  httpServerMock,
  uiSettingsServiceMock,
  loggingSystemMock,
} from '../../../core/server/mocks';
import {
  DATA_SOURCE_SAVED_OBJECT_TYPE,
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
} from '../../data_source/common';
import {
  SavedObjectsServiceStart,
  SavedObjectsClientContract,
  IUiSettingsClient,
} from '../../../core/server';
import { IRequestDetail } from './types';

const coreSetup = coreMock.createSetup();

const mockWorkspaceId = 'workspace_id';
const mockWorkspaceName = 'workspace_name';
const mockCheckAndSetDefaultDataSource = jest.fn();
const logger = loggingSystemMock.create().get();

jest.mock('./utils', () => ({
  generateRandomId: () => mockWorkspaceId,
  getDataSourcesList: jest.fn().mockResolvedValue([
    { type: 'data-source', id: 'id1' },
    { type: 'data-source', id: 'id2' },
    { type: 'data-connection', id: 'id1' },
    { type: 'data-connection', id: 'id2' },
  ]),
  checkAndSetDefaultDataSource: (...args: [IUiSettingsClient, string[], boolean]) =>
    mockCheckAndSetDefaultDataSource(...args),
}));

describe('#WorkspaceClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const find = jest.fn();
  const addToWorkspaces = jest.fn();
  const deleteFromWorkspaces = jest.fn();
  const savedObjectClient = ({
    find,
    addToWorkspaces,
    deleteFromWorkspaces,
    create: jest.fn(),
    get: jest.fn().mockResolvedValue({
      attributes: {
        name: mockWorkspaceName,
      },
    }),
  } as unknown) as SavedObjectsClientContract;
  const savedObjects = ({
    ...coreSetup.savedObjects,
    getScopedClient: () => savedObjectClient,
  } as unknown) as SavedObjectsServiceStart;

  const uiSettings = uiSettingsServiceMock.createStartContract();

  const mockRequestDetail = ({
    request: httpServerMock.createOpenSearchDashboardsRequest(),
    context: coreMock.createRequestHandlerContext(),
    logger: {},
  } as unknown) as IRequestDetail;

  it('create# should not call addToWorkspaces if no data sources and no data connections passed', async () => {
    const client = new WorkspaceClient(coreSetup, logger);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.create(mockRequestDetail, {
      permissions: {},
      dataSources: [],
      dataConnections: [],
      name: mockWorkspaceName,
    });
    expect(addToWorkspaces).not.toHaveBeenCalled();
  });

  it('create# should call addToWorkspaces with passed data sources and data connections normally', async () => {
    const client = new WorkspaceClient(coreSetup, logger);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.create(mockRequestDetail, {
      name: mockWorkspaceName,
      permissions: {},
      dataSources: ['id1'],
      dataConnections: ['id1'],
    });

    expect(addToWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id1', [
      mockWorkspaceId,
    ]);
    expect(addToWorkspaces).toHaveBeenCalledWith(DATA_CONNECTION_SAVED_OBJECT_TYPE, 'id1', [
      mockWorkspaceId,
    ]);
  });

  it('create# should call set default opensearch data source after creating', async () => {
    const client = new WorkspaceClient(coreSetup, logger);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);
    client?.setUiSettings(uiSettings);

    await client.create(mockRequestDetail, {
      name: mockWorkspaceName,
      permissions: {},
      dataSources: ['id1'],
      dataConnections: ['id2'],
    });

    const uiSettingsClient = uiSettings.asScopedToClient(savedObjectClient);

    expect(mockCheckAndSetDefaultDataSource).toHaveBeenCalledWith(uiSettingsClient, ['id1'], false);
    expect(mockCheckAndSetDefaultDataSource).not.toHaveBeenCalledWith(
      uiSettingsClient,
      ['id2'],
      false
    );
  });

  it('create# should call find when maximum workspaces are set', async () => {
    const client = new WorkspaceClient(coreSetup, logger, {
      maximum_workspaces: 1,
    });
    client?.setSavedObjects(savedObjects);

    find.mockImplementation((findParams) => {
      if (!findParams.search) {
        return {
          total: 1,
        };
      }

      return {};
    });

    const createResult = await client.create(mockRequestDetail, {
      name: mockWorkspaceName,
      permissions: {},
      dataSources: [],
      dataConnections: [],
    });

    expect(createResult).toEqual({
      success: false,
      error: 'Maximum number of workspaces (1) reached',
    });

    expect(find).toHaveBeenCalledTimes(2);
    find.mockClear();
  });

  it('update# should not call addToWorkspaces if no new data sources and data connections added', async () => {
    const client = new WorkspaceClient(coreSetup, logger);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.update(mockRequestDetail, mockWorkspaceId, {
      permissions: {},
      name: mockWorkspaceName,
      dataSources: ['id1', 'id2'],
      dataConnections: ['id1', 'id2'],
    });

    expect(addToWorkspaces).not.toHaveBeenCalled();
  });

  it('update# should call deleteFromWorkspaces if there is data source or data connection to be removed', async () => {
    const client = new WorkspaceClient(coreSetup, logger);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.update(mockRequestDetail, mockWorkspaceId, {
      permissions: {},
      name: 'workspace_name',
      dataSources: ['id3', 'id4'],
      dataConnections: ['id3', 'id4'],
    });
    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id1', [
      mockWorkspaceId,
    ]);

    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id2', [
      mockWorkspaceId,
    ]);

    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_CONNECTION_SAVED_OBJECT_TYPE, 'id1', [
      mockWorkspaceId,
    ]);

    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_CONNECTION_SAVED_OBJECT_TYPE, 'id2', [
      mockWorkspaceId,
    ]);
  });
  it('update# should calculate data sources to be added and to be removed', async () => {
    const client = new WorkspaceClient(coreSetup, logger);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);

    await client.update(mockRequestDetail, mockWorkspaceId, {
      permissions: {},
      name: mockWorkspaceName,
      dataSources: ['id1', 'id3'],
      dataConnections: ['id2', 'id4'],
    });
    expect(addToWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id3', [
      mockWorkspaceId,
    ]);
    expect(addToWorkspaces).toHaveBeenCalledWith(DATA_CONNECTION_SAVED_OBJECT_TYPE, 'id4', [
      mockWorkspaceId,
    ]);
    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id2', [
      mockWorkspaceId,
    ]);
    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_CONNECTION_SAVED_OBJECT_TYPE, 'id1', [
      mockWorkspaceId,
    ]);
  });

  it('update# should call set default opensearch data source with check after updating', async () => {
    const client = new WorkspaceClient(coreSetup, logger);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);
    client?.setUiSettings(uiSettings);

    await client.update(mockRequestDetail, mockWorkspaceId, {
      name: mockWorkspaceName,
      permissions: {},
      dataSources: ['id1'],
      dataConnections: ['id2'],
    });

    const uiSettingsClient = uiSettings.asScopedToClient(savedObjectClient);

    expect(mockCheckAndSetDefaultDataSource).toHaveBeenCalledWith(uiSettingsClient, ['id1'], true);
  });

  it('update# should log error when failed set default opensearch data source', async () => {
    const client = new WorkspaceClient(coreSetup, logger);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);
    client?.setUiSettings(uiSettings);
    mockCheckAndSetDefaultDataSource.mockRejectedValueOnce(new Error());

    await client.update(mockRequestDetail, mockWorkspaceId, {
      name: mockWorkspaceName,
      permissions: {},
      dataSources: ['id1'],
    });

    expect(logger.error).toHaveBeenLastCalledWith(
      'Set default data source error during workspace updating'
    );
  });

  it('delete# should unassign data source before deleting related saved objects', async () => {
    const client = new WorkspaceClient(coreSetup, logger);
    await client.setup(coreSetup);
    client?.setSavedObjects(savedObjects);
    client?.setUiSettings(uiSettings);

    await client.delete(mockRequestDetail, mockWorkspaceId);

    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id1', [
      mockWorkspaceId,
    ]);
    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_CONNECTION_SAVED_OBJECT_TYPE, 'id1', [
      mockWorkspaceId,
    ]);
    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'id2', [
      mockWorkspaceId,
    ]);
    expect(deleteFromWorkspaces).toHaveBeenCalledWith(DATA_CONNECTION_SAVED_OBJECT_TYPE, 'id2', [
      mockWorkspaceId,
    ]);
  });
});
