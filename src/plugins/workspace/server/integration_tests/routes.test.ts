/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceAttribute } from 'src/core/types';
import * as osdTestServer from '../../../../core/test_helpers/osd_server';

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
  beforeAll(async () => {
    const { startOpenSearch, startOpenSearchDashboards } = osdTestServer.createTestServers({
      adjustTimeout: (t: number) => jest.setTimeout(t),
      settings: {
        osd: {
          workspace: {
            enabled: true,
          },
        },
      },
    });
    opensearchServer = await startOpenSearch();
    const startOSDResp = await startOpenSearchDashboards();
    root = startOSDResp.root;
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
      await Promise.all(
        listResult.body.result.workspaces.map((item: WorkspaceAttribute) =>
          osdTestServer.request.delete(root, `/api/workspaces/${item.id}`).expect(200)
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
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      expect(result.body.success).toEqual(true);
      expect(typeof result.body.result.id).toBe('string');
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
    it('delete', async () => {
      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
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
      expect(listResult.body.result.total).toEqual(2);
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
      expect(listResult.body.result.total).toEqual(1);
    });
  });
});
