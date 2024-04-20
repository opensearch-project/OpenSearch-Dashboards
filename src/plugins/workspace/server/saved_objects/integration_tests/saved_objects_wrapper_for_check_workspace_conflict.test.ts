/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'src/core/types';
import { isEqual } from 'lodash';
import packageInfo from '../../../../../../package.json';
import * as osdTestServer from '../../../../../core/test_helpers/osd_server';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../../../data_source/common';

const dashboard: Omit<SavedObject, 'id'> = {
  type: 'dashboard',
  attributes: {},
  references: [],
};

const dataSource: Omit<SavedObject, 'id'> = {
  type: DATA_SOURCE_SAVED_OBJECT_TYPE,
  attributes: {
    title: 'test data source',
  },
  references: [],
};

const advancedSettings: Omit<SavedObject, 'id'> = {
  type: 'config',
  attributes: {},
  references: [],
};

interface WorkspaceAttributes {
  id: string;
  name?: string;
}

describe('saved_objects_wrapper_for_check_workspace_conflict integration test', () => {
  let root: ReturnType<typeof osdTestServer.createRoot>;
  let opensearchServer: osdTestServer.TestOpenSearchUtils;
  let createdFooWorkspace: WorkspaceAttributes = {
    id: '',
  };
  let createdBarWorkspace: WorkspaceAttributes = {
    id: '',
  };
  beforeAll(async () => {
    const { startOpenSearch, startOpenSearchDashboards } = osdTestServer.createTestServers({
      adjustTimeout: (t: number) => jest.setTimeout(t),
      settings: {
        osd: {
          data_source: {
            enabled: true,
          },
          workspace: {
            enabled: true,
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
    }).then((resp) => resp.body.result);
    createdBarWorkspace = await createWorkspace({
      name: 'bar',
    }).then((resp) => resp.body.result);
  }, 30000);
  afterAll(async () => {
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

  describe('workspace related CRUD', () => {
    it('create', async () => {
      const createResult = await osdTestServer.request
        .post(root, `/api/saved_objects/${dashboard.type}`)
        .send({
          attributes: dashboard.attributes,
          workspaces: [createdFooWorkspace.id],
        })
        .expect(200);

      expect(createResult.body.workspaces).toEqual([createdFooWorkspace.id]);
      await deleteItem({
        type: dashboard.type,
        id: createResult.body.id,
      });
    });

    it('create-with-override with unexisting object id', async () => {
      const createResult = await osdTestServer.request
        .post(root, `/api/saved_objects/${dashboard.type}/foo?overwrite=true`)
        .send({
          attributes: dashboard.attributes,
          workspaces: [createdFooWorkspace.id],
        })
        .expect(200);

      expect(createResult.body.id).toEqual('foo');
      expect(createResult.body.workspaces).toEqual([createdFooWorkspace.id]);

      await deleteItem({
        type: dashboard.type,
        id: createResult.body.id,
      });
    });

    it('create-with-override', async () => {
      const createResult = await osdTestServer.request
        .post(root, `/api/saved_objects/${dashboard.type}`)
        .send({
          attributes: dashboard.attributes,
          workspaces: [createdFooWorkspace.id],
        })
        .expect(200);

      await osdTestServer.request
        .post(root, `/api/saved_objects/${dashboard.type}/${createResult.body.id}?overwrite=true`)
        .send({
          attributes: dashboard.attributes,
          workspaces: [createdBarWorkspace.id],
        })
        .expect(409);

      await deleteItem({
        type: dashboard.type,
        id: createResult.body.id,
      });
    });

    it('create disallowed types within workspace', async () => {
      const createDataSourceResult = await osdTestServer.request
        .post(root, `/api/saved_objects/${dataSource.type}`)
        .send({
          attributes: dataSource.attributes,
          workspaces: [createdFooWorkspace.id],
        })
        .expect(400);

      expect(createDataSourceResult.body).toMatchInlineSnapshot(`
        Object {
          "error": "Bad Request",
          "message": "Unsupported type in workspace: 'data-source' is not allowed to be created in workspace.",
          "statusCode": 400,
        }
      `);

      const createConfigResult = await osdTestServer.request
        .post(root, `/api/saved_objects/config`)
        .send({
          attributes: advancedSettings.attributes,
          workspaces: [createdFooWorkspace.id],
        })
        .expect(400);

      expect(createConfigResult.body).toMatchInlineSnapshot(`
        Object {
          "error": "Bad Request",
          "message": "Unsupported type in workspace: 'config' is not allowed to be created in workspace.",
          "statusCode": 400,
        }
      `);
    });

    it('bulk create', async () => {
      await clearFooAndBar();
      const createResultFoo = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=${createdFooWorkspace.id}`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=${createdBarWorkspace.id}`)
        .send([
          {
            ...dashboard,
            id: 'bar',
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
      expect((createResultBar.body.saved_objects as any[]).some((item) => item.error)).toEqual(
        false
      );
      expect(
        (createResultBar.body.saved_objects as any[]).every((item) =>
          isEqual(item.workspaces, [createdBarWorkspace.id])
        )
      ).toEqual(true);
      await Promise.all(
        [...createResultFoo.body.saved_objects, ...createResultBar.body.saved_objects].map((item) =>
          deleteItem({
            type: item.type,
            id: item.id,
          })
        )
      );
    });

    it('bulk create with conflict', async () => {
      await clearFooAndBar();
      const createResultFoo = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=${createdFooWorkspace.id}`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=${createdBarWorkspace.id}`)
        .send([
          {
            ...dashboard,
            id: 'bar',
          },
        ])
        .expect(200);

      /**
       * overwrite with workspaces
       */
      const overwriteWithWorkspacesResult = await osdTestServer.request
        .post(
          root,
          `/api/saved_objects/_bulk_create?overwrite=true&workspaces=${createdFooWorkspace.id}`
        )
        .send([
          {
            ...dashboard,
            id: 'bar',
          },
          {
            ...dashboard,
            id: 'foo',
            attributes: {
              title: 'foo',
            },
          },
        ])
        .expect(200);

      expect(overwriteWithWorkspacesResult.body.saved_objects[0].error.statusCode).toEqual(409);
      expect(overwriteWithWorkspacesResult.body.saved_objects[1].attributes.title).toEqual('foo');
      expect(overwriteWithWorkspacesResult.body.saved_objects[1].workspaces).toEqual([
        createdFooWorkspace.id,
      ]);

      await Promise.all(
        [...createResultFoo.body.saved_objects, ...createResultBar.body.saved_objects].map((item) =>
          deleteItem({
            type: item.type,
            id: item.id,
          })
        )
      );
    });

    it('bulk create with disallowed types in workspace', async () => {
      await clearFooAndBar();

      // import advanced settings and data sources should throw error
      const createResultFoo = await osdTestServer.request
        .post(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_bulk_create`)
        .send([
          {
            ...dataSource,
            id: 'foo',
          },
          {
            ...advancedSettings,
            id: packageInfo.version,
          },
        ])
        .expect(200);
      expect(createResultFoo.body.saved_objects[0].error).toEqual(
        expect.objectContaining({
          message:
            "Unsupported type in workspace: 'data-source' is not allowed to be imported in workspace.",
          statusCode: 400,
        })
      );
      expect(createResultFoo.body.saved_objects[1].error).toEqual(
        expect.objectContaining({
          message:
            "Unsupported type in workspace: 'config' is not allowed to be imported in workspace.",
          statusCode: 400,
        })
      );

      // Data source should not be created
      await osdTestServer.request
        .get(
          root,
          `/w/${createdFooWorkspace.id}/api/saved_objects/${DATA_SOURCE_SAVED_OBJECT_TYPE}/foo`
        )
        .expect(404);

      // Advanced settings should not be created within workspace
      const findAdvancedSettings = await osdTestServer.request
        .get(root, `/w/${createdFooWorkspace.id}/api/saved_objects/_find?type=config`)
        .expect(200);
      expect(findAdvancedSettings.body.total).toEqual(0);
    });

    it('bulk create with disallowed types out of workspace', async () => {
      await clearFooAndBar();

      // import advanced settings and data sources should throw error
      const createResultFoo = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create`)
        .send([
          {
            ...advancedSettings,
            id: packageInfo.version,
          },
        ])
        .expect(200);
      expect(createResultFoo.body).toEqual({
        saved_objects: [
          expect.objectContaining({
            type: advancedSettings.type,
          }),
        ],
      });

      const findAdvancedSettings = await osdTestServer.request
        .get(root, `/api/saved_objects/_find?type=${advancedSettings.type}`)
        .expect(200);
      expect(findAdvancedSettings.body.total).toEqual(1);
    });

    it('checkConflicts when importing ndjson', async () => {
      await clearFooAndBar();
      const createResultFoo = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=${createdFooWorkspace.id}`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=${createdBarWorkspace.id}`)
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
        .post(
          root,
          `/api/saved_objects/_import?workspaces=${createdFooWorkspace.id}&overwrite=false`
        )
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
        .post(root, `/api/saved_objects/_bulk_create?workspaces=${createdFooWorkspace.id}`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=${createdBarWorkspace.id}`)
        .send([
          {
            ...dashboard,
            id: 'bar',
          },
        ])
        .expect(200);

      const findResult = await osdTestServer.request
        .get(
          root,
          `/api/saved_objects/_find?workspaces=${createdBarWorkspace.id}&type=${dashboard.type}`
        )
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
  });
});
