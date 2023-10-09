/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { WorkspaceAttribute } from 'opensearch-dashboards/server';
import { omit } from 'lodash';
import { FtrProviderContext } from '../../ftr_provider_context';

const testWorkspace: WorkspaceAttribute = {
  id: 'fake_id',
  name: 'test_workspace',
  description: 'test_workspace_description',
};

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  describe('Workspace CRUD apis', () => {
    afterEach(async () => {
      const listResult = await supertest
        .post(`/api/workspaces/_list`)
        .send({
          page: 1,
        })
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(200);
      await Promise.all(
        listResult.body.result.workspaces.map((item: WorkspaceAttribute) =>
          supertest
            .delete(`/api/workspaces/${item.id}`)
            .set('osd-xsrf', 'opensearch-dashboards')
            .expect(200)
        )
      );
    });
    it('create', async () => {
      await supertest
        .post(`/api/workspaces`)
        .send({
          attributes: testWorkspace,
        })
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(400);

      const result: any = await supertest
        .post(`/api/workspaces`)
        .send({
          attributes: omit(testWorkspace, 'id'),
        })
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(200);

      expect(result.body.success).equal(true);
      expect(result.body.result.id).to.be.a('string');
    });
    it('get', async () => {
      const result = await supertest
        .post(`/api/workspaces`)
        .send({
          attributes: omit(testWorkspace, 'id'),
        })
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(200);

      const getResult = await supertest.get(`/api/workspaces/${result.body.result.id}`);
      expect(getResult.body.result.name).equal(testWorkspace.name);
    });
    it('update', async () => {
      const result: any = await supertest
        .post(`/api/workspaces`)
        .send({
          attributes: omit(testWorkspace, 'id'),
        })
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(200);

      await supertest
        .put(`/api/workspaces/${result.body.result.id}`)
        .send({
          attributes: {
            ...omit(testWorkspace, 'id'),
            name: 'updated',
          },
        })
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(200);

      const getResult = await supertest.get(`/api/workspaces/${result.body.result.id}`);

      expect(getResult.body.success).equal(true);
      expect(getResult.body.result.name).equal('updated');
    });
    it('delete', async () => {
      const result: any = await supertest
        .post(`/api/workspaces`)
        .send({
          attributes: omit(testWorkspace, 'id'),
        })
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(200);

      await supertest
        .delete(`/api/workspaces/${result.body.result.id}`)
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(200);

      const getResult = await supertest.get(`/api/workspaces/${result.body.result.id}`);

      expect(getResult.body.success).equal(false);
    });
    it('list', async () => {
      await supertest
        .post(`/api/workspaces`)
        .send({
          attributes: omit(testWorkspace, 'id'),
        })
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(200);

      const listResult = await supertest
        .post(`/api/workspaces/_list`)
        .send({
          page: 1,
        })
        .set('osd-xsrf', 'opensearch-dashboards')
        .expect(200);
      expect(listResult.body.result.total).equal(1);
    });
  }).tags('is:workspace');
}
