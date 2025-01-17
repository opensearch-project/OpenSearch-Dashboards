/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceAttribute } from 'src/core/types';
import * as osdTestServer from '../../../../core/test_helpers/osd_server';
import { WORKSPACE_TYPE, Permissions } from '../../../../core/server';

const omitId = <T extends { id?: string }>(object: T): Omit<T, 'id'> => {
  const { id, ...others } = object;
  return others;
};

const testWorkspace: WorkspaceAttribute = {
  id: 'fake_id',
  name: 'test_workspace',
  description: 'test_workspace_description',
  features: ['use-case-all'],
};

describe('workspace service api integration test', () => {
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
          },
          savedObjects: {
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
      await Promise.all(
        listResult.body.result.workspaces.map((item: WorkspaceAttribute) =>
          // this will delete reserved workspace
          savedObjectsRepository.delete(WORKSPACE_TYPE, item.id)
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
    it('create with empty/blank name', async () => {
      let result = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: { name: '' },
        })
        .expect(400);

      expect(result.body.message).toEqual(
        "[request body.attributes.name]: can't be empty or blank."
      );

      result = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: { name: '   ' },
        })
        .expect(400);

      expect(result.body.message).toEqual(
        "[request body.attributes.name]: can't be empty or blank."
      );
    });

    it('create workspace failed when name duplicate', async () => {
      let result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      expect(result.body.success).toEqual(true);

      await opensearchServer.opensearch.getClient().indices.refresh({ index: '.kibana' });

      // same name
      result = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      expect(result.body.success).toEqual(false);
      expect(result.body.error).toEqual(
        'workspace name has already been used, try with a different name'
      );

      // to verify workspace name is not interpreted as we have enclosed the name with double quotes
      result = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: { ...omitId(testWorkspace), name: 'test test_workspace' },
        })
        .expect(200);

      expect(result.body.success).toEqual(true);
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

    it('get when workspace not found', async () => {
      const workspaceId = 'non-exist workspace id';
      const getResult = await osdTestServer.request.get(root, `/api/workspaces/${workspaceId}`);
      expect(getResult.body.success).toEqual(false);
      expect(getResult.body.error).toEqual('workspace not found');
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

    it('update non exist workspace', async () => {
      const workspaceId = 'non-exist workspace id';

      const result = await osdTestServer.request
        .put(root, `/api/workspaces/${workspaceId}`)
        .send({
          attributes: {
            ...omitId(testWorkspace),
            name: 'updated',
          },
        })
        .expect(200);

      expect(result.body.success).toEqual(false);
      expect(result.body.error).toEqual('workspace not found');
    });

    it('update workspace failed when new name is duplicate', async () => {
      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: { ...omitId(testWorkspace), name: 'foo' },
        })
        .expect(200);

      await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: { ...omitId(testWorkspace), name: 'bar baz' },
        })
        .expect(200);

      const updateResult = await osdTestServer.request
        .put(root, `/api/workspaces/${result.body.result.id}`)
        .send({
          attributes: {
            ...omitId(testWorkspace),
            name: 'bar baz',
          },
        })
        .expect(200);

      expect(updateResult.body.success).toEqual(false);
      expect(updateResult.body.error).toEqual(
        'workspace name has already been used, try with a different name'
      );

      await osdTestServer.request
        .put(root, `/api/workspaces/${result.body.result.id}`)
        .send({
          attributes: {
            ...omitId(testWorkspace),
            name: 'bar',
          },
        })
        .expect(200);

      const getResult = await osdTestServer.request.get(
        root,
        `/api/workspaces/${result.body.result.id}`
      );

      expect(getResult.body.success).toEqual(true);
      expect(getResult.body.result.name).toEqual('bar');
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

    it('delete non exist workspace', async () => {
      const workspaceId = 'non-exist workspace id';
      const result = await osdTestServer.request
        .delete(root, `/api/workspaces/${workspaceId}`)
        .expect(200);

      expect(result.body.success).toEqual(false);
      expect(result.body.error).toEqual('workspace not found');
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
    it('should able to update workspace with partial attributes', async () => {
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
      expect(getResult.body.result.description).toEqual(testWorkspace.description);
    });
  });

  describe('Duplicate saved objects APIs', () => {
    const mockIndexPattern = {
      type: 'index-pattern',
      id: 'my-pattern',
      attributes: { title: 'my-pattern-*' },
      references: [],
    };
    const mockDashboard = {
      type: 'dashboard',
      id: 'my-dashboard',
      attributes: { title: 'Look at my dashboard' },
      references: [],
    };

    afterAll(async () => {
      const listResult = await osdTestServer.request
        .post(root, `/api/workspaces/_list`)
        .send({
          page: 1,
        })
        .expect(200);
      const savedObjectsRepository = osd.coreStart.savedObjects.createInternalRepository([
        WORKSPACE_TYPE,
      ]);
      await Promise.all(
        listResult.body.result.workspaces.map((item: WorkspaceAttribute) =>
          // this will delete reserved workspace
          savedObjectsRepository.delete(WORKSPACE_TYPE, item.id)
        )
      );
    });

    it('requires objects', async () => {
      const result = await osdTestServer.request
        .post(root, `/api/workspaces/_duplicate_saved_objects`)
        .send({})
        .expect(400);

      expect(result.body.message).toMatchInlineSnapshot(
        `"[request body.objects]: expected value of type [array] but got [undefined]"`
      );
    });

    it('requires target workspace', async () => {
      const result = await osdTestServer.request
        .post(root, `/api/workspaces/_duplicate_saved_objects`)
        .send({
          objects: [
            {
              type: 'index-pattern',
              id: 'my-pattern',
            },
            {
              type: 'dashboard',
              id: 'my-dashboard',
            },
          ],
          includeReferencesDeep: true,
        })
        .expect(400);

      expect(result.body.message).toMatchInlineSnapshot(
        `"[request body.targetWorkspace]: expected value of type [string] but got [undefined]"`
      );
    });

    it('duplicate unsupported objects', async () => {
      const result = await osdTestServer.request
        .post(root, `/api/workspaces/_duplicate_saved_objects`)
        .send({
          objects: [
            {
              type: 'unknown',
              id: 'my-pattern',
            },
          ],
          includeReferencesDeep: true,
          targetWorkspace: 'test_workspace',
        })
        .expect(400);

      expect(result.body.message).toMatchInlineSnapshot(
        `"Trying to duplicate object(s) with unsupported types: unknown:my-pattern"`
      );
    });

    it('target workspace does not exist', async () => {
      const result = await osdTestServer.request
        .post(root, `/api/workspaces/_duplicate_saved_objects`)
        .send({
          objects: [
            {
              type: 'index-pattern',
              id: 'my-pattern',
            },
          ],
          includeReferencesDeep: true,
          targetWorkspace: 'test_workspace',
        })
        .expect(400);

      expect(result.body.message).toMatchInlineSnapshot(
        `"Get target workspace error: workspace not found"`
      );
    });

    it('duplicate index pattern and dashboard into a workspace successfully', async () => {
      const createWorkspaceResult: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      expect(createWorkspaceResult.body.success).toEqual(true);
      expect(typeof createWorkspaceResult.body.result.id).toBe('string');

      const createSavedObjectsResult = await osdTestServer.request
        .post(root, '/api/saved_objects/_bulk_create')
        .send([mockIndexPattern, mockDashboard])
        .expect(200);
      expect(createSavedObjectsResult.body.saved_objects.length).toBe(2);

      const targetWorkspace = createWorkspaceResult.body.result.id;
      const result = await osdTestServer.request
        .post(root, `/api/workspaces/_duplicate_saved_objects`)
        .send({
          objects: [
            {
              type: 'index-pattern',
              id: 'my-pattern',
            },
            {
              type: 'dashboard',
              id: 'my-dashboard',
            },
          ],
          includeReferencesDeep: true,
          targetWorkspace,
        })
        .expect(200);
      expect(result.body.success).toEqual(true);
      expect(result.body.successCount).toEqual(2);
    });
  });
});

describe('workspace service api integration test when savedObjects.permission.enabled equal true', () => {
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
      await Promise.all(
        listResult.body.result.workspaces.map((item: WorkspaceAttribute) =>
          // this will delete reserved workspace
          savedObjectsRepository.delete(WORKSPACE_TYPE, item.id)
        )
      );
    });
    it('create', async () => {
      await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
          settings: {
            permissions: { invalid_type: { users: ['foo'] } },
            dataSources: [],
          },
        })
        .expect(400);

      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
          settings: {
            permissions: { read: { users: ['foo'] } },
            dataSources: [],
          },
        })
        .expect(200);

      expect(result.body.success).toEqual(true);
      expect(typeof result.body.result.id).toBe('string');
      expect(
        (
          await osd.coreStart.savedObjects
            .createInternalRepository([WORKSPACE_TYPE])
            .get<{ permissions: Permissions }>(WORKSPACE_TYPE, result.body.result.id)
        ).permissions
      ).toEqual({ read: { users: ['foo'] } });
    });
    it('update', async () => {
      const result: any = await osdTestServer.request
        .post(root, `/api/workspaces`)
        .send({
          attributes: omitId(testWorkspace),
        })
        .expect(200);

      const updateResult = await osdTestServer.request
        .put(root, `/api/workspaces/${result.body.result.id}`)
        .send({
          attributes: {
            ...omitId(testWorkspace),
          },
          settings: {
            permissions: { write: { users: ['foo'] } },
            dataSources: [],
          },
        })
        .expect(200);
      expect(updateResult.body.result).toBe(true);

      expect(
        (
          await osd.coreStart.savedObjects
            .createInternalRepository([WORKSPACE_TYPE])
            .get<{ permissions: Permissions }>(WORKSPACE_TYPE, result.body.result.id)
        ).permissions
      ).toEqual({ write: { users: ['foo'] } });
    });
  });
});
