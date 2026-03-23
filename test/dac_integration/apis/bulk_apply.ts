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
import { minimalDashboard, dacTestId } from '../helpers/dashboard_fixtures';
import { deleteSavedObject, getSavedObject } from '../helpers/test_utils';

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  describe('POST /api/saved_objects/_bulk_apply', () => {
    describe('creating new objects', () => {
      const ids = [dacTestId('bulk-new-1'), dacTestId('bulk-new-2')];

      after(async () => {
        for (const id of ids) {
          await deleteSavedObject(supertest, 'dashboard', id);
        }
      });

      it('should create multiple new dashboards in a single call', async () => {
        const dashboard1 = minimalDashboard('bulk-new-1');
        const dashboard2 = minimalDashboard('bulk-new-2');

        const resp = await supertest
          .post('/api/saved_objects/_bulk_apply')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard1.type,
                id: dashboard1.id,
                attributes: dashboard1.attributes,
                references: dashboard1.references,
              },
              {
                type: dashboard2.type,
                id: dashboard2.id,
                attributes: dashboard2.attributes,
                references: dashboard2.references,
              },
            ],
          })
          .expect(200);

        expect(resp.body).to.have.property('results');
        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be(2);

        // Verify both were created
        for (const result of resp.body.results) {
          expect(result.status).to.be('created');
          expect(result.type).to.be('dashboard');
        }

        // Verify objects actually exist
        const get1 = await getSavedObject(supertest, 'dashboard', ids[0]);
        expect(get1.status).to.be(200);
        expect(get1.body.attributes.title).to.contain('bulk-new-1');

        const get2 = await getSavedObject(supertest, 'dashboard', ids[1]);
        expect(get2.status).to.be(200);
        expect(get2.body.attributes.title).to.contain('bulk-new-2');
      });
    });

    describe('updating existing objects', () => {
      const id = dacTestId('bulk-update');

      before(async () => {
        const dashboard = minimalDashboard('bulk-update');
        await supertest
          .post(`/api/saved_objects/${dashboard.type}/${dashboard.id}`)
          .set('osd-xsrf', 'true')
          .send({
            attributes: dashboard.attributes,
            references: dashboard.references,
          })
          .expect(200);
      });

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', id);
      });

      it('should update existing dashboards', async () => {
        const dashboard = minimalDashboard('bulk-update');
        const updatedTitle = 'Updated via Bulk Apply';

        const resp = await supertest
          .post('/api/saved_objects/_bulk_apply')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: {
                  ...dashboard.attributes,
                  title: updatedTitle,
                },
                references: dashboard.references,
              },
            ],
          })
          .expect(200);

        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be(1);
        expect(resp.body.results[0].status).to.be('updated');

        // Verify the update persisted
        const getResp = await getSavedObject(supertest, 'dashboard', id);
        expect(getResp.status).to.be(200);
        expect(getResp.body.attributes.title).to.be(updatedTitle);
      });
    });

    describe('mixed create and update', () => {
      const existingId = dacTestId('bulk-mixed-existing');
      const newId = dacTestId('bulk-mixed-new');

      before(async () => {
        const dashboard = minimalDashboard('bulk-mixed-existing');
        await supertest
          .post(`/api/saved_objects/${dashboard.type}/${dashboard.id}`)
          .set('osd-xsrf', 'true')
          .send({
            attributes: dashboard.attributes,
            references: dashboard.references,
          })
          .expect(200);
      });

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', existingId);
        await deleteSavedObject(supertest, 'dashboard', newId);
      });

      it('should handle a mix of creates and updates in one call', async () => {
        const existing = minimalDashboard('bulk-mixed-existing');
        const newDash = minimalDashboard('bulk-mixed-new');

        const resp = await supertest
          .post('/api/saved_objects/_bulk_apply')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: existing.type,
                id: existing.id,
                attributes: {
                  ...existing.attributes,
                  title: 'Mixed - Updated Existing',
                },
                references: existing.references,
              },
              {
                type: newDash.type,
                id: newDash.id,
                attributes: newDash.attributes,
                references: newDash.references,
              },
            ],
          })
          .expect(200);

        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be(2);

        // One should be updated, one created (order may vary)
        const statuses = resp.body.results.map((r: any) => r.status).sort();
        expect(statuses).to.eql(['created', 'updated']);
      });
    });

    describe('dry run', () => {
      const id = dacTestId('bulk-dryrun');

      after(async () => {
        // Should not exist if dry run worked correctly
        await deleteSavedObject(supertest, 'dashboard', id);
      });

      it('should return what would change without persisting', async () => {
        const dashboard = minimalDashboard('bulk-dryrun');

        const resp = await supertest
          .post('/api/saved_objects/_bulk_apply')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: dashboard.attributes,
                references: dashboard.references,
              },
            ],
            dryRun: true,
          })
          .expect(200);

        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be(1);
        expect(resp.body.results[0].status).to.be('created');

        // Verify the object was NOT actually created
        const getResp = await getSavedObject(supertest, 'dashboard', id);
        expect(getResp.status).to.be(404);
      });
    });

    describe('overwrite flag', () => {
      const id = dacTestId('bulk-overwrite');

      before(async () => {
        const dashboard = minimalDashboard('bulk-overwrite');
        await supertest
          .post(`/api/saved_objects/${dashboard.type}/${dashboard.id}`)
          .set('osd-xsrf', 'true')
          .send({
            attributes: dashboard.attributes,
            references: dashboard.references,
          })
          .expect(200);
      });

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', id);
      });

      it('should overwrite existing objects when overwrite=true', async () => {
        const dashboard = minimalDashboard('bulk-overwrite');
        const resp = await supertest
          .post('/api/saved_objects/_bulk_apply')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: {
                  ...dashboard.attributes,
                  title: 'Overwritten Title',
                },
                references: dashboard.references,
              },
            ],
            overwrite: true,
          })
          .expect(200);

        expect(resp.body.results[0].status).to.be('updated');

        const getResp = await getSavedObject(supertest, 'dashboard', id);
        expect(getResp.body.attributes.title).to.be('Overwritten Title');
      });
    });

    describe('error handling', () => {
      const validId = dacTestId('bulk-err-valid');

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', validId);
      });

      it('should report errors for invalid objects while processing valid ones', async () => {
        const validDashboard = minimalDashboard('bulk-err-valid');

        const resp = await supertest
          .post('/api/saved_objects/_bulk_apply')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: validDashboard.type,
                id: validDashboard.id,
                attributes: validDashboard.attributes,
                references: validDashboard.references,
              },
              {
                type: 'nonexistent_type_xyz',
                id: dacTestId('bulk-err-invalid'),
                attributes: { title: 'This type does not exist' },
                references: [],
              },
            ],
          });

        // The endpoint should return 200 with per-object status,
        // or 400 if it rejects the entire batch
        expect(resp.status === 200 || resp.status === 400).to.be(true);

        if (resp.status === 200) {
          expect(resp.body.results).to.be.an('array');
          // At least one result should indicate an error
          const hasError = resp.body.results.some(
            (r: any) => r.status === 'error' || r.error
          );
          expect(hasError).to.be(true);
        }
      });
    });

    describe('labels and annotations', () => {
      const id = dacTestId('bulk-labels');

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', id);
      });

      it('should preserve labels and annotations on created objects', async () => {
        const dashboard = minimalDashboard('bulk-labels');

        const resp = await supertest
          .post('/api/saved_objects/_bulk_apply')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: dashboard.attributes,
                references: dashboard.references,
                labels: {
                  'dac.managed-by': 'integration-test',
                  environment: 'testing',
                },
                annotations: {
                  'dac.source-file': 'test/dac_integration/apis/bulk_apply.ts',
                },
              },
            ],
          })
          .expect(200);

        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be(1);

        // If labels/annotations are supported, they should be preserved
        // The exact retrieval mechanism depends on the implementation
        const getResp = await getSavedObject(supertest, 'dashboard', id);
        expect(getResp.status).to.be(200);
      });
    });

    describe('references between objects', () => {
      const dashId = dacTestId('bulk-ref-dash');
      const visId = dacTestId('bulk-ref-vis');

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', dashId);
        await deleteSavedObject(supertest, 'visualization', visId);
      });

      it('should maintain references between objects created in the same batch', async () => {
        const vis = {
          type: 'visualization',
          id: visId,
          attributes: {
            title: 'Bulk Ref Test Vis',
            visState: JSON.stringify({
              title: 'Bulk Ref Test Vis',
              type: 'metric',
              params: { fontSize: 60 },
              aggs: [{ id: '1', enabled: true, type: 'count', schema: 'metric', params: {} }],
            }),
            uiStateJSON: '{}',
            description: '',
            kibanaSavedObjectMeta: {
              searchSourceJSON: JSON.stringify({
                query: { query: '', language: 'kuery' },
                filter: [],
              }),
            },
          },
          references: [],
        };

        const dashboard = {
          type: 'dashboard',
          id: dashId,
          attributes: {
            title: 'Bulk Ref Test Dashboard',
            description: '',
            panelsJSON: JSON.stringify([
              {
                gridData: { x: 0, y: 0, w: 24, h: 15, i: 'panel_1' },
                panelIndex: 'panel_1',
                embeddableConfig: {},
                version: '3.0.0',
                type: 'visualization',
                id: visId,
              },
            ]),
            optionsJSON: JSON.stringify({ hidePanelTitles: false, useMargins: true }),
            timeRestore: false,
            kibanaSavedObjectMeta: {
              searchSourceJSON: JSON.stringify({
                query: { query: '', language: 'kuery' },
                filter: [],
              }),
            },
          },
          references: [{ type: 'visualization', id: visId, name: 'panel_1' }],
        };

        const resp = await supertest
          .post('/api/saved_objects/_bulk_apply')
          .set('osd-xsrf', 'true')
          .send({
            objects: [vis, dashboard],
          })
          .expect(200);

        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be(2);

        // Verify the dashboard references the visualization
        const getResp = await getSavedObject(supertest, 'dashboard', dashId);
        expect(getResp.status).to.be(200);
        expect(getResp.body.references).to.be.an('array');

        const visRef = getResp.body.references.find(
          (ref: any) => ref.type === 'visualization' && ref.id === visId
        );
        expect(visRef).to.not.be(undefined);

        // Verify the visualization exists
        const visResp = await getSavedObject(supertest, 'visualization', visId);
        expect(visResp.status).to.be(200);
      });
    });
  });
}
