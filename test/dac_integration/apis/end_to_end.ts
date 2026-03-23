/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import expect from '@osd/expect';
import { FtrProviderContext } from '../ftr_provider_context';
import { dacTestId } from '../helpers/dashboard_fixtures';
import { deleteSavedObject } from '../helpers/test_utils';

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  describe('Dashboards-as-Code end-to-end workflow', () => {
    const dashboardId = dacTestId('e2e-workflow');
    const dashboardTitle = 'DaC E2E Workflow Dashboard';
    const updatedTitle = 'DaC E2E Workflow Dashboard (Updated)';

    // Full dashboard definition to be built from the schema
    let dashboardDefinition: any;

    after(async () => {
      // Step 12: Cleanup — delete the dashboard
      await deleteSavedObject(supertest, 'dashboard', dashboardId);
    });

    it('Step 1: GET /api/saved_objects/_schemas — fetch available schemas', async () => {
      const resp = await supertest
        .get('/api/saved_objects/_schemas')
        .set('osd-xsrf', 'true')
        .expect(200);

      expect(resp.body).to.have.property('schemas');
      expect(resp.body.schemas).to.be.an('array');

      const dashboardSchema = resp.body.schemas.find((s: any) => s.type === 'dashboard');
      expect(dashboardSchema).to.not.be(undefined);
    });

    it('Step 2: Build a dashboard definition matching the schema', () => {
      // Construct a dashboard definition based on the known schema
      dashboardDefinition = {
        type: 'dashboard',
        id: dashboardId,
        attributes: {
          title: dashboardTitle,
          description: 'End-to-end test dashboard for the DaC workflow.',
          panelsJSON: JSON.stringify([
            {
              gridData: { x: 0, y: 0, w: 24, h: 15, i: 'panel_1' },
              panelIndex: 'panel_1',
              embeddableConfig: {},
              version: '3.0.0',
              type: 'visualization',
              id: dacTestId('e2e-vis-placeholder'),
            },
          ]),
          optionsJSON: JSON.stringify({
            hidePanelTitles: false,
            useMargins: true,
          }),
          timeRestore: false,
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({
              query: { query: '', language: 'kuery' },
              filter: [],
            }),
          },
        },
        references: [
          {
            type: 'visualization',
            id: dacTestId('e2e-vis-placeholder'),
            name: 'panel_1',
          },
        ],
      };

      // Verify the definition was built correctly
      expect(dashboardDefinition.type).to.be('dashboard');
      expect(dashboardDefinition.id).to.be(dashboardId);
      expect(dashboardDefinition.attributes.title).to.be(dashboardTitle);
    });

    it('Step 3: POST /api/saved_objects/_validate — validate the definition', async () => {
      const resp = await supertest
        .post('/api/saved_objects/_validate')
        .set('osd-xsrf', 'true')
        .send({
          type: dashboardDefinition.type,
          attributes: dashboardDefinition.attributes,
        })
        .expect(200);

      expect(resp.body.valid).to.be(true);
    });

    it('Step 4: POST /api/saved_objects/_diff — should be "new"', async () => {
      const resp = await supertest
        .post('/api/saved_objects/_diff')
        .set('osd-xsrf', 'true')
        .send({
          objects: [
            {
              type: dashboardDefinition.type,
              id: dashboardDefinition.id,
              attributes: dashboardDefinition.attributes,
              references: dashboardDefinition.references,
            },
          ],
        })
        .expect(200);

      expect(resp.body.results).to.be.an('array');
      expect(resp.body.results.length).to.be(1);
      expect(resp.body.results[0].status).to.be('new');
    });

    it('Step 5: POST /api/saved_objects/_bulk_apply — create the dashboard', async () => {
      const resp = await supertest
        .post('/api/saved_objects/_bulk_apply')
        .set('osd-xsrf', 'true')
        .send({
          objects: [
            {
              type: dashboardDefinition.type,
              id: dashboardDefinition.id,
              attributes: dashboardDefinition.attributes,
              references: dashboardDefinition.references,
            },
          ],
        })
        .expect(200);

      expect(resp.body.results).to.be.an('array');
      expect(resp.body.results.length).to.be(1);
      expect(resp.body.results[0].status).to.be('created');
    });

    it('Step 6: GET /api/saved_objects/dashboard/{id} — verify it exists', async () => {
      const resp = await supertest
        .get(`/api/saved_objects/dashboard/${dashboardId}`)
        .set('osd-xsrf', 'true')
        .expect(200);

      expect(resp.body.id).to.be(dashboardId);
      expect(resp.body.type).to.be('dashboard');
      expect(resp.body.attributes.title).to.be(dashboardTitle);
      expect(resp.body.references).to.be.an('array');
    });

    it('Step 7: Modify the dashboard definition', () => {
      dashboardDefinition.attributes = {
        ...dashboardDefinition.attributes,
        title: updatedTitle,
        description: 'Updated description after initial creation.',
      };

      expect(dashboardDefinition.attributes.title).to.be(updatedTitle);
    });

    it('Step 8: POST /api/saved_objects/_diff — should be "updated"', async () => {
      const resp = await supertest
        .post('/api/saved_objects/_diff')
        .set('osd-xsrf', 'true')
        .send({
          objects: [
            {
              type: dashboardDefinition.type,
              id: dashboardDefinition.id,
              attributes: dashboardDefinition.attributes,
              references: dashboardDefinition.references,
            },
          ],
        })
        .expect(200);

      expect(resp.body.results).to.be.an('array');
      expect(resp.body.results.length).to.be(1);
      expect(resp.body.results[0].status).to.be('updated');
      expect(resp.body.results[0].diff).to.not.be(undefined);
    });

    it('Step 9: POST /api/saved_objects/_bulk_apply — update the dashboard', async () => {
      const resp = await supertest
        .post('/api/saved_objects/_bulk_apply')
        .set('osd-xsrf', 'true')
        .send({
          objects: [
            {
              type: dashboardDefinition.type,
              id: dashboardDefinition.id,
              attributes: dashboardDefinition.attributes,
              references: dashboardDefinition.references,
            },
          ],
        })
        .expect(200);

      expect(resp.body.results).to.be.an('array');
      expect(resp.body.results.length).to.be(1);
      expect(resp.body.results[0].status).to.be('updated');
    });

    it('Step 10: GET /api/saved_objects/dashboard/{id} — verify changes persisted', async () => {
      const resp = await supertest
        .get(`/api/saved_objects/dashboard/${dashboardId}`)
        .set('osd-xsrf', 'true')
        .expect(200);

      expect(resp.body.id).to.be(dashboardId);
      expect(resp.body.attributes.title).to.be(updatedTitle);
      expect(resp.body.attributes.description).to.be(
        'Updated description after initial creation.'
      );
    });

    it('Step 11: POST /api/saved_objects/_export_clean — export and verify', async () => {
      const resp = await supertest
        .post('/api/saved_objects/_export_clean')
        .set('osd-xsrf', 'true')
        .send({
          objects: [{ type: 'dashboard', id: dashboardId }],
        })
        .expect(200);

      expect(resp.body).to.have.property('objects');
      expect(resp.body.objects).to.be.an('array');

      const exportedDashboard = resp.body.objects.find(
        (obj: any) => obj.type === 'dashboard' && obj.id === dashboardId
      );
      expect(exportedDashboard).to.not.be(undefined);
      expect(exportedDashboard.attributes.title).to.be(updatedTitle);

      // Verify the export is deterministic by exporting a second time
      const resp2 = await supertest
        .post('/api/saved_objects/_export_clean')
        .set('osd-xsrf', 'true')
        .send({
          objects: [{ type: 'dashboard', id: dashboardId }],
        })
        .expect(200);

      expect(JSON.stringify(resp.body)).to.eql(JSON.stringify(resp2.body));
    });

    it('Step 12: DELETE /api/saved_objects/dashboard/{id} — cleanup', async () => {
      await supertest
        .delete(`/api/saved_objects/dashboard/${dashboardId}`)
        .set('osd-xsrf', 'true')
        .expect(200);

      // Verify it is gone
      await supertest
        .get(`/api/saved_objects/dashboard/${dashboardId}`)
        .set('osd-xsrf', 'true')
        .expect(404);
    });
  });
}
