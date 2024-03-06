/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceAttribute } from 'src/core/types';
import * as osdTestServer from '../../../../core/test_helpers/osd_server';
import { WORKSPACE_TYPE } from '../../../../core/server';
import { WorkspacePermissionItem } from '../types';

const omitId = <T extends { id?: string }>(object: T): Omit<T, 'id'> => {
  const { id, ...others } = object;
  return others;
};

const testWorkspace: WorkspaceAttribute = {
  id: 'fake_id',
  name: 'test_workspace',
  description: 'test_workspace_description',
};

describe('workspace service', () => {
  let root: ReturnType<typeof osdTestServer.createRoot>;
  let opensearchServer: osdTestServer.TestOpenSearchUtils;
  let osd: osdTestServer.TestOpenSearchDashboardsUtils;
  beforeAll(async () => {
    const { startOpenSearch, startOpenSearchDashboards } = osdTestServer.createTestServers({
      adjustTimeout: (t: number) => jest.setTimeout(t),
      settings: {
        osd: {
          workspace: {
            enabled: true,
            permission: {
              enabled: false,
            },
          },
          migrations: { skip: false },
        },
      },
    });
    opensearchServer = await startOpenSearch();
    osd = await startOpenSearchDashboards();
    root = osd.root;
  });
  afterAll(async () => {
    await root.shutdown();
    await opensearchServer.stop();
  });
  describe('Workspace CRUD APIs', () => {
    afterEach(async () => {
      const listResult = await osdTestServer.request
        .post(root, `/api/workspaces/_list`)
        .send({
          page: 1,
        })
        .expect(200);
      const savedObjectsRepository = osd.coreStart.savedObjects.createInternalRepository([
        WORKSPACE_TYPE,
      ]);
      await expect(
        Promise.all(
          listResult.body.result.workspaces.map((item: WorkspaceAttribute) =>
            // this will delete reserved workspace
            savedObjectsRepository.delete(WORKSPACE_TYPE, item.id)
          )
        )
      ).resolves.toBeInstanceOf(Array);
    });
    it('create', async () => {
      await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: testWorkspace,
        })
        .expect(400);

      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      expect(result.body.success).toEqual(true);
      expect(typeof result.body.result.id).toBe('string');
    });
    it('create with permissions', async () => {
      await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
          permissions: [{ type: 'invalid-type', userId: 'foo', modes: ['read'] }],
        })
        .expect(400);

      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
          permissions: [{ type: 'user', userId: 'foo', modes: ['read'] }],
        })
        .expect(200);

      expect(result.body.success).toEqual(true);
      expect(typeof result.body.result.id).toBe('string');
      expect(
        (
          await osd.coreStart.savedObjects
            .createInternalRepository([WORKSPACE_TYPE])
            .get<{ permissions: WorkspacePermissionItem[] }>(WORKSPACE_TYPE, result.body.result.id)
        ).attributes.permissions
      ).toEqual([
        {
          modes: ['read'],
          type: 'user',
          userId: 'foo',
        },
      ]);
    });
    it('get', async () => {
      const result = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      const getResult = await osdTestServer.request.get(
        root,
        `/api/workspaces/${result.body.result.id}`
      );
      expect(getResult.body.result.name).toEqual(testWorkspace.name);
    });
    it('update', async () => {
      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      await osdTestServer.request
        .put(root, `/api/workspaces/${result.body.result.id}`)
        .send({
          attributes: {
            ...omitId(testWorkspace),
            name: 'updated',
          },
        })
        .expect(200);

      const getResult = await osdTestServer.request.get(
        root,
        `/api/workspaces/${result.body.result.id}`
      );

      expect(getResult.body.success).toEqual(true);
      expect(getResult.body.result.name).toEqual('updated');
    });
    it('update with permissions', async () => {
      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
          permissions: [{ type: 'user', userId: 'foo', modes: ['read'] }],
        })
        .expect(200);

      await osdTestServer.request
        .put(root, `/api/workspaces/${result.body.result.id}`)
        .send({
          attributes: {
            ...omitId(testWorkspace),
          },
          permissions: [{ type: 'user', userId: 'foo', modes: ['write'] }],
        })
        .expect(200);

      expect(
        (
          await osd.coreStart.savedObjects
            .createInternalRepository([WORKSPACE_TYPE])
            .get<{ permissions: WorkspacePermissionItem[] }>(WORKSPACE_TYPE, result.body.result.id)
        ).attributes.permissions
      ).toEqual([
        {
          modes: ['write'],
          type: 'user',
          userId: 'foo',
        },
      ]);
    });
    it('delete', async () => {
      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      await osdTestServer.request
        .post(root, `/api/saved_objects/index-pattern/logstash-*`)
        .send({
          attributes: {
            title: 'logstash-*',
          },
          workspaces: [result.body.result.id],
        })
        .expect(200);

      await osdTestServer.request
        .delete(root, `/api/workspaces/${result.body.result.id}`)
        .expect(200);

      const getResult = await osdTestServer.request.get(
        root,
        `/api/workspaces/${result.body.result.id}`
      );

      expect(getResult.body.success).toEqual(false);

      // saved objects been deleted
      await osdTestServer.request
        .get(root, `/api/saved_objects/index-pattern/logstash-*`)
        .expect(404);
    });
    it('delete reserved workspace', async () => {
      const reservedWorkspace: WorkspaceAttribute = { ...testWorkspace, reserved: true };
      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(reservedWorkspace),
        })
        .expect(200);

      const deleteResult = await osdTestServer.request
        .delete(root, `/api/workspaces/${result.body.result.id}`)
        .expect(200);

      expect(deleteResult.body.success).toEqual(false);
      expect(deleteResult.body.error).toEqual(
        `Reserved workspace ${result.body.result.id} is not allowed to delete.`
      );
    });
    it('list', async () => {
      await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: {
            ...omitId(testWorkspace),
            name: 'another test workspace',
          },
        })
        .expect(200);

      const listResult = await osdTestServer.request
        .post(root, `/api/workspaces/_list`)
        .send({
          page: 1,
        })
        .expect(200);
      // Global and Management workspace will be created by default after workspace list API called.
      expect(listResult.body.result.total).toEqual(4);
    });
    it('unable to perform operations on workspace by calling saved objects APIs', async () => {
      const result = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      /**
       * Can not create workspace by saved objects API
       */
      await osdTestServer.request
        .post(root, `/api/saved_objects/workspace`)
        .send({
          attributes: {
            ...omitId(testWorkspace),
            name: 'another test workspace',
          },
        })
        .expect(400);

      /**
       * Can not get workspace by saved objects API
       */
      await osdTestServer.request
        .get(root, `/api/saved_objects/workspace/${result.body.result.id}`)
        .expect(404);

      /**
       * Can not update workspace by saved objects API
       */
      await osdTestServer.request
        .put(root, `/api/saved_objects/workspace/${result.body.result.id}`)
        .send({
          attributes: {
            name: 'another test workspace',
          },
        })
        .expect(404);

      /**
       * Can not delete workspace by saved objects API
       */
      await osdTestServer.request
        .delete(root, `/api/saved_objects/workspace/${result.body.result.id}`)
        .expect(404);

      /**
       * Can not find workspace by saved objects API
       */
      const findResult = await osdTestServer.request
        .get(root, `/api/saved_objects/_find?type=workspace`)
        .expect(200);
      const listResult = await osdTestServer.request
        .post(root, `/api/workspaces/_list`)
        .send({
          page: 1,
        })
        .expect(200);
      expect(findResult.body.total).toEqual(0);
      // Global and Management workspace will be created by default after workspace list API called.
      expect(listResult.body.result.total).toEqual(3);
    });
  });
});
