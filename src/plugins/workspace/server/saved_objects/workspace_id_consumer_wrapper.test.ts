/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { updateWorkspaceState } from '../../../../core/server/utils';
import { SavedObject } from '../../../../core/public';
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
  });
});
