/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'src/core/types';
import { isEqual } from 'lodash';
import packageInfo from '../../../../../../package.json';
import * as osdTestServer from '../../../../../core/test_helpers/osd_server';

const dashboard: Omit<SavedObject, 'id'> = {
  type: 'dashboard',
  attributes: {},
  references: [],
};

const config: SavedObject = {
  type: 'config',
  attributes: {},
  references: [],
  id: `config:${packageInfo.version}`,
};

interface WorkspaceAttributes {
  id: string;
  name?: string;
  features?: string[];
}

describe('workspace_id_consumer integration test', () => {
  let root: ReturnType<typeof osdTestServer.createRoot>;
  let opensearchServer: osdTestServer.TestOpenSearchUtils;
  let createdFooWorkspace: WorkspaceAttributes = {
    id: '',
  };
  let createdBarWorkspace: WorkspaceAttributes = {
    id: '',
  };
  const deleteWorkspace = (workspaceId: string) =>
    osdTestServer.request.delete(root, `/api/workspaces/${workspaceId}`);
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
          migrations: {
            skip: false,
          },
        },
      },
    });
    opensearchServer = await startOpenSearch();
    const startOSDResp = await startOpenSearchDashboards();
    root = startOSDResp.root;
    const createWorkspace = (workspaceAttribute: Omit<WorkspaceAttributes, 'id'>) =>
      osdTestServer.request.post(root, `/api/workspaces`).send({
        attributes: workspaceAttribute,
      });

    createdFooWorkspace = await createWorkspace({
      name: 'foo',
      features: ['use-case-all'],
    }).then((resp) => {
      return resp.body.result;
    });
    createdBarWorkspace = await createWorkspace({
      name: 'bar',
      features: ['use-case-all'],
    }).then((resp) => resp.body.result);
  }, 30000);
  afterAll(async () => {
    await Promise.all([
      deleteWorkspace(createdFooWorkspace.id),
      deleteWorkspace(createdBarWorkspace.id),
    ]);
    await root.shutdown();
    await opensearchServer.stop();
  });

  const deleteItem = async (object: Pick<SavedObject, 'id' | 'type'>) => {
    expect(
      [200, 404].includes(
        (await osdTestServer.request.delete(root, `/api/saved_objects/${object.type}/${object.id}`))
          .statusCode
      )
    ).toEqual(true);
  };

  const getItem = async (object: Pick<SavedObject, 'id' | 'type'>) => {
    return await osdTestServer.request
      .get(root, `/api/saved_objects/${object.type}/${object.id}`)
      .expect(200);
  };

  const clearFooAndBar = async () => {
    await deleteItem({
      type: dashboard.type,
      id: 'foo',
    });
    await deleteItem({
      type: dashboard.type,
      id: 'bar',
    });
  };

  describe('saved objects client related CRUD', () => {
    it('create', async () => {
      const createResult = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/${dashboard.type}`)
        .send({
          attributes: dashboard.attributes,
        })
        .expect(200);

      expect(createResult.body.workspaces).toEqual([createdFooWorkspace.id]);
      await deleteItem({
        type: dashboard.type,
        id: createResult.body.id,
      });
    });

    it('create should not append requestWorkspaceId automatically when the type is config', async () => {
      await osdTestServer.request.delete(
        root,
        `/api/saved_objects/${config.type}/${packageInfo.version}`
      );

      // Get page to trigger create config and it should return 200
      await osdTestServer.request
        .post(
          root,
          `/w/${createdFooWorkspace.id}/api/saved_objects/${config.type}/${packageInfo.version}`
        )
        .send({
          attributes: {
            legacyConfig: 'foo',
          },
        })
        .expect(200);
      const getConfigResult = await osdTestServer.request.get(
        root,
        `/api/saved_objects/${config.type}/${packageInfo.version}`
      );

      // workspaces attributes should not be append
      expect(!getConfigResult.body.workspaces).toEqual(true);
    });

    it('should return error when create with a not existing workspace', async () => {
      await clearFooAndBar();
      const createResultWithNonExistRequestWorkspace = await osdTestServer.request
        .post(root, `/w/not_exist_workspace_id/api/saved_objects/${dashboard.type}`)
        .send({
          attributes: dashboard.attributes,
        })
        .expect(400);

      expect(createResultWithNonExistRequestWorkspace.body.message).toEqual(
        'Exist invalid workspaces'
      );

      const createResultWithNonExistOptionsWorkspace = await osdTestServer.request
        .post(root, `/api/saved_objects/${dashboard.type}`)
        .send({
          attributes: dashboard.attributes,
          workspaces: ['not_exist_workspace_id'],
        })
        .expect(400);
      expect(createResultWithNonExistOptionsWorkspace.body.message).toEqual(
        'Exist invalid workspaces'
      );
    });

    it('bulk create', async () => {
      await clearFooAndBar();
      const createResultFoo = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      expect((createResultFoo.body.saved_objects as any[]).some((item) => item.error)).toEqual(
        false
      );
      expect(
        (createResultFoo.body.saved_objects as any[]).every((item) =>
          isEqual(item.workspaces, [createdFooWorkspace.id])
        )
      ).toEqual(true);
      await Promise.all(
        [...createResultFoo.body.saved_objects].map((item) =>
          deleteItem({
            type: item.type,
            id: item.id,
          })
        )
      );
    });

    it('should return error when bulk create with a not existing workspace', async () => {
      await clearFooAndBar();
      const bulkCreateResultWithNonExistRequestWorkspace = await osdTestServer.request
        .post(root, `/w/not_exist_workspace_id/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(400);

      expect(bulkCreateResultWithNonExistRequestWorkspace.body.message).toEqual(
        'Exist invalid workspaces'
      );

      const bulkCreateResultWithNonExistOptionsWorkspace = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=not_exist_workspace_id`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(400);

      expect(bulkCreateResultWithNonExistOptionsWorkspace.body.message).toEqual(
        'Exist invalid workspaces'
      );
    });

    it('checkConflicts when importing ndjson', async () => {
      await clearFooAndBar();
      const createResultFoo = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/w/${createdBarWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'bar',
          },
        ])
        .expect(200);

      const getResultFoo = await getItem({
        type: dashboard.type,
        id: 'foo',
      });
      const getResultBar = await getItem({
        type: dashboard.type,
        id: 'bar',
      });

      /**
       * import with workspaces when conflicts
       */
      const importWithWorkspacesResult = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_import?overwrite=false`)
        .attach(
          'file',
          Buffer.from(
            [JSON.stringify(getResultFoo.body), JSON.stringify(getResultBar.body)].join('\n'),
            'utf-8'
          ),
          'tmp.ndjson'
        )
        .expect(200);

      expect(importWithWorkspacesResult.body.success).toEqual(false);
      expect(importWithWorkspacesResult.body.errors.length).toEqual(1);
      expect(importWithWorkspacesResult.body.errors[0].id).toEqual('foo');
      expect(importWithWorkspacesResult.body.errors[0].error.type).toEqual('conflict');

      await Promise.all(
        [...createResultFoo.body.saved_objects, ...createResultBar.body.saved_objects].map((item) =>
          deleteItem({
            type: item.type,
            id: item.id,
          })
        )
      );
    });

    it('find by workspaces', async () => {
      const createResultFoo = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/w/${createdBarWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'bar',
          },
        ])
        .expect(200);

      const findResult = await osdTestServer.request
        .get(root, `/w/${createdBarWorkspace.id}/api/saved_objects/_find?type=${dashboard.type}`)
        .expect(200);

      expect(findResult.body.total).toEqual(1);
      expect(findResult.body.saved_objects[0].workspaces).toEqual([createdBarWorkspace.id]);

      await Promise.all(
        [...createResultFoo.body.saved_objects, ...createResultBar.body.saved_objects].map((item) =>
          deleteItem({
            type: item.type,
            id: item.id,
          })
        )
      );
    });

    it('should return error when find with a not existing workspace', async () => {
      const findResult = await osdTestServer.request
        .get(root, `/w/not_exist_workspace_id/api/saved_objects/_find?type=${dashboard.type}`)
        .expect(400);

      expect(findResult.body.message).toEqual('Exist invalid workspaces');
    });

    it('import within workspace', async () => {
      await clearFooAndBar();

      const importWithWorkspacesResult = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_import?overwrite=false`)
        .attach(
          'file',
          Buffer.from(
            [
              JSON.stringify({
                ...dashboard,
                id: 'bar',
              }),
            ].join('\n'),
            'utf-8'
          ),
          'tmp.ndjson'
        )
        .expect(200);

      const findResult = await osdTestServer.request
        .get(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_find?type=${dashboard.type}`)
        .expect(200);

      expect(importWithWorkspacesResult.body.success).toEqual(true);
      expect(findResult.body.saved_objects[0].workspaces).toEqual([createdFooWorkspace.id]);
    });

    it('get', async () => {
      await clearFooAndBar();
      await osdTestServer.request.delete(
        root,
        `/api/saved_objects/${config.type}/${packageInfo.version}`
      );
      const createResultFoo = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/w/${createdBarWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'bar',
          },
        ])
        .expect(200);

      await osdTestServer.request
        .post(root, `/api/saved_objects/${config.type}/${packageInfo.version}`)
        .send({
          attributes: {
            legacyConfig: 'foo',
          },
        })
        .expect(200);

      const getResultWithRequestWorkspace = await osdTestServer.request
        .get(root, `/w/${createdFooWorkspace.id}/api/saved_objects/${dashboard.type}/foo`)
        .expect(200);
      expect(getResultWithRequestWorkspace.body.id).toEqual('foo');
      expect(getResultWithRequestWorkspace.body.workspaces).toEqual([createdFooWorkspace.id]);

      const getResultWithoutRequestWorkspace = await osdTestServer.request
        .get(root, `/api/saved_objects/${dashboard.type}/bar`)
        .expect(200);
      expect(getResultWithoutRequestWorkspace.body.id).toEqual('bar');

      const getGlobalResultWithinWorkspace = await osdTestServer.request
        .get(
          root,
          `/w/${createdFooWorkspace.id}/api/saved_objects/${config.type}/${packageInfo.version}`
        )
        .expect(200);
      expect(getGlobalResultWithinWorkspace.body.id).toEqual(packageInfo.version);

      await osdTestServer.request
        .get(root, `/w/${createdFooWorkspace.id}/api/saved_objects/${dashboard.type}/bar`)
        .expect(403);

      await Promise.all(
        [...createResultFoo.body.saved_objects, ...createResultBar.body.saved_objects].map((item) =>
          deleteItem({
            type: item.type,
            id: item.id,
          })
        )
      );
      await osdTestServer.request.delete(
        root,
        `/api/saved_objects/${config.type}/${packageInfo.version}`
      );
    });

    it('bulk get', async () => {
      await clearFooAndBar();
      const createResultFoo = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/w/${createdBarWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dashboard,
            id: 'bar',
          },
        ])
        .expect(200);

      const payload = [
        { id: 'foo', type: 'dashboard' },
        { id: 'bar', type: 'dashboard' },
      ];
      const bulkGetResultWithWorkspace = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_bulk_get`)
        .send(payload)
        .expect(200);

      expect(bulkGetResultWithWorkspace.body.saved_objects.length).toEqual(2);
      expect(bulkGetResultWithWorkspace.body.saved_objects[0].id).toEqual('foo');
      expect(bulkGetResultWithWorkspace.body.saved_objects[0].workspaces).toEqual([
        createdFooWorkspace.id,
      ]);
      expect(bulkGetResultWithWorkspace.body.saved_objects[0]?.error).toBeUndefined();
      expect(bulkGetResultWithWorkspace.body.saved_objects[1].id).toEqual('bar');
      expect(bulkGetResultWithWorkspace.body.saved_objects[1].workspaces).toBeUndefined();
      expect(bulkGetResultWithWorkspace.body.saved_objects[1]?.error).toMatchInlineSnapshot(`
        Object {
          "error": "Forbidden",
          "message": "Saved object does not belong to the workspace",
          "statusCode": 403,
        }
      `);

      const bulkGetResultWithoutWorkspace = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_get`)
        .send(payload)
        .expect(200);

      expect(bulkGetResultWithoutWorkspace.body.saved_objects.length).toEqual(2);
      expect(bulkGetResultWithoutWorkspace.body.saved_objects[0].id).toEqual('foo');
      expect(bulkGetResultWithoutWorkspace.body.saved_objects[0].workspaces).toEqual([
        createdFooWorkspace.id,
      ]);
      expect(bulkGetResultWithoutWorkspace.body.saved_objects[0]?.error).toBeUndefined();
      expect(bulkGetResultWithoutWorkspace.body.saved_objects[1].id).toEqual('bar');
      expect(bulkGetResultWithoutWorkspace.body.saved_objects[1].workspaces).toEqual([
        createdBarWorkspace.id,
      ]);
      expect(bulkGetResultWithoutWorkspace.body.saved_objects[1]?.error).toBeUndefined();

      await Promise.all(
        [...createResultFoo.body.saved_objects, ...createResultBar.body.saved_objects].map((item) =>
          deleteItem({
            type: item.type,
            id: item.id,
          })
        )
      );
    });
  });
});
