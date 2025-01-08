/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createTestServers,
  TestOpenSearchUtils,
  TestOpenSearchDashboardsUtils,
  TestUtils,
} from '../../../../../core/test_helpers/osd_server';
import {
  SavedObjectsErrorHelpers,
  WORKSPACE_TYPE,
  ISavedObjectsRepository,
  SavedObjectsClientContract,
  SavedObjectsBulkCreateObject,
} from '../../../../../core/server';
import { httpServerMock } from '../../../../../../src/core/server/mocks';
import * as utilsExports from '../../../../../core/server/utils/auth_info';
import { updateWorkspaceState } from '../../../../../core/server/utils';

const repositoryKit = (() => {
  const savedObjects: Array<{ type: string; id: string }> = [];
  return {
    create: async (
      repository: ISavedObjectsRepository,
      ...params: Parameters<ISavedObjectsRepository['create']>
    ) => {
      let result;
      try {
        result = params[2]?.id ? await repository.get(params[0], params[2].id) : undefined;
      } catch (_e) {
        // ignore error when get failed
      }
      if (!result) {
        result = await repository.create(...params);
      }
      savedObjects.push(result);
      return result;
    },
    clearAll: async (repository: ISavedObjectsRepository) => {
      for (let i = 0; i < savedObjects.length; i++) {
        try {
          await repository.delete(savedObjects[i].type, savedObjects[i].id);
        } catch (_e) {
          // Ignore delete error
        }
      }
    },
  };
})();

const permittedRequest = httpServerMock.createOpenSearchDashboardsRequest();
const notPermittedRequest = httpServerMock.createOpenSearchDashboardsRequest();
const dashboardAdminRequest = httpServerMock.createOpenSearchDashboardsRequest();

describe('WorkspaceSavedObjectsClientWrapper', () => {
  let internalSavedObjectsRepository: ISavedObjectsRepository;
  let servers: TestUtils;
  let opensearchServer: TestOpenSearchUtils;
  let osd: TestOpenSearchDashboardsUtils;
  let permittedSavedObjectedClient: SavedObjectsClientContract;
  let notPermittedSavedObjectedClient: SavedObjectsClientContract;
  let dashboardAdminSavedObjectedClient: SavedObjectsClientContract;

  beforeAll(async function () {
    servers = createTestServers({
      adjustTimeout: (t) => {
        jest.setTimeout(t);
      },
      settings: {
        osd: {
          workspace: {
            enabled: true,
          },
          savedObjects: {
            permission: {
              enabled: true,
            },
          },
          migrations: { skip: false },
        },
      },
    });
    opensearchServer = await servers.startOpenSearch();
    osd = await servers.startOpenSearchDashboards();

    internalSavedObjectsRepository = osd.coreStart.savedObjects.createInternalRepository([
      WORKSPACE_TYPE,
    ]);

    await repositoryKit.create(
      internalSavedObjectsRepository,
      'workspace',
      {},
      {
        id: 'workspace-1',
        permissions: {
          library_read: { users: ['foo'] },
          write: { users: ['foo'] },
          library_write: { users: ['foo'] },
        },
      }
    );

    await repositoryKit.create(
      internalSavedObjectsRepository,
      'workspace',
      {},
      {
        id: 'workspace-2',
        permissions: {
          write: { users: ['foo'] },
          library_write: { users: ['foo'] },
        },
      }
    );

    await repositoryKit.create(
      internalSavedObjectsRepository,
      'dashboard',
      {},
      {
        id: 'inner-workspace-dashboard-1',
        workspaces: ['workspace-1'],
      }
    );

    await repositoryKit.create(
      internalSavedObjectsRepository,
      'dashboard',
      {},
      {
        id: 'acl-controlled-dashboard-2',
        permissions: {
          read: { users: ['foo'], groups: [] },
          write: { users: ['foo'], groups: [] },
        },
      }
    );

    jest.spyOn(utilsExports, 'getPrincipalsFromRequest').mockImplementation((request) => {
      if (request === notPermittedRequest) {
        return { users: ['bar'] };
      }
      return { users: ['foo'] };
    });

    permittedSavedObjectedClient = osd.coreStart.savedObjects.getScopedClient(permittedRequest, {
      includedHiddenTypes: ['workspace'],
    });
    notPermittedSavedObjectedClient = osd.coreStart.savedObjects.getScopedClient(
      notPermittedRequest
    );
    updateWorkspaceState(dashboardAdminRequest, { isDashboardAdmin: true });
    dashboardAdminSavedObjectedClient = osd.coreStart.savedObjects.getScopedClient(
      dashboardAdminRequest
    );
  });

  afterAll(async () => {
    await repositoryKit.clearAll(internalSavedObjectsRepository);
    await opensearchServer.stop();
    await osd.stop();

    jest.spyOn(utilsExports, 'getPrincipalsFromRequest').mockRestore();
  });

  describe('get', () => {
    it('should throw forbidden error when user not permitted', async () => {
      let error;
      try {
        await notPermittedSavedObjectedClient.get('dashboard', 'inner-workspace-dashboard-1');
      } catch (e) {
        error = e;
      }
      expect(error).not.toBeUndefined();
      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);

      error = undefined;
      try {
        await notPermittedSavedObjectedClient.get('dashboard', 'acl-controlled-dashboard-2');
      } catch (e) {
        error = e;
      }
      expect(error).not.toBeUndefined();
      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
    });

    it('should return consistent dashboard when user permitted', async () => {
      expect(
        (await permittedSavedObjectedClient.get('dashboard', 'inner-workspace-dashboard-1')).error
      ).toBeUndefined();
      expect(
        (await permittedSavedObjectedClient.get('dashboard', 'acl-controlled-dashboard-2')).error
      ).toBeUndefined();
    });
  });

  describe('bulkGet', () => {
    it('should throw forbidden error when user not permitted', async () => {
      const result = await notPermittedSavedObjectedClient.bulkGet([
        { type: 'dashboard', id: 'acl-controlled-dashboard-2' },
      ]);

      expect(result.saved_objects).toEqual([
        {
          ...result.saved_objects[0],
          id: 'acl-controlled-dashboard-2',
          type: 'dashboard',
          attributes: {},
          error: {
            error: 'Forbidden',
            statusCode: 403,
            message: 'Invalid saved objects permission',
          },
          workspaces: [],
        },
      ]);
    });

    it('should return consistent dashboard when user permitted', async () => {
      expect(
        (
          await permittedSavedObjectedClient.bulkGet([
            { type: 'dashboard', id: 'inner-workspace-dashboard-1' },
          ])
        ).saved_objects.length
      ).toEqual(1);
      expect(
        (
          await permittedSavedObjectedClient.bulkGet([
            { type: 'dashboard', id: 'acl-controlled-dashboard-2' },
          ])
        ).saved_objects.length
      ).toEqual(1);
    });
  });

  describe('find', () => {
    it('should return empty result if user not permitted', async () => {
      await expect(
        notPermittedSavedObjectedClient.find({
          type: 'dashboard',
          workspaces: ['workspace-1'],
          perPage: 999,
          page: 1,
        })
      ).rejects.toMatchInlineSnapshot(`[Error: Exist invalid workspaces]`);
    });

    it('should return consistent inner workspace data when user permitted', async () => {
      const result = await permittedSavedObjectedClient.find({
        type: 'dashboard',
        workspaces: ['workspace-1'],
        perPage: 999,
        page: 1,
      });

      expect(result.saved_objects.some((item) => item.id === 'inner-workspace-dashboard-1')).toBe(
        true
      );
    });

    it('should return consistent result when workspaces and ACLSearchParams not provided', async () => {
      const result = await permittedSavedObjectedClient.find({
        type: 'dashboard',
        perPage: 999,
        page: 1,
      });

      expect(result.saved_objects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'inner-workspace-dashboard-1' }),
          expect.objectContaining({ id: 'acl-controlled-dashboard-2' }),
        ])
      );
    });

    it('should return acl controled dashboards when only ACLSearchParams provided', async () => {
      const result = await permittedSavedObjectedClient.find({
        type: 'dashboard',
        perPage: 999,
        page: 1,
        ACLSearchParams: {
          permissionModes: ['read', 'write'],
        },
      });

      expect(result.saved_objects).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'acl-controlled-dashboard-2' })])
      );
    });

    it('should return global non-user-level configs when search with sortField buildNum', async () => {
      const configsForCreation: SavedObjectsBulkCreateObject[] = [
        {
          id: 'user_foo',
          type: 'config',
          attributes: {},
        },
        {
          id: 'user_bar',
          type: 'config',
          attributes: {},
        },
        {
          id: 'global_config',
          type: 'config',
          attributes: {
            buildNum: 1,
          },
        },
      ];
      await permittedSavedObjectedClient.bulkCreate(configsForCreation);
      const result = await permittedSavedObjectedClient.find({
        type: 'config',
        sortField: 'buildNum',
        perPage: 999,
        page: 1,
      });

      const resultForFindConfig = await permittedSavedObjectedClient.find({
        type: 'config',
        perPage: 999,
        page: 1,
      });

      expect(result.saved_objects).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'global_config' })])
      );
      expect(result.saved_objects.length).toEqual(1);
      expect(result.total).toEqual(1);

      // Should not be able to find global config if do not find with `sortField: 'buildNum'`
      expect(resultForFindConfig.saved_objects.length).toEqual(0);

      // clean up the test configs
      await Promise.all(
        configsForCreation.map((config) =>
          permittedSavedObjectedClient.delete(config.type, config.id as string)
        )
      );
    });
  });

  describe('create', () => {
    it('should throw bad request error when workspace is invalid and create called', async () => {
      await expect(
        notPermittedSavedObjectedClient.create(
          'dashboard',
          {},
          {
            workspaces: ['workspace-1'],
          }
        )
      ).rejects.toMatchInlineSnapshot(`[Error: Exist invalid workspaces]`);
    });

    it('should able to create saved objects into permitted workspaces after create called', async () => {
      const createResult = await permittedSavedObjectedClient.create(
        'dashboard',
        {},
        {
          workspaces: ['workspace-1'],
        }
      );
      expect(createResult.error).toBeUndefined();
      await permittedSavedObjectedClient.delete('dashboard', createResult.id);
    });

    it('should throw forbidden error when create with override', async () => {
      let error;
      try {
        await notPermittedSavedObjectedClient.create(
          'dashboard',
          {},
          {
            id: 'inner-workspace-dashboard-1',
            overwrite: true,
          }
        );
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
    });

    it('should able to create with override', async () => {
      const createResult = await permittedSavedObjectedClient.create(
        'dashboard',
        {},
        {
          id: 'inner-workspace-dashboard-1',
          overwrite: true,
          workspaces: ['workspace-1'],
        }
      );

      expect(createResult.error).toBeUndefined();
    });

    it('should able to create workspace with override', async () => {
      const createResult = await permittedSavedObjectedClient.create(
        'workspace',
        {},
        {
          id: 'workspace-2',
          overwrite: true,
          permissions: {
            library_write: { users: ['foo'] },
            write: { users: ['foo'] },
          },
        }
      );

      expect(createResult.error).toBeUndefined();
    });

    it('should throw forbidden error when user create a workspace and is not OSD admin', async () => {
      let error;
      try {
        await permittedSavedObjectedClient.create('workspace', {}, {});
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);

      try {
        await permittedSavedObjectedClient.create('workspace', {}, { id: 'workspace-1' });
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);

      try {
        await permittedSavedObjectedClient.create('workspace', {}, { overwrite: true });
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);

      try {
        await permittedSavedObjectedClient.create(
          'workspace',
          {},
          { id: 'no-exist', overwrite: true }
        );
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isNotFoundError(error)).toBe(true);
    });
  });

  describe('bulkCreate', () => {
    it('should throw bad request error when workspace is invalid and bulkCreate called', async () => {
      await expect(
        notPermittedSavedObjectedClient.bulkCreate([{ type: 'dashboard', attributes: {} }], {
          workspaces: ['workspace-1'],
        })
      ).rejects.toMatchInlineSnapshot(`[Error: Exist invalid workspaces]`);
    });

    it('should able to create saved objects into permitted workspaces after bulkCreate called', async () => {
      const objectId = new Date().getTime().toString(16).toUpperCase();
      const result = await permittedSavedObjectedClient.bulkCreate(
        [{ type: 'dashboard', attributes: {}, id: objectId }],
        {
          workspaces: ['workspace-1'],
        }
      );
      expect(result.saved_objects.length).toEqual(1);
      await permittedSavedObjectedClient.delete('dashboard', objectId);
    });

    it('should throw forbidden error when create with override', async () => {
      let error;
      try {
        await notPermittedSavedObjectedClient.bulkCreate(
          [
            {
              id: 'inner-workspace-dashboard-1',
              type: 'dashboard',
              attributes: {},
            },
          ],
          {
            overwrite: true,
          }
        );
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
    });

    it('should able to bulk create with override', async () => {
      const createResult = await permittedSavedObjectedClient.bulkCreate(
        [
          {
            id: 'inner-workspace-dashboard-1',
            type: 'dashboard',
            attributes: {},
          },
        ],
        {
          overwrite: true,
          workspaces: ['workspace-1'],
        }
      );

      expect(createResult.saved_objects).toHaveLength(1);
    });

    it('should able to bulk create workspace with override', async () => {
      const createResult = await permittedSavedObjectedClient.bulkCreate(
        [
          {
            id: 'workspace-2',
            type: 'workspace',
            attributes: {},
          },
        ],
        {
          overwrite: true,
        }
      );

      expect(createResult.saved_objects).toHaveLength(1);
    });

    it('should throw forbidden error when user bulk create workspace and is not OSD admin', async () => {
      let error;
      try {
        await permittedSavedObjectedClient.bulkCreate([{ type: 'workspace', attributes: {} }]);
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);

      try {
        await permittedSavedObjectedClient.bulkCreate([{ type: 'workspace', attributes: {} }], {
          overwrite: true,
        });
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);

      try {
        await permittedSavedObjectedClient.bulkCreate([
          { type: 'workspace', id: 'test', attributes: {} },
        ]);
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
    });
  });

  describe('update', () => {
    it('should throw forbidden error when data not permitted', async () => {
      let error;
      try {
        await notPermittedSavedObjectedClient.update(
          'dashboard',
          'inner-workspace-dashboard-1',
          {}
        );
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);

      error = undefined;
      try {
        await notPermittedSavedObjectedClient.update('dashboard', 'acl-controlled-dashboard-2', {});
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
    });

    it('should update saved objects for permitted workspaces', async () => {
      expect(
        (await permittedSavedObjectedClient.update('dashboard', 'inner-workspace-dashboard-1', {}))
          .error
      ).toBeUndefined();
      expect(
        (await permittedSavedObjectedClient.update('dashboard', 'acl-controlled-dashboard-2', {}))
          .error
      ).toBeUndefined();
    });
  });

  describe('bulkUpdate', () => {
    it('should throw forbidden error when data not permitted', async () => {
      let error;
      try {
        await notPermittedSavedObjectedClient.bulkUpdate(
          [{ type: 'dashboard', id: 'inner-workspace-dashboard-1', attributes: {} }],
          {}
        );
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);

      error = undefined;
      try {
        await notPermittedSavedObjectedClient.bulkUpdate(
          [{ type: 'dashboard', id: 'acl-controlled-dashboard-2', attributes: {} }],
          {}
        );
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
    });

    it('should bulk update saved objects for permitted workspaces', async () => {
      expect(
        (
          await permittedSavedObjectedClient.bulkUpdate([
            { type: 'dashboard', id: 'inner-workspace-dashboard-1', attributes: {} },
          ])
        ).saved_objects.length
      ).toEqual(1);
      expect(
        (
          await permittedSavedObjectedClient.bulkUpdate([
            { type: 'dashboard', id: 'inner-workspace-dashboard-1', attributes: {} },
          ])
        ).saved_objects.length
      ).toEqual(1);
    });
  });

  describe('delete', () => {
    it('should throw forbidden error when data not permitted', async () => {
      let error;
      try {
        await notPermittedSavedObjectedClient.delete('dashboard', 'inner-workspace-dashboard-1');
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);

      error = undefined;
      try {
        await notPermittedSavedObjectedClient.delete('dashboard', 'acl-controlled-dashboard-2');
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
    });

    it('should be able to delete permitted data', async () => {
      const createResult = await repositoryKit.create(
        internalSavedObjectsRepository,
        'dashboard',
        {},
        {
          workspaces: ['workspace-1'],
        }
      );

      await permittedSavedObjectedClient.delete('dashboard', createResult.id);

      let error;
      try {
        error = await permittedSavedObjectedClient.get('dashboard', createResult.id);
      } catch (e) {
        error = e;
      }
      expect(SavedObjectsErrorHelpers.isNotFoundError(error)).toBe(true);
    });

    it('should be able to delete acl controlled permitted data', async () => {
      const createResult = await repositoryKit.create(
        internalSavedObjectsRepository,
        'dashboard',
        {},
        {
          permissions: {
            read: { users: ['foo'] },
            write: { users: ['foo'] },
          },
        }
      );

      await permittedSavedObjectedClient.delete('dashboard', createResult.id);

      let error;
      try {
        error = await permittedSavedObjectedClient.get('dashboard', createResult.id);
      } catch (e) {
        error = e;
      }
      expect(SavedObjectsErrorHelpers.isNotFoundError(error)).toBe(true);
    });
  });

  describe('deleteByWorkspace', () => {
    it('should throw forbidden error when workspace not permitted', async () => {
      let error;
      try {
        await notPermittedSavedObjectedClient.deleteByWorkspace('workspace-1');
      } catch (e) {
        error = e;
      }

      expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
    });

    it('should be able to delete all data in permitted workspace', async () => {
      const deleteWorkspaceId = 'workspace-to-delete';
      await repositoryKit.create(
        internalSavedObjectsRepository,
        'workspace',
        {},
        {
          id: deleteWorkspaceId,
          permissions: {
            read: { users: ['foo'] },
            library_write: { users: ['foo'] },
          },
        }
      );
      const dashboardIds = [
        'inner-delete-workspace-dashboard-1',
        'inner-delete-workspace-dashboard-2',
      ];
      await Promise.all(
        dashboardIds.map((dashboardId) =>
          repositoryKit.create(
            internalSavedObjectsRepository,
            'dashboard',
            {},
            {
              id: dashboardId,
              workspaces: [deleteWorkspaceId],
            }
          )
        )
      );

      expect(
        (
          await permittedSavedObjectedClient.find({
            type: 'dashboard',
            workspaces: [deleteWorkspaceId],
          })
        ).total
      ).toBe(2);

      await permittedSavedObjectedClient.deleteByWorkspace(deleteWorkspaceId, { refresh: true });

      expect(
        (
          await permittedSavedObjectedClient.find({
            type: 'dashboard',
            workspaces: [deleteWorkspaceId],
          })
        ).total
      ).toBe(0);
    });
  });

  describe('Dashboard admin', () => {
    it('should return consistent dashboard after get called', async () => {
      expect(
        (await dashboardAdminSavedObjectedClient.get('dashboard', 'inner-workspace-dashboard-1'))
          .error
      ).toBeUndefined();
      expect(
        (await dashboardAdminSavedObjectedClient.get('dashboard', 'acl-controlled-dashboard-2'))
          .error
      ).toBeUndefined();
    });
    it('should return consistent dashboard after bulkGet called', async () => {
      expect(
        (
          await dashboardAdminSavedObjectedClient.bulkGet([
            { type: 'dashboard', id: 'inner-workspace-dashboard-1' },
          ])
        ).saved_objects.length
      ).toEqual(1);
      expect(
        (
          await dashboardAdminSavedObjectedClient.bulkGet([
            { type: 'dashboard', id: 'acl-controlled-dashboard-2' },
          ])
        ).saved_objects.length
      ).toEqual(1);
    });
    it('should return consistent inner workspace data after find called', async () => {
      const result = await dashboardAdminSavedObjectedClient.find({
        type: 'dashboard',
        workspaces: ['workspace-1'],
        perPage: 999,
        page: 1,
      });

      expect(result.saved_objects.some((item) => item.id === 'inner-workspace-dashboard-1')).toBe(
        true
      );
    });
    it('should able to create saved objects into any workspaces after create called', async () => {
      const createResult = await dashboardAdminSavedObjectedClient.create(
        'dashboard',
        {},
        {
          workspaces: ['workspace-1'],
        }
      );
      expect(createResult.error).toBeUndefined();
      await dashboardAdminSavedObjectedClient.delete('dashboard', createResult.id);
    });
    it('should able to create with override after create called', async () => {
      const createResult = await dashboardAdminSavedObjectedClient.create(
        'dashboard',
        {},
        {
          id: 'inner-workspace-dashboard-1',
          overwrite: true,
          workspaces: ['workspace-1'],
        }
      );

      expect(createResult.error).toBeUndefined();
    });
    it('should able to bulk create with override after bulkCreate called', async () => {
      const createResult = await dashboardAdminSavedObjectedClient.bulkCreate(
        [
          {
            id: 'inner-workspace-dashboard-1',
            type: 'dashboard',
            attributes: {},
          },
        ],
        {
          overwrite: true,
          workspaces: ['workspace-1'],
        }
      );

      expect(createResult.saved_objects).toHaveLength(1);
    });
    it('should able to create saved objects into any workspaces after bulkCreate called', async () => {
      const objectId = new Date().getTime().toString(16).toUpperCase();
      const result = await dashboardAdminSavedObjectedClient.bulkCreate(
        [{ type: 'dashboard', attributes: {}, id: objectId }],
        {
          workspaces: ['workspace-1'],
        }
      );
      expect(result.saved_objects.length).toEqual(1);
      await dashboardAdminSavedObjectedClient.delete('dashboard', objectId);
    });
    it('should update saved objects for any workspaces after update called', async () => {
      expect(
        (
          await dashboardAdminSavedObjectedClient.update(
            'dashboard',
            'inner-workspace-dashboard-1',
            {}
          )
        ).error
      ).toBeUndefined();
      expect(
        (
          await dashboardAdminSavedObjectedClient.update(
            'dashboard',
            'acl-controlled-dashboard-2',
            {}
          )
        ).error
      ).toBeUndefined();
    });
    it('should bulk update saved objects for any workspaces after bulkUpdate called', async () => {
      expect(
        (
          await dashboardAdminSavedObjectedClient.bulkUpdate([
            { type: 'dashboard', id: 'inner-workspace-dashboard-1', attributes: {} },
          ])
        ).saved_objects.length
      ).toEqual(1);
      expect(
        (
          await dashboardAdminSavedObjectedClient.bulkUpdate([
            { type: 'dashboard', id: 'inner-workspace-dashboard-1', attributes: {} },
          ])
        ).saved_objects.length
      ).toEqual(1);
    });
    it('should be able to delete any data after delete called', async () => {
      const createPermittedResult = await repositoryKit.create(
        internalSavedObjectsRepository,
        'dashboard',
        {},
        {
          permissions: {
            read: { users: ['foo'] },
            write: { users: ['foo'] },
          },
        }
      );

      await dashboardAdminSavedObjectedClient.delete('dashboard', createPermittedResult.id);

      let permittedError;
      try {
        permittedError = await dashboardAdminSavedObjectedClient.get(
          'dashboard',
          createPermittedResult.id
        );
      } catch (e) {
        permittedError = e;
      }
      expect(SavedObjectsErrorHelpers.isNotFoundError(permittedError)).toBe(true);

      const createACLResult = await repositoryKit.create(
        internalSavedObjectsRepository,
        'dashboard',
        {},
        {
          workspaces: ['workspace-1'],
        }
      );

      await dashboardAdminSavedObjectedClient.delete('dashboard', createACLResult.id);

      let ACLError;
      try {
        ACLError = await dashboardAdminSavedObjectedClient.get('dashboard', createACLResult.id);
      } catch (e) {
        ACLError = e;
      }
      expect(SavedObjectsErrorHelpers.isNotFoundError(ACLError)).toBe(true);
    });
  });
});
