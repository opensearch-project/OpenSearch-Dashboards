/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { WorkspaceAttribute } from 'opensearch-dashboards/server';
import { FtrProviderContext } from '../../ftr_provider_context';

const testWorkspace: WorkspaceAttribute = {
  id: 'fake_id',
  name: 'test_workspace',
  description: 'test_workspace_description',
};

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');
  const opensearch = getService('legacyOpenSearch');

  const MILLISECOND_IN_WEEK = 1000 * 60 * 60 * 24 * 7;

  describe('Workspace CRUD apis', () => {
    it('basic CRUD', async () => {
      const resp = await supertest
        .post(`/api/workspaces`)
        .set('osd-xsrf', 'opensearch-dashboards')
        .send(
          JSON.stringify({
            attributes: testWorkspace,
          })
        )
        .expect(200);

      expect(resp.body).to.be.an('array');
      expect(resp.body.length).to.be.above(0);
      expect(resp.body[0].status).to.be('not_installed');
    });
  });
}
