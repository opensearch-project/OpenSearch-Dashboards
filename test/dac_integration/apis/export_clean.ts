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
import { minimalDashboard, minimalVisualization, dacTestId } from '../helpers/dashboard_fixtures';
import { createSavedObject, deleteSavedObject } from '../helpers/test_utils';

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  describe('POST /api/saved_objects/_export_clean', () => {
    const dashId = dacTestId('export-dash');
    const visId = dacTestId('export-vis');

    before(async () => {
      // Create a visualization first (so the dashboard reference is valid)
      const vis = minimalVisualization('export-vis');
      await createSavedObject(supertest, vis.type, vis.id, vis.attributes, vis.references);

      // Create a dashboard that references the visualization
      const dashboard = minimalDashboard('export-dash');
      await createSavedObject(
        supertest,
        dashboard.type,
        dashboard.id,
        dashboard.attributes,
        dashboard.references
      );
    });

    after(async () => {
      await deleteSavedObject(supertest, 'dashboard', dashId);
      await deleteSavedObject(supertest, 'visualization', visId);
    });

    describe('deterministic output', () => {
      it('should produce sorted keys in the export', async () => {
        const resp = await supertest
          .post('/api/saved_objects/_export_clean')
          .set('osd-xsrf', 'true')
          .send({
            objects: [{ type: 'dashboard', id: dashId }],
          })
          .expect(200);

        // Verify the response is valid JSON (not NDJSON)
        expect(resp.body).to.be.an('object');

        // Convert to string and verify keys are sorted
        const exported = JSON.stringify(resp.body);
        expect(exported).to.be.a('string');

        // Verify it has the expected structure
        expect(resp.body).to.have.property('objects');
        expect(resp.body.objects).to.be.an('array');

        // Verify keys within objects are sorted
        if (resp.body.objects.length > 0) {
          const obj = resp.body.objects[0];
          const keys = Object.keys(obj);
          const sortedKeys = [...keys].sort();
          expect(keys).to.eql(sortedKeys);
        }
      });

      it('should produce identical output when the same dashboard is exported twice', async () => {
        const resp1 = await supertest
          .post('/api/saved_objects/_export_clean')
          .set('osd-xsrf', 'true')
          .send({
            objects: [{ type: 'dashboard', id: dashId }],
          })
          .expect(200);

        const resp2 = await supertest
          .post('/api/saved_objects/_export_clean')
          .set('osd-xsrf', 'true')
          .send({
            objects: [{ type: 'dashboard', id: dashId }],
          })
          .expect(200);

        // The two exports should be byte-for-byte identical
        expect(JSON.stringify(resp1.body)).to.eql(JSON.stringify(resp2.body));
      });
    });

    describe('filtering', () => {
      it('should export by type and filter correctly', async () => {
        const resp = await supertest
          .post('/api/saved_objects/_export_clean')
          .set('osd-xsrf', 'true')
          .send({
            types: ['dashboard'],
          })
          .expect(200);

        expect(resp.body).to.have.property('objects');
        expect(resp.body.objects).to.be.an('array');

        // All returned objects should be of type dashboard
        for (const obj of resp.body.objects) {
          expect(obj.type).to.be('dashboard');
        }

        // Our test dashboard should be in the results
        const found = resp.body.objects.find((obj: any) => obj.id === dashId);
        expect(found).to.not.be(undefined);
      });

      it('should export specific objects by type and id', async () => {
        const resp = await supertest
          .post('/api/saved_objects/_export_clean')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              { type: 'dashboard', id: dashId },
              { type: 'visualization', id: visId },
            ],
          })
          .expect(200);

        expect(resp.body).to.have.property('objects');
        expect(resp.body.objects).to.be.an('array');

        const exportedIds = resp.body.objects.map((obj: any) => obj.id);
        expect(exportedIds).to.contain(dashId);
        expect(exportedIds).to.contain(visId);
      });
    });

    describe('clean structure', () => {
      it('should output clean JSON structure, not NDJSON', async () => {
        const resp = await supertest
          .post('/api/saved_objects/_export_clean')
          .set('osd-xsrf', 'true')
          .send({
            objects: [{ type: 'dashboard', id: dashId }],
          })
          .expect(200);

        // The response should be parsed as a single JSON object, not lines
        expect(resp.body).to.be.an('object');
        expect(resp.body).to.not.be.an('string');

        // Should have a top-level structure
        expect(resp.body).to.have.property('objects');

        // Each object should have the standard saved object fields
        if (resp.body.objects.length > 0) {
          const obj = resp.body.objects[0];
          expect(obj).to.have.property('type');
          expect(obj).to.have.property('id');
          expect(obj).to.have.property('attributes');
        }
      });
    });
  });
}
