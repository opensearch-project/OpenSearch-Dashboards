/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { updateWorkspaceState } from '../../../../core/server/utils';
import { SavedObject } from '../../../../core/public';
import { PUBLIC_WORKSPACE_ID } from '../../../../core/server';
import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { WorkspaceIdConsumerWrapper } from './workspace_id_consumer_wrapper';

describe('WorkspaceIdConsumerWrapper', () => {
  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const wrapperInstance = new WorkspaceIdConsumerWrapper();
  const mockedClient = savedObjectsClientMock.create();
  const workspaceEnabledMockRequest = httpServerMock.createOpenSearchDashboardsRequest();
  updateWorkspaceState(workspaceEnabledMockRequest, {
    requestWorkspaceId: 'foo',
  });
  const wrapperClient = wrapperInstance.wrapperFactory({
    client: mockedClient,
    typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
    request: workspaceEnabledMockRequest,
  });
  const getSavedObject = (savedObject: Partial<SavedObject>) => {
    const payload: SavedObject = {
      references: [],
      id: '',
      type: 'dashboard',
      attributes: {},
      ...savedObject,
    };

    return payload;
  };
  describe('create', () => {
    beforeEach(() => {
      mockedClient.create.mockClear();
    });
    it(`Should add workspaces parameters when create`, async () => {
      await wrapperClient.create('dashboard', {
        name: 'foo',
      });

      expect(mockedClient.create).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          workspaces: ['foo'],
        })
      );
    });

    it(`Should not use options.workspaces when there is no workspaces inside options`, async () => {
      await wrapperClient.create(
        'dashboard',
        {
          name: 'foo',
        },
        {
          id: 'dashboard:foo',
          overwrite: true,
          workspaces: null,
        }
      );

      expect(mockedClient.create.mock.calls[0][2]?.hasOwnProperty('workspaces')).toEqual(false);
    });
  });

  describe('bulkCreate', () => {
    beforeEach(() => {
      mockedClient.bulkCreate.mockClear();
    });
    it(`Should add workspaces parameters when bulk create`, async () => {
      await wrapperClient.bulkCreate([
        getSavedObject({
          id: 'foo',
        }),
      ]);

      expect(mockedClient.bulkCreate).toBeCalledWith(
        [{ attributes: {}, id: 'foo', references: [], type: 'dashboard' }],
        {
          workspaces: ['foo'],
        }
      );
    });
  });

  describe('checkConflict', () => {
    beforeEach(() => {
      mockedClient.checkConflicts.mockClear();
    });

    it(`Should add workspaces parameters when checkConflict`, async () => {
      await wrapperClient.checkConflicts();
      expect(mockedClient.checkConflicts).toBeCalledWith([], {
        workspaces: ['foo'],
      });
    });
  });

  describe('find', () => {
    beforeEach(() => {
      mockedClient.find.mockClear();
    });

    it(`Should add workspaces parameters when find`, async () => {
      await wrapperClient.find({
        type: 'dashboard',
      });
      expect(mockedClient.find).toBeCalledWith({
        type: 'dashboard',
        workspaces: ['foo'],
      });
    });

    it(`Should set workspacesSearchOperator to OR when search with public workspace`, async () => {
      await wrapperClient.find({
        type: 'dashboard',
        workspaces: [PUBLIC_WORKSPACE_ID],
      });
      expect(mockedClient.find).toBeCalledWith({
        type: 'dashboard',
        workspaces: [PUBLIC_WORKSPACE_ID],
        workspacesSearchOperator: 'OR',
      });
    });

    it(`Should set workspace as pubic when workspace is not specified`, async () => {
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      updateWorkspaceState(mockRequest, {});
      const mockedWrapperClient = wrapperInstance.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: mockRequest,
      });
      await mockedWrapperClient.find({
        type: ['dashboard', 'visualization'],
      });
      expect(mockedClient.find).toBeCalledWith({
        type: ['dashboard', 'visualization'],
        workspaces: [PUBLIC_WORKSPACE_ID],
        workspacesSearchOperator: 'OR',
      });
    });

    it(`Should remove public workspace when permission control is enabled`, async () => {
      const consumer = new WorkspaceIdConsumerWrapper(true);
      const client = consumer.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: workspaceEnabledMockRequest,
      });
      await client.find({
        type: 'dashboard',
        workspaces: ['bar', PUBLIC_WORKSPACE_ID],
      });
      expect(mockedClient.find).toBeCalledWith({
        type: 'dashboard',
        workspaces: ['bar'],
        workspacesSearchOperator: 'OR',
      });
    });

    it(`Should not override workspacesSearchOperator when workspacesSearchOperator is specified`, async () => {
      await wrapperClient.find({
        type: 'dashboard',
        workspaces: [PUBLIC_WORKSPACE_ID],
        workspacesSearchOperator: 'AND',
      });
      expect(mockedClient.find).toBeCalledWith({
        type: 'dashboard',
        workspaces: [PUBLIC_WORKSPACE_ID],
        workspacesSearchOperator: 'AND',
      });
    });

    it(`Should not pass a empty workspace array`, async () => {
      const workspaceIdConsumerWrapper = new WorkspaceIdConsumerWrapper(true);
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      updateWorkspaceState(mockRequest, {});
      const mockedWrapperClient = workspaceIdConsumerWrapper.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: mockRequest,
      });
      await mockedWrapperClient.find({
        type: ['dashboard', 'visualization'],
      });
      // empty workspace array will get deleted
      expect(mockedClient.find).toBeCalledWith({
        type: ['dashboard', 'visualization'],
        workspacesSearchOperator: 'OR',
      });
    });
  });
});
