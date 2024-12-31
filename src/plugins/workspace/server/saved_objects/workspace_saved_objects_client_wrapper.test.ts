/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggerMock } from '@osd/logging/target/mocks';
import {
  getACLAuditor,
  getWorkspaceState,
  initializeACLAuditor,
  initializeClientCallAuditor,
  updateWorkspaceState,
} from '../../../../core/server/utils';
import {
  SavedObject,
  SavedObjectsBulkGetObject,
  SavedObjectsClientWrapperOptions,
  SavedObjectsErrorHelpers,
} from '../../../../core/server';
import { WorkspaceSavedObjectsClientWrapper } from './workspace_saved_objects_client_wrapper';
import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import {
  DATA_SOURCE_SAVED_OBJECT_TYPE,
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
} from '../../../data_source/common';

const DASHBOARD_ADMIN = 'dashboard_admin';
const NO_DASHBOARD_ADMIN = 'no_dashboard_admin';
const DATASOURCE_ADMIN = 'dataSource_admin';

const generateWorkspaceSavedObjectsClientWrapper = (role = NO_DASHBOARD_ADMIN) => {
  const savedObjectsStore: SavedObject[] = [
    {
      type: 'dashboard',
      id: 'foo',
      workspaces: ['workspace-1'],
      attributes: {
        bar: 'baz',
      },
      permissions: {},
      references: [],
    },
    {
      type: 'dashboard',
      id: 'not-permitted-dashboard',
      workspaces: ['not-permitted-workspace'],
      attributes: {
        bar: 'baz',
      },
      permissions: {},
      references: [],
    },
    {
      type: 'dashboard',
      id: 'dashboard-with-empty-workspace-property',
      workspaces: [],
      attributes: {
        bar: 'baz',
      },
      permissions: {},
      references: [],
    },
    { type: 'workspace', id: 'workspace-1', attributes: { name: 'Workspace - 1' }, references: [] },
    {
      type: 'workspace',
      id: 'not-permitted-workspace',
      attributes: { name: 'Not permitted workspace' },
      references: [],
    },
    {
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      id: 'global-data-source',
      attributes: { title: 'Global data source' },
      references: [],
    },
    {
      type: DATA_CONNECTION_SAVED_OBJECT_TYPE,
      id: 'global-data-connection',
      attributes: { title: 'Global data connection' },
      references: [],
    },
    {
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      id: 'global-data-source-empty-workspaces',
      attributes: { title: 'Global data source empty workspaces' },
      workspaces: [],
      references: [],
    },
    {
      type: DATA_CONNECTION_SAVED_OBJECT_TYPE,
      id: 'global-data-connection-empty-workspaces',
      attributes: { title: 'Global data connection empty workspaces' },
      workspaces: [],
      references: [],
    },
    {
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      id: 'workspace-1-data-source',
      attributes: { title: 'Workspace 1 data source' },
      workspaces: ['workspace-1'],
      references: [],
    },
    {
      type: DATA_CONNECTION_SAVED_OBJECT_TYPE,
      id: 'workspace-1-data-connection',
      attributes: { title: 'Workspace 1 data connection' },
      workspaces: ['workspace-1'],
      references: [],
    },
    {
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      id: 'workspace-2-data-source',
      attributes: { title: 'Workspace 2 data source' },
      workspaces: ['mock-request-workspace-id'],
      references: [],
    },
    {
      type: DATA_CONNECTION_SAVED_OBJECT_TYPE,
      id: 'workspace-2-data-connection',
      attributes: { title: 'Workspace 2 data connection' },
      workspaces: ['mock-request-workspace-id'],
      references: [],
    },
    {
      type: 'workspace',
      id: 'foo',
      references: [],
      attributes: {},
    },
  ];
  const clientMock = savedObjectsClientMock.create();
  clientMock.get.mockImplementation(async (type, id) => {
    if (type === 'config') {
      return {
        type: 'config',
        id,
        attributes: {},
        references: [],
      };
    }
    if (id === 'unknown-error-dashboard') {
      throw new Error('Unknown error');
    }

    const findItem = savedObjectsStore.find((item) => item.type === type && item.id === id);
    if (findItem) {
      return findItem;
    }

    throw SavedObjectsErrorHelpers.createGenericNotFoundError();
  });
  clientMock.bulkGet.mockImplementation(
    async (savedObjectsToFind: SavedObjectsBulkGetObject[] | undefined) => {
      return {
        saved_objects: savedObjectsStore.filter((item) =>
          savedObjectsToFind?.find(
            (itemToFind) => itemToFind.type === item.type && itemToFind.id === item.id
          )
        ),
      };
    }
  );
  clientMock.find.mockImplementation(async ({ type, workspaces }) => {
    const savedObjects = savedObjectsStore
      .filter(
        (item) =>
          item.type === type &&
          (!workspaces || item.workspaces?.some((workspaceId) => workspaces.includes(workspaceId)))
      )
      .map((item) => ({
        ...item,
        score: 1,
      }));
    return {
      per_page: 10,
      page: 1,
      saved_objects: savedObjects,
      total: savedObjects.length,
    };
  });
  const requestMock = httpServerMock.createOpenSearchDashboardsRequest();
  initializeACLAuditor(requestMock, loggerMock.create());
  initializeClientCallAuditor(requestMock);
  updateWorkspaceState(requestMock, { requestWorkspaceId: 'mock-request-workspace-id' });
  if (role === DASHBOARD_ADMIN) {
    updateWorkspaceState(requestMock, { isDashboardAdmin: true });
  }
  if (role === DATASOURCE_ADMIN) {
    updateWorkspaceState(requestMock, { isDataSourceAdmin: true });
  }

  const coreHandleMock = coreMock.createStart();

  const wrapperOptions: SavedObjectsClientWrapperOptions = {
    client: clientMock,
    request: requestMock,
    typeRegistry: coreHandleMock.savedObjects.getTypeRegistry(),
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
    getPrincipalsFromRequest: jest.fn().mockImplementation(() => {
      return { users: ['user-1'] };
    }),
    addToCacheAllowlist: jest.fn(),
    clearSavedObjectsCache: jest.fn(),
  };

  const wrapper = new WorkspaceSavedObjectsClientWrapper(permissionControlMock);
  const scopedClientMock = savedObjectsClientMock.create();
  scopedClientMock.find.mockImplementation(async () => ({
    total: 1,
    per_page: 1,
    page: 1,
    saved_objects: [
      { id: 'workspace-1', type: 'workspace', score: 1, attributes: {}, references: [] },
    ],
  }));
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
        const { wrapper, permissionControlMock } = generateWorkspaceSavedObjectsClientWrapper();
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
      it('should throw permission error when user bulkCreate workspace and is not dashboard admin', async () => {
        const { wrapper } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.bulkCreate([{ type: 'workspace', attributes: {} }]);
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid permission, please contact OSD admin');

        try {
          await wrapper.bulkCreate([{ type: 'workspace', id: 'test', attributes: {} }]);
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid permission, please contact OSD admin');

        try {
          await wrapper.bulkCreate([{ type: 'workspace', attributes: {} }], { overwrite: true });
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid permission, please contact OSD admin');
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
      it('should throw permission error when user create a workspace and is not dashboard admin', async () => {
        const { wrapper } = generateWorkspaceSavedObjectsClientWrapper();
        let errorCatched;
        try {
          await wrapper.create('workspace', { name: 'test' }, { overwrite: true });
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid permission, please contact OSD admin');

        try {
          await wrapper.create('workspace', { name: 'test' }, { id: 'test' });
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid permission, please contact OSD admin');

        try {
          await wrapper.create('workspace', { name: 'test' }, {});
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched?.message).toEqual('Invalid permission, please contact OSD admin');
      });
    });
    describe('get', () => {
      it('should return saved object if no need to validate permission', async () => {
        const { wrapper, permissionControlMock } = generateWorkspaceSavedObjectsClientWrapper();
        const result = await wrapper.get('config', 'config-1');
        expect(result).toEqual(expect.objectContaining({ type: 'config' }));
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
        try {
          await wrapper.get('dashboard', 'not-permitted-dashboard');
        } catch (e) {
          // Add 1 line to pass no-empty lint check
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
        expect(result).toMatchInlineSnapshot(`
          Object {
            "attributes": Object {},
            "id": "foo",
            "references": Array [],
            "type": "workspace",
          }
        `);
      });
    });
    describe('bulk get', () => {
      it("should call permission validate with object's workspace and throw permission error", async () => {
        const {
          wrapper,
          permissionControlMock,
          requestMock,
        } = generateWorkspaceSavedObjectsClientWrapper();

        const result = await wrapper.bulkGet([
          { type: 'dashboard', id: 'not-permitted-dashboard' },
        ]);

        expect(permissionControlMock.validate).toHaveBeenCalledWith(
          requestMock,
          {
            type: 'workspace',
            id: 'not-permitted-workspace',
          },
          ['library_read', 'library_write']
        );

        expect(result.saved_objects).toEqual([
          {
            id: 'not-permitted-dashboard',
            type: 'dashboard',
            attributes: {},
            error: {
              error: 'Forbidden',
              message: 'Invalid saved objects permission',
              statusCode: 403,
            },
            workspaces: [],
            permissions: {},
            references: [],
          },
        ]);
      });
      it('should call permission validateSavedObjectsACL with object', async () => {
        const { wrapper, permissionControlMock } = generateWorkspaceSavedObjectsClientWrapper();
        try {
          await wrapper.bulkGet([{ type: 'dashboard', id: 'not-permitted-dashboard' }]);
        } catch (e) {
          // Add 1 line to pass no-empty lint check
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
      it('should call client.find with consistent params when ACLSearchParams and workspaceOperator not provided', async () => {
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
          workspaces: ['workspace-1'],
          workspacesSearchOperator: 'OR',
        });
      });
      it('should call client.find with ACLSearchParams when only ACLSearchParams provided', async () => {
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
      it('should call client.find with filtered workspaces when only workspaces provided', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper();
        await wrapper.find({
          type: 'dashboard',
          workspaces: ['workspace-1', 'workspace-2'],
        });
        expect(clientMock.find).toHaveBeenCalledWith({
          type: 'dashboard',
          workspaces: ['workspace-1'],
        });
      });
      it('should call client.find without ACLSearchParams and workspaceOperator', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper(
          DATASOURCE_ADMIN
        );
        await wrapper.find({
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
        });
        expect(clientMock.find).toHaveBeenCalledWith({
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
        });
        await wrapper.find({
          type: [DATA_SOURCE_SAVED_OBJECT_TYPE],
        });
        expect(clientMock.find).toHaveBeenCalledWith({
          type: [DATA_SOURCE_SAVED_OBJECT_TYPE],
        });
      });
      it('should call client.find without ACLSearchParams and workspaceOperator when find config and the sortField is buildNum', async () => {
        const { wrapper, clientMock } = generateWorkspaceSavedObjectsClientWrapper(
          DATASOURCE_ADMIN
        );
        clientMock.find.mockImplementation(async () => ({
          total: 2,
          per_page: 10,
          page: 1,
          saved_objects: [
            {
              score: 1,
              references: [],
              id: 'global_config',
              type: 'config',
              attributes: {
                buildNum: 1,
              },
            },
            {
              score: 1,
              references: [],
              id: 'user_config',
              type: 'config',
              attributes: {},
            },
          ],
        }));
        const findResult = await wrapper.find({
          type: 'config',
          sortField: 'buildNum',
        });
        expect(clientMock.find).toHaveBeenCalledWith({
          type: 'config',
          sortField: 'buildNum',
        });
        expect(findResult.saved_objects.length).toEqual(1);
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

    describe('Dashboard admin', () => {
      const {
        wrapper,
        clientMock,
        permissionControlMock,
        requestMock,
      } = generateWorkspaceSavedObjectsClientWrapper(DASHBOARD_ADMIN);
      expect(getWorkspaceState(requestMock)).toEqual({
        isDashboardAdmin: true,
        requestWorkspaceId: 'mock-request-workspace-id',
      });
      it('should bypass permission check for call client.delete', async () => {
        const deleteArgs = ['dashboard', 'not-permitted-dashboard'] as const;
        await wrapper.delete(...deleteArgs);
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
        expect(clientMock.delete).toHaveBeenCalledWith(...deleteArgs);
      });
      it('should bypass permission check for call client.update', async () => {
        const updateArgs = [
          'dashboard',
          'not-permitted-dashboard',
          {
            bar: 'for',
          },
        ] as const;
        await wrapper.update(...updateArgs);
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
        expect(clientMock.update).toHaveBeenCalledWith(...updateArgs);
      });
      it('should bypass permission check for call client.bulkUpdate', async () => {
        const bulkUpdateArgs = [
          { type: 'dashboard', id: 'not-permitted-dashboard', attributes: { bar: 'baz' } },
        ];
        await wrapper.bulkUpdate(bulkUpdateArgs);
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
        expect(clientMock.bulkUpdate).toHaveBeenCalledWith(bulkUpdateArgs);
      });
      it('should bypass permission check for call client.bulkCreate', async () => {
        const objectsToBulkCreate = [
          { type: 'dashboard', id: 'not-permitted-dashboard', attributes: { bar: 'baz' } },
        ];
        await wrapper.bulkCreate(objectsToBulkCreate, {
          overwrite: true,
          workspaces: ['not-permitted-workspace'],
        });
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
        expect(clientMock.bulkCreate).toHaveBeenCalledWith(objectsToBulkCreate, {
          overwrite: true,
          workspaces: ['not-permitted-workspace'],
        });
      });
      it('should bypass permission check for call client.create', async () => {
        await wrapper.create(
          'dashboard',
          { foo: 'bar' },
          {
            id: 'not-permitted-dashboard',
            overwrite: true,
          }
        );
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
        expect(clientMock.create).toHaveBeenCalledWith(
          'dashboard',
          { foo: 'bar' },
          {
            id: 'not-permitted-dashboard',
            overwrite: true,
          }
        );
      });
      it('should bypass permission check for call client.get and return result with arguments', async () => {
        const getArgs = ['dashboard', 'not-permitted-dashboard'] as const;
        const result = await wrapper.get(...getArgs);
        expect(clientMock.get).toHaveBeenCalledWith(...getArgs);
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
        expect(result.id).toBe('not-permitted-dashboard');
      });
      it('should bypass permission check for call client.bulkGet and return result with arguments', async () => {
        const bulkGetArgs = [
          {
            type: 'dashboard',
            id: 'foo',
          },
          {
            type: 'dashboard',
            id: 'not-permitted-dashboard',
          },
        ];
        const result = await wrapper.bulkGet(bulkGetArgs);
        expect(clientMock.bulkGet).toHaveBeenCalledWith(bulkGetArgs);
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
        expect(result.saved_objects.length).toBe(2);
      });
      it('should bypass permission check for call client.find with arguments', async () => {
        await wrapper.find({
          type: 'dashboard',
          workspaces: ['workspace-1', 'not-permitted-workspace'],
        });
        expect(clientMock.find).toHaveBeenCalledWith({
          type: 'dashboard',
          workspaces: ['workspace-1', 'not-permitted-workspace'],
        });
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
      });
      it('should bypass permission check for call client.deleteByWorkspace', async () => {
        await wrapper.deleteByWorkspace('not-permitted-workspace');
        expect(clientMock.deleteByWorkspace).toHaveBeenCalledWith('not-permitted-workspace');
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
      });
      it('should bypass permission check for call client.addToWorkspaces', async () => {
        await wrapper.addToWorkspaces(
          DATA_SOURCE_SAVED_OBJECT_TYPE,
          'data-source-id',
          ['workspace-1'],
          {}
        );
        expect(clientMock.addToWorkspaces).toHaveBeenCalledWith(
          DATA_SOURCE_SAVED_OBJECT_TYPE,
          'data-source-id',
          ['workspace-1'],
          {}
        );
        expect(permissionControlMock.validate).not.toHaveBeenCalled();

        await wrapper.addToWorkspaces(
          DATA_CONNECTION_SAVED_OBJECT_TYPE,
          'data-connection-id',
          ['workspace-1'],
          {}
        );
        expect(clientMock.addToWorkspaces).toHaveBeenCalledWith(
          DATA_CONNECTION_SAVED_OBJECT_TYPE,
          'data-connection-id',
          ['workspace-1'],
          {}
        );
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
      });
      it('should bypass permission check for call client.deleteFromWorkspaces', async () => {
        await wrapper.deleteFromWorkspaces(
          DATA_SOURCE_SAVED_OBJECT_TYPE,
          'data-source-id',
          ['workspace-1'],
          {}
        );
        expect(clientMock.deleteFromWorkspaces).toHaveBeenCalledWith(
          DATA_SOURCE_SAVED_OBJECT_TYPE,
          'data-source-id',
          ['workspace-1'],
          {}
        );
        expect(permissionControlMock.validate).not.toHaveBeenCalled();

        await wrapper.deleteFromWorkspaces(
          DATA_CONNECTION_SAVED_OBJECT_TYPE,
          'data-connection-id',
          ['workspace-1'],
          {}
        );
        expect(clientMock.deleteFromWorkspaces).toHaveBeenCalledWith(
          DATA_CONNECTION_SAVED_OBJECT_TYPE,
          'data-connection-id',
          ['workspace-1'],
          {}
        );
        expect(permissionControlMock.validate).not.toHaveBeenCalled();
      });
    });

    describe('addToWorkspaces', () => {
      it('should throw error when non dashboard admin add data source or data connection to workspaces', async () => {
        const { wrapper } = generateWorkspaceSavedObjectsClientWrapper();

        let errorCatch;
        try {
          await wrapper.addToWorkspaces(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id', [
            'workspace-id',
          ]);
        } catch (e) {
          errorCatch = e;
        }
        expect(errorCatch.message).toEqual('Invalid permission, please contact OSD admin');
        try {
          await wrapper.addToWorkspaces(DATA_CONNECTION_SAVED_OBJECT_TYPE, 'data-connection-id', [
            'workspace-id',
          ]);
        } catch (e) {
          errorCatch = e;
        }
        expect(errorCatch.message).toEqual('Invalid permission, please contact OSD admin');
      });
    });

    describe('deleteFromWorkspaces', () => {
      it('should throw error when non dashboard admin delete data source or data connection from workspaces', async () => {
        const { wrapper } = generateWorkspaceSavedObjectsClientWrapper();

        let errorCatch;
        try {
          await wrapper.deleteFromWorkspaces(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id', [
            'workspace-id',
          ]);
        } catch (e) {
          errorCatch = e;
        }
        expect(errorCatch.message).toEqual('Invalid permission, please contact OSD admin');

        try {
          await wrapper.deleteFromWorkspaces(
            DATA_CONNECTION_SAVED_OBJECT_TYPE,
            'data-connection-id',
            ['workspace-id']
          );
        } catch (e) {
          errorCatch = e;
        }
        expect(errorCatch.message).toEqual('Invalid permission, please contact OSD admin');
      });
    });
  });

  describe('ACLAuditor', () => {
    it('should check out once after multiple parallel client calls all finished', async () => {
      const { wrapper, requestMock } = generateWorkspaceSavedObjectsClientWrapper();
      const auditor = getACLAuditor(requestMock);
      let checkSpy;
      if (auditor) {
        checkSpy = jest.spyOn(auditor, 'checkout');
      }

      await Promise.all([
        wrapper.get('workspace', 'foo'),
        wrapper.get('workspace', 'foo'),
        wrapper.get('workspace', 'foo'),
      ]);
      expect(checkSpy).toBeCalledTimes(1);
    });
  });
});
