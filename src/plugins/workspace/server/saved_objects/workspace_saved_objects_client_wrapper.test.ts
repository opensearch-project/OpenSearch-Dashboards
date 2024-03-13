/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsErrorHelpers } from '../../../../core/server';
import { WorkspaceSavedObjectsClientWrapper } from './workspace_saved_objects_client_wrapper';

const generateWorkspaceSavedObjectsClientWrapper = () => {
  const savedObjectsStore = [
    {
      type: 'dashboard',
      id: 'foo',
      workspaces: ['workspace-1'],
      attributes: {
        bar: 'baz',
      },
      permissions: {},
    },
    {
      type: 'dashboard',
      id: 'not-permitted-dashboard',
      workspaces: ['not-permitted-workspace'],
      attributes: {
        bar: 'baz',
      },
      permissions: {},
    },
    {
      type: 'dashboard',
      id: 'dashboard-with-empty-workspace-property',
      workspaces: [],
      attributes: {
        bar: 'baz',
      },
      permissions: {},
    },
    { type: 'workspace', id: 'workspace-1', attributes: { name: 'Workspace - 1' } },
    {
      type: 'workspace',
      id: 'not-permitted-workspace',
      attributes: { name: 'Not permitted workspace' },
    },
  ];
  const clientMock = {
    get: jest.fn().mockImplementation(async (type, id) => {
      if (type === 'config') {
        return {
          type: 'config',
        };
      }
      if (id === 'unknown-error-dashboard') {
        throw new Error('Unknown error');
      }
      return (
        savedObjectsStore.find((item) => item.type === type && item.id === id) ||
        SavedObjectsErrorHelpers.createGenericNotFoundError()
      );
    }),
    create: jest.fn(),
    bulkCreate: jest.fn(),
    checkConflicts: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    bulkUpdate: jest.fn(),
    bulkGet: jest.fn().mockImplementation((savedObjectsToFind) => {
      return {
        saved_objects: savedObjectsStore.filter((item) =>
          savedObjectsToFind.find(
            (itemToFind) => itemToFind.type === item.type && itemToFind.id === item.id
          )
        ),
      };
    }),
    find: jest.fn(),
    deleteByWorkspace: jest.fn(),
  };
  const requestMock = {};
  const wrapperOptions = {
    client: clientMock,
    request: requestMock,
    typeRegistry: {},
  };
  const permissionControlMock = {
    setup: jest.fn(),
    validate: jest.fn().mockImplementation((_request, { id }) => {
      return {
        success: true,
        result: !id.startsWith('not-permitted'),
      };
    }),
    validateSavedObjectsACL: jest.fn(),
    batchValidate: jest.fn(),
    getPrincipalsFromRequest: jest.fn().mockImplementation(() => ({ users: ['user-1'] })),
  };
  const wrapper = new WorkspaceSavedObjectsClientWrapper(permissionControlMock);
  const scopedClientMock = {
    find: jest.fn().mockImplementation(async () => ({
      saved_objects: [{ id: 'workspace-1', type: 'workspace' }],
    })),
  };
  wrapper.setScopedClient(() => scopedClientMock);
  return {
    wrapper: wrapper.wrapperFactory(wrapperOptions),
    clientMock,
    scopedClientMock,
    permissionControlMock,
    requestMock,
  };
};

describe('WorkspaceSavedObjectsClientWrapper', () => {
  describe('wrapperFactory', () => {
    describe('delete', () => {
      it('should throw permission error if not permitted', async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.delete('dashboard', 'not-permitted-dashboard');
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          { type: 'workspace', id: 'not-permitted-workspace' },
          ['library_write']
        );
        expect(permissionControlMock.validateSavedObjectsACL).toHaveBeenCalledWith(
          [expect.objectContaining({ type: 'dashboard', id: 'not-permitted-dashboard' })],
          { users: ['user-1'] },
          ['write']
        );
        expect(errorCatched?.message).toEqual('Invalid saved objects permission');
      });
      it("should throw permission error if deleting saved object's workspace property is empty", async () => {
        const { wrapper } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.delete('dashboard', 'dashboard-with-empty-workspace-property');
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid saved objects permission');
      });
      it('should call client.delete with arguments if permitted', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        const deleteArgs = ['dashboard', 'foo', { force: true }] as const;
        await wrapper.delete(...deleteArgs);
        expect(clientMock.delete).toHaveBeenCalledWith(...deleteArgs);
      });
    });

    describe('update', () => {
      it('should throw permission error if not permitted', async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.update('dashboard', 'not-permitted-dashboard', {
            bar: 'foo',
          });
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          { type: 'workspace', id: 'not-permitted-workspace' },
          ['library_write']
        );
        expect(permissionControlMock.validateSavedObjectsACL).toHaveBeenCalledWith(
          [expect.objectContaining({ type: 'dashboard', id: 'not-permitted-dashboard' })],
          { users: ['user-1'] },
          ['write']
        );
        expect(errorCatched?.message).toEqual('Invalid saved objects permission');
      });
      it("should throw permission error if updating saved object's workspace property is empty", async () => {
        const { wrapper } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.update('dashboard', 'dashboard-with-empty-workspace-property', {
            bar: 'foo',
          });
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid saved objects permission');
      });
      it('should call client.update with arguments if permitted', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        const updateArgs = [
          'workspace',
          'foo',
          {
            bar: 'foo',
          },
          {},
        ] as const;
        await wrapper.update(...updateArgs);
        expect(clientMock.update).toHaveBeenCalledWith(...updateArgs);
      });
    });

    describe('bulk update', () => {
      it('should throw permission error if not permitted', async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.bulkUpdate([
            { type: 'dashboard', id: 'not-permitted-dashboard', attributes: { bar: 'baz' } },
          ]);
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          { type: 'workspace', id: 'not-permitted-workspace' },
          ['library_write']
        );
        expect(permissionControlMock.validateSavedObjectsACL).toHaveBeenCalledWith(
          [expect.objectContaining({ type: 'dashboard', id: 'not-permitted-dashboard' })],
          { users: ['user-1'] },
          ['write']
        );
        expect(errorCatched?.message).toEqual('Invalid saved objects permission');
      });
      it('should call client.bulkUpdate with arguments if permitted', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        const objectsToUpdate = [{ type: 'dashboard', id: 'foo', attributes: { bar: 'baz' } }];
        await wrapper.bulkUpdate(objectsToUpdate, {});
        expect(clientMock.bulkUpdate).toHaveBeenCalledWith(objectsToUpdate, {});
      });
    });

    describe('bulk create', () => {
      it('should throw workspace permission error if passed workspaces but not permitted', async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        permissionControlMock.validate.mockResolvedValueOnce({ success: true, result: false });
        let errorCatched;
        try {
          await wrapper.bulkCreate([{ type: 'dashboard', id: 'new-dashboard', attributes: {} }], {
            workspaces: ['not-permitted-workspace'],
          });
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          { type: 'workspace', id: 'not-permitted-workspace' },
          ['library_write']
        );
        expect(errorCatched?.message).toEqual('Invalid workspace permission');
      });
      it("should throw permission error if overwrite and not permitted on object's workspace and object", async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        permissionControlMock.validate.mockResolvedValueOnce({ success: true, result: false });
        let errorCatched;
        try {
          await wrapper.bulkCreate(
            [{ type: 'dashboard', id: 'not-permitted-dashboard', attributes: { bar: 'baz' } }],
            {
              overwrite: true,
            }
          );
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          { type: 'workspace', id: 'not-permitted-workspace' },
          ['library_write']
        );
        expect(permissionControlMock.validateSavedObjectsACL).toHaveBeenCalledWith(
          [expect.objectContaining({ type: 'dashboard', id: 'not-permitted-dashboard' })],
          { users: ['user-1'] },
          ['write']
        );
        expect(errorCatched?.message).toEqual('Invalid workspace permission');
      });
      it('should throw error if unable to get object when override', async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        permissionControlMock.validate.mockResolvedValueOnce({ success: true, result: false });
        let errorCatched;
        try {
          await wrapper.bulkCreate(
            [{ type: 'dashboard', id: 'unknown-error-dashboard', attributes: { bar: 'baz' } }],
            {
              overwrite: true,
            }
          );
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toBe('Unknown error');
      });
      it('should call client.bulkCreate with arguments if some objects not found', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        const objectsToBulkCreate = [
          { type: 'dashboard', id: 'new-dashboard', attributes: { bar: 'baz' } },
          { type: 'dashboard', id: 'not-found', attributes: { bar: 'foo' } },
        ];
        await wrapper.bulkCreate(objectsToBulkCreate, {
          overwrite: true,
        });
        expect(clientMock.bulkCreate).toHaveBeenCalledWith(objectsToBulkCreate, {
          overwrite: true,
        });
      });
      it('should call client.bulkCreate with arguments if permitted', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        const objectsToBulkCreate = [
          { type: 'dashboard', id: 'new-dashboard', attributes: { bar: 'baz' } },
        ];
        await wrapper.bulkCreate(objectsToBulkCreate, {
          overwrite: true,
          workspaces: ['workspace-1'],
        });
        expect(clientMock.bulkCreate).toHaveBeenCalledWith(objectsToBulkCreate, {
          overwrite: true,
          workspaces: ['workspace-1'],
        });
      });
    });

    describe('create', () => {
      it('should throw workspace permission error if passed workspaces but not permitted', async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.create('dashboard', 'new-dashboard', {
            workspaces: ['not-permitted-workspace'],
          });
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          { type: 'workspace', id: 'not-permitted-workspace' },
          ['library_write']
        );
        expect(errorCatched?.message).toEqual('Invalid workspace permission');
      });
      it("should throw permission error if overwrite and not permitted on object's workspace and object", async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.create(
            'dashboard',
            { foo: 'bar' },
            {
              id: 'not-permitted-dashboard',
              overwrite: true,
            }
          );
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          { type: 'workspace', id: 'not-permitted-workspace' },
          ['library_write']
        );
        expect(permissionControlMock.validateSavedObjectsACL).toHaveBeenCalledWith(
          [expect.objectContaining({ type: 'dashboard', id: 'not-permitted-dashboard' })],
          { users: ['user-1'] },
          ['write']
        );
        expect(errorCatched?.message).toEqual('Invalid workspace permission');
      });
      it('should call client.create with arguments if permitted', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        await wrapper.create(
          'dashboard',
          { foo: 'bar' },
          {
            id: 'foo',
            overwrite: true,
          }
        );
        expect(clientMock.create).toHaveBeenCalledWith(
          'dashboard',
          { foo: 'bar' },
          {
            id: 'foo',
            overwrite: true,
          }
        );
      });
    });
    describe('get', () => {
      it('should return saved object if no need to validate permission', async () => {
        const { wrapper, permissionControlMock } = generateWorkspaceSavedObjectsClientWrapper();
        const result = await wrapper.get('config', 'config-1');
        expect(result).toEqual({ type: 'config' });
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
      });
      it("should call permission validate with object's workspace and throw permission error", async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.get('dashboard', 'not-permitted-dashboard');
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          {
            type: 'workspace',
            id: 'not-permitted-workspace',
          },
          ['library_read', 'library_write']
        );
        expect(errorCatched?.message).toEqual('Invalid saved objects permission');
      });
      it('should call permission validateSavedObjectsACL with object', async () => {
        const { wrapper, permissionControlMock } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.get('dashboard', 'not-permitted-dashboard');
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validateSavedObjectsACL).toHaveBeenCalledWith(
          [
            expect.objectContaining({
              type: 'dashboard',
              id: 'not-permitted-dashboard',
            }),
          ],
          { users: ['user-1'] },
          ['read', 'write']
        );
      });
      it('should call client.get and return result with arguments if permitted', async () => {
        const {
          wrapper,
          clientMock,
          permissionControlMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        permissionControlMock.validate.mockResolvedValueOnce({ success: true, result: true });
        const getArgs = ['workspace', 'foo', {}] as const;
        const result = await wrapper.get(...getArgs);
        expect(clientMock.get).toHaveBeenCalledWith(...getArgs);
        expect(result).toMatchInlineSnapshot(`[Error: Not Found]`);
      });
    });
    describe('bulk get', () => {
      it("should call permission validate with object's workspace and throw permission error", async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.bulkGet([{ type: 'dashboard', id: 'not-permitted-dashboard' }]);
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          {
            type: 'workspace',
            id: 'not-permitted-workspace',
          },
          ['library_read', 'library_write']
        );
        expect(errorCatched?.message).toEqual('Invalid saved objects permission');
      });
      it('should call permission validateSavedObjectsACL with object', async () => {
        const { wrapper, permissionControlMock } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.bulkGet([{ type: 'dashboard', id: 'not-permitted-dashboard' }]);
        } catch (e) {
          errorCatched = e;
        }
        expect(permissionControlMock.validateSavedObjectsACL).toHaveBeenCalledWith(
          [
            expect.objectContaining({
              type: 'dashboard',
              id: 'not-permitted-dashboard',
            }),
          ],
          { users: ['user-1'] },
          ['write', 'read']
        );
      });
      it('should call client.bulkGet and return result with arguments if permitted', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();

        await wrapper.bulkGet(
          [
            {
              type: 'dashboard',
              id: 'foo',
            },
          ],
          {}
        );
        expect(clientMock.bulkGet).toHaveBeenCalledWith(
          [
            {
              type: 'dashboard',
              id: 'foo',
            },
          ],
          {}
        );
      });
    });
    describe('find', () => {
      it('should call client.find with ACLSearchParams for workspace type', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        await wrapper.find({
          type: 'workspace',
        });
        expect(clientMock.find).toHaveBeenCalledWith({
          type: 'workspace',
          ACLSearchParams: {
            principals: {
              users: ['user-1'],
            },
            permissionModes: ['read', 'write'],
          },
        });
      });
      it('should call client.find with only read permission if find workspace and permissionModes provided', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        await wrapper.find({
          type: 'workspace',
          ACLSearchParams: {
            permissionModes: ['read'],
          },
        });
        expect(clientMock.find).toHaveBeenCalledWith({
          type: 'workspace',
          ACLSearchParams: {
            principals: {
              users: ['user-1'],
            },
            permissionModes: ['read'],
          },
        });
      });
      it('should throw workspace permission error if provided workspaces not permitted', async () => {
        const { wrapper } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          errorCatched = await wrapper.find({
            type: 'dashboard',
            workspaces: ['not-permitted-workspace'],
          });
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid workspace permission');
      });
      it('should remove not permitted workspace and call client.find with arguments', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        await wrapper.find({
          type: 'dashboard',
          workspaces: ['not-permitted-workspace', 'workspace-1'],
        });
        expect(clientMock.find).toHaveBeenCalledWith({
          type: 'dashboard',
          workspaces: ['workspace-1'],
          ACLSearchParams: {},
        });
      });
      it('should find permitted workspaces with filtered permission modes', async () => {
        const { wrapper, scopedClientMock } = generateWorkspaceSavedObjectsClientWrapper();
        await wrapper.find({
          type: 'dashboard',
          ACLSearchParams: {
            permissionModes: ['read', 'library_read'],
          },
        });
        expect(scopedClientMock.find).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'workspace',
            ACLSearchParams: {
              permissionModes: ['library_read'],
              principals: { users: ['user-1'] },
            },
          })
        );
      });
      it('should call client.find with arguments if not workspace type and no options.workspace', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        await wrapper.find({
          type: 'dashboard',
        });
        expect(clientMock.find).toHaveBeenCalledWith({
          type: 'dashboard',
          ACLSearchParams: {
            permissionModes: ['read', 'write'],
            principals: { users: ['user-1'] },
          },
        });
      });
    });

    describe('deleteByWorkspace', () => {
      it('should call permission validate with workspace and throw workspace permission error if not permitted', async () => {
        const {
          wrapper,
          requestMock,
          permissionControlMock,
        } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.deleteByWorkspace('not-permitted-workspace');
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid workspace permission');
        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          { id: 'not-permitted-workspace', type: 'workspace' },
          ['library_write']
        );
      });

      it('should call client.deleteByWorkspace if permitted', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();

        await wrapper.deleteByWorkspace('workspace-1', {});
        expect(clientMock.deleteByWorkspace).toHaveBeenCalledWith('workspace-1', {});
      });
    });
  });
});
