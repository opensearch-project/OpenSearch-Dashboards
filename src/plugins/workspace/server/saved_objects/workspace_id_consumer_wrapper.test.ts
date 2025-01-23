/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { updateWorkspaceState } from '../../../../core/server/utils';
import { SavedObject } from '../../../../core/public';
import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { WorkspaceIdConsumerWrapper } from './workspace_id_consumer_wrapper';
import { workspaceClientMock } from '../workspace_client.mock';
import { SavedObjectsErrorHelpers } from '../../../../core/server';

describe('WorkspaceIdConsumerWrapper', () => {
  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const mockedWorkspaceClient = workspaceClientMock.create();
  const wrapperInstance = new WorkspaceIdConsumerWrapper(mockedWorkspaceClient);
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
      mockedWorkspaceClient.get.mockClear();
      mockedWorkspaceClient.list.mockClear();
    });
    it(`Should add workspaces parameters when create`, async () => {
      mockedWorkspaceClient.get.mockImplementationOnce((requestContext, id) => {
        return {
          success: true,
        };
      });
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

    it(`Should throw error when passing in invalid workspaces`, async () => {
      const workspaceIdConsumerWrapper = new WorkspaceIdConsumerWrapper(mockedWorkspaceClient);
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      updateWorkspaceState(mockRequest, {});
      const mockedWrapperClient = workspaceIdConsumerWrapper.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: mockRequest,
      });

      mockedWorkspaceClient.list.mockResolvedValueOnce({
        success: true,
        result: {
          workspaces: [
            {
              id: 'foo',
            },
          ],
        },
      });

      expect(
        mockedWrapperClient.create(
          'dashboard',
          {
            name: 'foo',
          },
          { workspaces: ['zoo', 'noo'] }
        )
      ).rejects.toMatchInlineSnapshot(`[Error: Exist invalid workspaces]`);
      expect(mockedWorkspaceClient.get).toBeCalledTimes(0);
      expect(mockedWorkspaceClient.list).toBeCalledTimes(1);
    });
  });

  describe('bulkCreate', () => {
    beforeEach(() => {
      mockedClient.bulkCreate.mockClear();
      mockedWorkspaceClient.get.mockClear();
      mockedWorkspaceClient.list.mockClear();
    });
    it(`Should add workspaces parameters when bulk create`, async () => {
      mockedWorkspaceClient.get.mockImplementationOnce((requestContext, id) => {
        return {
          success: true,
        };
      });
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

    it(`Should throw error when passing in invalid workspaces`, async () => {
      mockedWorkspaceClient.get.mockImplementationOnce((requestContext, id) => {
        return {
          success: false,
        };
      });
      expect(
        wrapperClient.bulkCreate([
          getSavedObject({
            id: 'foo',
          }),
        ])
      ).rejects.toMatchInlineSnapshot(`[Error: Exist invalid workspaces]`);
      expect(mockedWorkspaceClient.get).toBeCalledTimes(1);
      expect(mockedWorkspaceClient.list).toBeCalledTimes(0);
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
      mockedWorkspaceClient.get.mockImplementation((requestContext, id) => {
        if (id === 'foo') {
          return {
            success: true,
          };
        }

        return {
          success: false,
        };
      });
      mockedWorkspaceClient.list.mockResolvedValue({
        success: true,
        result: {
          workspaces: [
            {
              id: 'foo',
            },
          ],
        },
      });
      mockedWorkspaceClient.get.mockClear();
      mockedWorkspaceClient.list.mockClear();
    });

    it(`Should add workspaces parameters when find`, async () => {
      await wrapperClient.find({
        type: 'dashboard',
      });
      expect(mockedClient.find).toBeCalledWith({
        type: 'dashboard',
        workspaces: ['foo'],
      });
      expect(mockedWorkspaceClient.get).toBeCalledTimes(1);
      expect(mockedWorkspaceClient.list).toBeCalledTimes(0);
    });

    it(`Should pass a empty workspace array`, async () => {
      const workspaceIdConsumerWrapper = new WorkspaceIdConsumerWrapper(mockedWorkspaceClient);
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
      expect(mockedClient.find).toBeCalledWith({
        type: ['dashboard', 'visualization'],
      });
    });

    it(`Should throw error when passing in invalid workspaces`, async () => {
      const workspaceIdConsumerWrapper = new WorkspaceIdConsumerWrapper(mockedWorkspaceClient);
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      updateWorkspaceState(mockRequest, {});
      const mockedWrapperClient = workspaceIdConsumerWrapper.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: mockRequest,
      });
      expect(
        mockedWrapperClient.find({
          type: ['dashboard', 'visualization'],
          workspaces: ['foo', 'not-exist'],
        })
      ).rejects.toMatchInlineSnapshot(`[Error: Exist invalid workspaces]`);
      expect(mockedWorkspaceClient.get).toBeCalledTimes(0);
      expect(mockedWorkspaceClient.list).toBeCalledTimes(1);
    });

    it(`Should not throw error when passing in '*'`, async () => {
      const workspaceIdConsumerWrapper = new WorkspaceIdConsumerWrapper(mockedWorkspaceClient);
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      updateWorkspaceState(mockRequest, {});
      const mockedWrapperClient = workspaceIdConsumerWrapper.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: mockRequest,
      });
      await mockedWrapperClient.find({
        type: ['dashboard', 'visualization'],
        workspaces: ['*'],
      });
      expect(mockedClient.find).toBeCalledWith({
        type: ['dashboard', 'visualization'],
      });
    });
  });

  describe('get', () => {
    beforeEach(() => {
      mockedClient.get.mockClear();
    });

    it(`Should get object belonging to options.workspaces`, async () => {
      const savedObject = {
        type: 'dashboard',
        id: 'dashboard_id',
        attributes: {},
        references: [],
        workspaces: ['foo'],
      };
      mockedClient.get.mockResolvedValueOnce(savedObject);
      const result = await wrapperClient.get(savedObject.type, savedObject.id, {
        workspaces: savedObject.workspaces,
      });
      expect(mockedClient.get).toBeCalledWith(savedObject.type, savedObject.id, {
        workspaces: savedObject.workspaces,
      });
      expect(result).toEqual(savedObject);
    });

    it(`Should get object belonging to the workspace in request`, async () => {
      const savedObject = {
        type: 'dashboard',
        id: 'dashboard_id',
        attributes: {},
        references: [],
        workspaces: ['foo'],
      };
      mockedClient.get.mockResolvedValueOnce(savedObject);
      const result = await wrapperClient.get(savedObject.type, savedObject.id);
      expect(mockedClient.get).toBeCalledWith(savedObject.type, savedObject.id, {});
      expect(result).toEqual(savedObject);
    });

    it(`Should get object if the object type is workspace`, async () => {
      const savedObject = {
        type: 'workspace',
        id: 'workspace_id',
        attributes: {},
        references: [],
      };
      mockedClient.get.mockResolvedValueOnce(savedObject);
      const result = await wrapperClient.get(savedObject.type, savedObject.id);
      expect(mockedClient.get).toBeCalledWith(savedObject.type, savedObject.id, {});
      expect(result).toEqual(savedObject);
    });

    it(`Should get object if the object type is config`, async () => {
      const savedObject = {
        type: 'config',
        id: 'config_id',
        attributes: {},
        references: [],
      };
      mockedClient.get.mockResolvedValueOnce(savedObject);
      const result = await wrapperClient.get(savedObject.type, savedObject.id);
      expect(mockedClient.get).toBeCalledWith(savedObject.type, savedObject.id, {});
      expect(result).toEqual(savedObject);
    });

    it(`Should get object when there is no workspace in options/request`, async () => {
      const workspaceIdConsumerWrapper = new WorkspaceIdConsumerWrapper(mockedWorkspaceClient);
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      updateWorkspaceState(mockRequest, {});
      const mockedWrapperClient = workspaceIdConsumerWrapper.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: mockRequest,
      });
      const savedObject = {
        type: 'dashboard',
        id: 'dashboard_id',
        attributes: {},
        references: [],
      };
      mockedClient.get.mockResolvedValueOnce(savedObject);
      const result = await mockedWrapperClient.get(savedObject.type, savedObject.id);
      expect(mockedClient.get).toBeCalledWith(savedObject.type, savedObject.id, {});
      expect(result).toEqual(savedObject);
    });

    it(`Should throw error when the object is not belong to the workspace`, async () => {
      const savedObject = {
        type: 'dashboard',
        id: 'dashboard_id',
        attributes: {},
        references: [],
        workspaces: ['bar'],
      };
      mockedClient.get.mockResolvedValueOnce(savedObject);
      expect(wrapperClient.get(savedObject.type, savedObject.id)).rejects.toMatchInlineSnapshot(
        `[Error: Saved object does not belong to the workspace]`
      );
      expect(mockedClient.get).toBeCalledWith(savedObject.type, savedObject.id, {});
    });

    it(`Should throw error when the object does not exist`, async () => {
      mockedClient.get.mockRejectedValueOnce(SavedObjectsErrorHelpers.createGenericNotFoundError());
      expect(wrapperClient.get('type', 'id')).rejects.toMatchInlineSnapshot(`[Error: Not Found]`);
      expect(mockedClient.get).toHaveBeenCalledTimes(1);
    });

    it(`Should throw error when the options.workspaces has more than one workspace.`, async () => {
      const savedObject = {
        type: 'dashboard',
        id: 'dashboard_id',
        attributes: {},
        references: [],
        workspaces: ['bar'],
      };
      const options = { workspaces: ['foo', 'bar'] };
      expect(
        wrapperClient.get(savedObject.type, savedObject.id, options)
      ).rejects.toMatchInlineSnapshot(`[Error: Multiple workspace parameters: Bad Request]`);
      expect(mockedClient.get).not.toBeCalled();
    });

    it(`Should get data source when user is data source admin`, async () => {
      const workspaceIdConsumerWrapper = new WorkspaceIdConsumerWrapper(mockedWorkspaceClient);
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      updateWorkspaceState(mockRequest, { isDataSourceAdmin: true, requestWorkspaceId: 'foo' });
      const mockedWrapperClient = workspaceIdConsumerWrapper.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: mockRequest,
      });
      const savedObject = {
        type: 'data-source',
        id: 'data-source_id',
        attributes: {},
        references: [],
      };
      mockedClient.get.mockResolvedValueOnce(savedObject);
      const result = await mockedWrapperClient.get(savedObject.type, savedObject.id);
      expect(mockedClient.get).toBeCalledWith(savedObject.type, savedObject.id, {});
      expect(result).toEqual(savedObject);
    });

    it(`Should throw error when the object is global data source`, async () => {
      const savedObject = {
        type: 'data-source',
        id: 'data-source_id',
        attributes: {},
        references: [],
      };
      mockedClient.get.mockResolvedValueOnce(savedObject);
      mockedClient.get.mockResolvedValueOnce(savedObject);
      expect(wrapperClient.get(savedObject.type, savedObject.id)).rejects.toMatchInlineSnapshot(
        `[Error: Saved object does not belong to the workspace]`
      );
      expect(mockedClient.get).toBeCalledWith(savedObject.type, savedObject.id, {});
    });
  });

  describe('bulkGet', () => {
    const payload = [
      { id: 'dashboard_id', type: 'dashboard' },
      { id: 'dashboard_error_id', type: 'dashboard' },
      { id: 'visualization_id', type: 'visualization' },
      { id: 'global_data_source_id', type: 'data-source' },
      { id: 'data_source_id', type: 'data-source' },
    ];
    const savedObjects = [
      {
        type: 'dashboard',
        id: 'dashboard_id',
        attributes: { description: 'description' },
        references: ['reference_id'],
        workspaces: ['foo'],
      },
      {
        type: 'dashboard',
        id: 'dashboard_error_id',
        attributes: {},
        references: [],
        error: {
          statusCode: 404,
          error: 'Not Found',
          message: 'Saved object [dashboard/dashboard_error_id] not found',
        },
      },
      {
        type: 'visualization',
        id: 'visualization_id',
        attributes: { description: 'description' },
        references: ['reference_id'],
        workspaces: ['bar'],
      },
      {
        type: 'config',
        id: 'config_id',
        attributes: {},
        references: [],
      },
      {
        type: 'workspace',
        id: 'workspace_id',
        attributes: {},
        references: [],
      },
      {
        type: 'data-source',
        id: 'global_data_source_id',
        attributes: {},
        references: [],
      },
      {
        type: 'data-source',
        id: 'data_source_id',
        attributes: {},
        references: [],
        workspaces: ['foo'],
      },
    ];
    const options = { workspaces: ['foo'] };
    beforeEach(() => {
      mockedClient.bulkGet.mockClear();
    });

    it(`Should bulkGet objects belonging to options.workspaces`, async () => {
      mockedClient.bulkGet.mockResolvedValueOnce({ saved_objects: savedObjects });
      const result = await wrapperClient.bulkGet(payload, options);
      expect(mockedClient.bulkGet).toBeCalledWith(payload, options);
      expect(result).toMatchInlineSnapshot(`
        Object {
          "saved_objects": Array [
            Object {
              "attributes": Object {
                "description": "description",
              },
              "id": "dashboard_id",
              "references": Array [
                "reference_id",
              ],
              "type": "dashboard",
              "workspaces": Array [
                "foo",
              ],
            },
            Object {
              "attributes": Object {},
              "error": Object {
                "error": "Not Found",
                "message": "Saved object [dashboard/dashboard_error_id] not found",
                "statusCode": 404,
              },
              "id": "dashboard_error_id",
              "references": Array [],
              "type": "dashboard",
            },
            Object {
              "attributes": Object {},
              "error": Object {
                "error": "Forbidden",
                "message": "Saved object does not belong to the workspace",
                "statusCode": 403,
              },
              "id": "visualization_id",
              "references": Array [],
              "type": "visualization",
            },
            Object {
              "attributes": Object {},
              "id": "config_id",
              "references": Array [],
              "type": "config",
            },
            Object {
              "attributes": Object {},
              "id": "workspace_id",
              "references": Array [],
              "type": "workspace",
            },
            Object {
              "attributes": Object {},
              "error": Object {
                "error": "Forbidden",
                "message": "Saved object does not belong to the workspace",
                "statusCode": 403,
              },
              "id": "global_data_source_id",
              "references": Array [],
              "type": "data-source",
            },
            Object {
              "attributes": Object {},
              "id": "data_source_id",
              "references": Array [],
              "type": "data-source",
              "workspaces": Array [
                "foo",
              ],
            },
          ],
        }
      `);
    });

    it(`Should bulkGet objects belonging to the workspace in request`, async () => {
      mockedClient.bulkGet.mockResolvedValueOnce({ saved_objects: savedObjects });
      const result = await wrapperClient.bulkGet(payload);
      expect(mockedClient.bulkGet).toBeCalledWith(payload, {});
      expect(result).toMatchInlineSnapshot(`
        Object {
          "saved_objects": Array [
            Object {
              "attributes": Object {
                "description": "description",
              },
              "id": "dashboard_id",
              "references": Array [
                "reference_id",
              ],
              "type": "dashboard",
              "workspaces": Array [
                "foo",
              ],
            },
            Object {
              "attributes": Object {},
              "error": Object {
                "error": "Not Found",
                "message": "Saved object [dashboard/dashboard_error_id] not found",
                "statusCode": 404,
              },
              "id": "dashboard_error_id",
              "references": Array [],
              "type": "dashboard",
            },
            Object {
              "attributes": Object {},
              "error": Object {
                "error": "Forbidden",
                "message": "Saved object does not belong to the workspace",
                "statusCode": 403,
              },
              "id": "visualization_id",
              "references": Array [],
              "type": "visualization",
            },
            Object {
              "attributes": Object {},
              "id": "config_id",
              "references": Array [],
              "type": "config",
            },
            Object {
              "attributes": Object {},
              "id": "workspace_id",
              "references": Array [],
              "type": "workspace",
            },
            Object {
              "attributes": Object {},
              "error": Object {
                "error": "Forbidden",
                "message": "Saved object does not belong to the workspace",
                "statusCode": 403,
              },
              "id": "global_data_source_id",
              "references": Array [],
              "type": "data-source",
            },
            Object {
              "attributes": Object {},
              "id": "data_source_id",
              "references": Array [],
              "type": "data-source",
              "workspaces": Array [
                "foo",
              ],
            },
          ],
        }
      `);
    });

    it(`Should bulkGet objects when there is no workspace in options/request`, async () => {
      const workspaceIdConsumerWrapper = new WorkspaceIdConsumerWrapper(mockedWorkspaceClient);
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      updateWorkspaceState(mockRequest, {});
      const mockedWrapperClient = workspaceIdConsumerWrapper.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: mockRequest,
      });
      mockedClient.bulkGet.mockResolvedValueOnce({ saved_objects: savedObjects });
      const result = await mockedWrapperClient.bulkGet(payload);
      expect(mockedClient.bulkGet).toBeCalledWith(payload, {});
      expect(result).toEqual({ saved_objects: savedObjects });
    });

    it(`Should throw error when the objects do not exist`, async () => {
      mockedClient.bulkGet.mockRejectedValueOnce(
        SavedObjectsErrorHelpers.createGenericNotFoundError()
      );
      expect(wrapperClient.bulkGet(payload)).rejects.toMatchInlineSnapshot(`[Error: Not Found]`);
      expect(mockedClient.bulkGet).toBeCalledWith(payload, {});
    });

    it(`Should throw error when the options.workspaces has more than one workspace.`, async () => {
      expect(
        wrapperClient.bulkGet(payload, { workspaces: ['foo', 'var'] })
      ).rejects.toMatchInlineSnapshot(`[Error: Multiple workspace parameters: Bad Request]`);
      expect(mockedClient.bulkGet).not.toBeCalled();
    });

    it(`Should bulkGet data source when user is data source admin`, async () => {
      const workspaceIdConsumerWrapper = new WorkspaceIdConsumerWrapper(mockedWorkspaceClient);
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      updateWorkspaceState(mockRequest, { isDataSourceAdmin: true, requestWorkspaceId: 'foo' });
      const mockedWrapperClient = workspaceIdConsumerWrapper.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: mockRequest,
      });

      mockedClient.bulkGet.mockResolvedValueOnce({ saved_objects: savedObjects });
      const result = await mockedWrapperClient.bulkGet(payload);
      expect(mockedClient.bulkGet).toBeCalledWith(payload, {});
      expect(result).toMatchInlineSnapshot(`
        Object {
          "saved_objects": Array [
            Object {
              "attributes": Object {
                "description": "description",
              },
              "id": "dashboard_id",
              "references": Array [
                "reference_id",
              ],
              "type": "dashboard",
              "workspaces": Array [
                "foo",
              ],
            },
            Object {
              "attributes": Object {},
              "error": Object {
                "error": "Not Found",
                "message": "Saved object [dashboard/dashboard_error_id] not found",
                "statusCode": 404,
              },
              "id": "dashboard_error_id",
              "references": Array [],
              "type": "dashboard",
            },
            Object {
              "attributes": Object {},
              "error": Object {
                "error": "Forbidden",
                "message": "Saved object does not belong to the workspace",
                "statusCode": 403,
              },
              "id": "visualization_id",
              "references": Array [],
              "type": "visualization",
            },
            Object {
              "attributes": Object {},
              "id": "config_id",
              "references": Array [],
              "type": "config",
            },
            Object {
              "attributes": Object {},
              "id": "workspace_id",
              "references": Array [],
              "type": "workspace",
            },
            Object {
              "attributes": Object {},
              "id": "global_data_source_id",
              "references": Array [],
              "type": "data-source",
            },
            Object {
              "attributes": Object {},
              "id": "data_source_id",
              "references": Array [],
              "type": "data-source",
              "workspaces": Array [
                "foo",
              ],
            },
          ],
        }
      `);
    });
  });
});
