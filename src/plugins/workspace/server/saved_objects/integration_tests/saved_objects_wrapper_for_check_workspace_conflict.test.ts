/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'src/core/types';
import { isEqual } from 'lodash';
import { Readable } from 'stream';
import * as osdTestServer from '../../../../../core/test_helpers/osd_server';

const dashboard: Omit<SavedObject, 'id'> = {
  type: 'dashboard',
  attributes: {},
  references: [],
};

describe('saved_objects_wrapper_for_check_workspace_conflict integration test', () => {
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
          workspaces: ['foo'],
        })
        .expect(200);

      expect(createResult.body.workspaces).toEqual(['foo']);
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
          workspaces: ['foo'],
        })
        .expect(200);

      await osdTestServer.request
        .post(root, `/api/saved_objects/${dashboard.type}/${createResult.body.id}?overwrite=true`)
        .send({
          attributes: dashboard.attributes,
          workspaces: ['bar'],
        })
        .expect(409);

      await deleteItem({
        type: dashboard.type,
        id: createResult.body.id,
      });
    });

    it('bulk create', async () => {
      await clearFooAndBar();
      const createResultFoo = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=foo`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=bar`)
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
          isEqual(item.workspaces, ['foo'])
        )
      ).toEqual(true);
      expect((createResultBar.body.saved_objects as any[]).some((item) => item.error)).toEqual(
        false
      );
      expect(
        (createResultBar.body.saved_objects as any[]).every((item) =>
          isEqual(item.workspaces, ['bar'])
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
        .post(root, `/api/saved_objects/_bulk_create?workspaces=foo`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=bar`)
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
        .post(root, `/api/saved_objects/_bulk_create?overwrite=true&workspaces=foo`)
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
      expect(overwriteWithWorkspacesResult.body.saved_objects[1].workspaces).toEqual(['foo']);

      await Promise.all(
        [...createResultFoo.body.saved_objects, ...createResultBar.body.saved_objects].map((item) =>
          deleteItem({
            type: item.type,
            id: item.id,
          })
        )
      );
    });

    it('checkConflicts when importing ndjson', async () => {
      await clearFooAndBar();
      const createResultFoo = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=foo`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=bar`)
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

      const readableStream = new Readable();
      readableStream.push(
        `Content-Disposition: form-data; name="file"; filename="tmp.ndjson"\r\n\r\n`
      );
      readableStream.push(
        [JSON.stringify(getResultFoo.body), JSON.stringify(getResultBar.body)].join('\n')
      );
      readableStream.push(null);

      /**
       * import with workspaces when conflicts
       */
      const importWithWorkspacesResult = await osdTestServer.request
        .post(root, `/api/saved_objects/_import?workspaces=foo&overwrite=false`)
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
        .post(root, `/api/saved_objects/_bulk_create?workspaces=foo`)
        .send([
          {
            ...dashboard,
            id: 'foo',
          },
        ])
        .expect(200);

      const createResultBar = await osdTestServer.request
        .post(root, `/api/saved_objects/_bulk_create?workspaces=bar`)
        .send([
          {
            ...dashboard,
            id: 'bar',
          },
        ])
        .expect(200);

      const findResult = await osdTestServer.request
        .get(root, `/api/saved_objects/_find?workspaces=bar&type=${dashboard.type}`)
        .expect(200);

      expect(findResult.body.total).toEqual(1);
      expect(findResult.body.saved_objects[0].workspaces).toEqual(['bar']);

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
