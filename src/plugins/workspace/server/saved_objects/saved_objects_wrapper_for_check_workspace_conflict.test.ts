/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../../../core/public';
import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { WorkspaceConflictSavedObjectsClientWrapper } from './saved_objects_wrapper_for_check_workspace_conflict';
import { SavedObjectsSerializer } from '../../../../core/server';

describe('WorkspaceConflictSavedObjectsClientWrapper', () => {
  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const wrapperInstance = new WorkspaceConflictSavedObjectsClientWrapper();
  const mockedClient = savedObjectsClientMock.create();
  const wrapperClient = wrapperInstance.wrapperFactory({
    client: mockedClient,
    typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
    request: httpServerMock.createOpenSearchDashboardsRequest(),
  });
  const savedObjectsSerializer = new SavedObjectsSerializer(
    requestHandlerContext.savedObjects.typeRegistry
  );
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
  wrapperInstance.setSerializer(savedObjectsSerializer);
  describe('createWithWorkspaceConflictCheck', () => {
    beforeEach(() => {
      mockedClient.create.mockClear();
    });
    it(`Should reserve the workspace params when overwrite with empty workspaces`, async () => {
      mockedClient.get.mockResolvedValueOnce(
        getSavedObject({
          id: 'dashboard:foo',
          workspaces: ['foo'],
        })
      );

      await wrapperClient.create(
        'dashboard',
        {
          name: 'foo',
        },
        {
          id: 'dashboard:foo',
          overwrite: true,
          workspaces: [],
        }
      );

      expect(mockedClient.create).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          workspaces: ['foo'],
        })
      );
    });

    it(`Should return error when overwrite with conflict workspaces`, async () => {
      mockedClient.get.mockResolvedValueOnce(
        getSavedObject({
          id: 'dashboard:foo',
          workspaces: ['foo'],
        })
      );

      await expect(
        wrapperClient.create(
          'dashboard',
          {
            name: 'foo',
          },
          {
            id: 'dashboard:foo',
            overwrite: true,
            workspaces: ['bar'],
          }
        )
      ).rejects.toThrowError('Saved object [dashboard/dashboard:foo] conflict');
    });

    it(`Should use options.workspaces when get throws error`, async () => {
      mockedClient.get.mockRejectedValueOnce({
        output: {
          statusCode: 404,
        },
      });

      await wrapperClient.create(
        'dashboard',
        {
          name: 'foo',
        },
        {
          id: 'dashboard:foo',
          overwrite: true,
          workspaces: ['bar'],
        }
      );

      expect(mockedClient.create).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          workspaces: ['bar'],
        })
      );
    });
  });

  describe('bulkCreateWithWorkspaceConflictCheck', () => {
    beforeEach(() => {
      mockedClient.bulkCreate.mockClear();
    });
    it(`Should create objects when no workspaces and id present`, async () => {
      mockedClient.bulkCreate.mockResolvedValueOnce({
        saved_objects: [],
      });
      await wrapperClient.bulkCreate([
        getSavedObject({
          id: 'foo',
        }),
      ]);

      expect(mockedClient.bulkGet).not.toBeCalled();
      expect(mockedClient.bulkCreate).toBeCalledWith(
        [{ attributes: {}, id: 'foo', references: [], type: 'dashboard' }],
        {}
      );
    });

    it(`Should create objects when not overwrite`, async () => {
      mockedClient.bulkCreate.mockResolvedValueOnce({
        saved_objects: [],
      });
      await wrapperClient.bulkCreate([
        getSavedObject({
          id: 'foo',
          workspaces: ['foo'],
        }),
      ]);

      expect(mockedClient.bulkGet).not.toBeCalled();
      expect(mockedClient.bulkCreate).toBeCalledWith(
        [{ attributes: {}, id: 'foo', references: [], type: 'dashboard', workspaces: ['foo'] }],
        {}
      );
    });

    it(`Should check conflict on workspace when overwrite`, async () => {
      mockedClient.bulkCreate.mockResolvedValueOnce({
        saved_objects: [
          getSavedObject({
            id: 'foo',
            workspaces: ['foo'],
          }),
          getSavedObject({
            id: 'bar',
            workspaces: ['foo', 'bar'],
          }),
          getSavedObject({
            id: 'qux',
            workspaces: ['foo'],
          }),
        ],
      });
      mockedClient.bulkGet.mockResolvedValueOnce({
        saved_objects: [
          getSavedObject({
            id: 'foo',
            workspaces: ['foo'],
          }),
          getSavedObject({
            id: 'bar',
            workspaces: ['foo', 'bar'],
          }),
          getSavedObject({
            id: 'baz',
            workspaces: ['baz'],
          }),
          getSavedObject({
            id: 'qux',
            error: {
              statusCode: 404,
              message: 'object not found',
              error: 'object not found',
            },
          }),
        ],
      });
      const result = await wrapperClient.bulkCreate(
        [
          getSavedObject({
            id: 'foo',
          }),
          getSavedObject({
            id: 'bar',
          }),
          getSavedObject({
            id: 'baz',
          }),
          getSavedObject({
            id: 'qux',
          }),
        ],
        {
          overwrite: true,
          workspaces: ['foo'],
        }
      );

      expect(mockedClient.bulkGet).toBeCalled();
      expect(mockedClient.bulkCreate).toBeCalledWith(
        [
          { attributes: {}, id: 'foo', references: [], type: 'dashboard', workspaces: ['foo'] },
          {
            attributes: {},
            id: 'bar',
            references: [],
            type: 'dashboard',
            workspaces: ['foo', 'bar'],
          },
          {
            attributes: {},
            id: 'qux',
            references: [],
            type: 'dashboard',
            workspaces: ['foo'],
          },
        ],
        {
          overwrite: true,
          workspaces: ['foo'],
        }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "saved_objects": Array [
            Object {
              "attributes": Object {},
              "error": Object {
                "error": "Conflict",
                "message": "Saved object [dashboard/baz] conflict",
                "metadata": Object {
                  "isNotOverwritable": true,
                },
                "statusCode": 409,
              },
              "id": "baz",
              "references": Array [],
              "type": "dashboard",
            },
            Object {
              "attributes": Object {},
              "id": "foo",
              "references": Array [],
              "type": "dashboard",
              "workspaces": Array [
                "foo",
              ],
            },
            Object {
              "attributes": Object {},
              "id": "bar",
              "references": Array [],
              "type": "dashboard",
              "workspaces": Array [
                "foo",
                "bar",
              ],
            },
            Object {
              "attributes": Object {},
              "id": "qux",
              "references": Array [],
              "type": "dashboard",
              "workspaces": Array [
                "foo",
              ],
            },
          ],
        }
      `);
    });
  });

  describe('checkConflictWithWorkspaceConflictCheck', () => {
    beforeEach(() => {
      mockedClient.bulkGet.mockClear();
    });

    it(`Return early when no objects`, async () => {
      const result = await wrapperClient.checkConflicts([]);
      expect(result.errors).toEqual([]);
      expect(mockedClient.bulkGet).not.toBeCalled();
    });

    it(`Should filter out workspace conflict objects`, async () => {
      mockedClient.checkConflicts.mockResolvedValueOnce({
        errors: [],
      });
      mockedClient.bulkGet.mockResolvedValueOnce({
        saved_objects: [
          getSavedObject({
            id: 'foo',
            workspaces: ['foo'],
          }),
          getSavedObject({
            id: 'bar',
            workspaces: ['foo', 'bar'],
          }),
          getSavedObject({
            id: 'baz',
            workspaces: ['baz'],
          }),
          getSavedObject({
            id: 'qux',
            error: {
              statusCode: 404,
              message: 'object not found',
              error: 'object not found',
            },
          }),
        ],
      });
      const result = await wrapperClient.checkConflicts(
        [
          getSavedObject({
            id: 'foo',
          }),
          getSavedObject({
            id: 'bar',
          }),
          getSavedObject({
            id: 'baz',
          }),
          getSavedObject({
            id: 'qux',
          }),
        ],
        {
          workspaces: ['foo'],
        }
      );

      expect(mockedClient.bulkGet).toBeCalled();
      expect(mockedClient.checkConflicts).toBeCalledWith(
        [
          { attributes: {}, id: 'foo', references: [], type: 'dashboard' },
          {
            attributes: {},
            id: 'bar',
            references: [],
            type: 'dashboard',
          },
          {
            attributes: {},
            id: 'qux',
            references: [],
            type: 'dashboard',
          },
        ],
        {
          workspaces: ['foo'],
        }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "errors": Array [
            Object {
              "error": Object {
                "error": "Conflict",
                "message": "Saved object [dashboard/baz] conflict",
                "metadata": Object {
                  "isNotOverwritable": true,
                },
                "statusCode": 409,
              },
              "id": "baz",
              "type": "dashboard",
            },
          ],
        }
      `);
    });
  });
});
