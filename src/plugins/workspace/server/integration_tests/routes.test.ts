/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceAttribute } from 'src/core/types';
import { omit } from 'lodash';
import * as osdTestServer from '../../../../core/test_helpers/osd_server';
import { WORKSPACE_TYPE } from '../../../../core/server';

const testWorkspace: WorkspaceAttribute = {
  id: 'fake_id',
  name: 'test_workspace',
  description: 'test_workspace_description',
};

describe('workspace service', () => {
  let root: ReturnType<typeof osdTestServer.createRoot>;
  let opensearchServer: osdTestServer.TestOpenSearchUtils;
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
    const startOSDResp = await startOpenSearchDashboards();
    root = startOSDResp.root;
  }, 30000);
  afterAll(async () => {
    await root.shutdown();
    await opensearchServer.stop();
  });
  describe('Workspace CRUD apis', () => {
    afterEach(async () => {
      const listResult = await osdTestServer.request
        .post(root, `/api/workspaces/_list`)
        .send({
          page: 1,
        })
        .expect(200);
      await Promise.all(
        listResult.body.result.workspaces.map((item: WorkspaceAttribute) =>
          // workspace delete API will not able to delete reserved workspace
          // to clean up the test data, change it saved objects delete API
          osdTestServer.request
            .delete(root, `/api/saved_objects/${WORKSPACE_TYPE}/${item.id}`)
            .expect(200)
        )
      );
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
          attributes: omit(testWorkspace, 'id'),
        })
        .expect(200);

      expect(result.body.success).toEqual(true);
      expect(typeof result.body.result.id).toBe('string');
    });
    it('get', async () => {
      const result = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omit(testWorkspace, 'id'),
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
          attributes: omit(testWorkspace, 'id'),
        })
        .expect(200);

      await osdTestServer.request
        .put(root, `/api/workspaces/${result.body.result.id}`)
        .send({
          attributes: {
            ...omit(testWorkspace, 'id'),
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
    it('update with permission', async () => {
      const permission = {
        userId: 'foo',
        type: 'user',
        modes: ['read', 'library_read'],
      };
      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omit(testWorkspace, 'id'),
        })
        .expect(200);

      await osdTestServer.request
        .put(root, `/api/workspaces/${result.body.result.id}`)
        .send({
          attributes: {
            ...omit(testWorkspace, 'id'),
            name: 'updated',
          },
          permissions: permission,
        })
        .expect(200);

      const getResult = await osdTestServer.request.get(
        root,
        `/api/workspaces/${result.body.result.id}`
      );

      expect(getResult.body.success).toEqual(true);
      expect(getResult.body.result.name).toEqual('updated');
      expect(getResult.body.result.permissions[0]).toEqual(permission);
    });
    it('delete', async () => {
      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omit(testWorkspace, 'id'),
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
          attributes: omit(reservedWorkspace, 'id'),
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
          attributes: omit(testWorkspace, 'id'),
        })
        .expect(200);

      const listResult = await osdTestServer.request
        .post(root, `/api/workspaces/_list`)
        .send({
          page: 1,
        })
        .expect(200);
      expect(listResult.body.result.total).toEqual(1);
    });
  });
});
