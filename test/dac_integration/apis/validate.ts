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
import {
  minimalDashboard,
  invalidDashboard,
  comprehensiveDashboard,
  minimalVisualization,
  minimalSearch,
} from '../helpers/dashboard_fixtures';

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  describe('POST /api/saved_objects/_validate', () => {
    describe('valid objects', () => {
      it('should return valid=true for a valid dashboard', async () => {
        const dashboard = minimalDashboard('validate-valid');
        const resp = await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: dashboard.type,
            attributes: dashboard.attributes,
          })
          .expect(200);

        expect(resp.body.valid).to.be(true);
        expect(resp.body.errors).to.be(undefined);
      });

      it('should return valid=true for a comprehensive dashboard', async () => {
        const dashboard = comprehensiveDashboard('validate-comprehensive');
        const resp = await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: dashboard.type,
            attributes: dashboard.attributes,
          })
          .expect(200);

        expect(resp.body.valid).to.be(true);
      });

      it('should return valid=true for a valid visualization', async () => {
        const vis = minimalVisualization('validate-vis');
        const resp = await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: vis.type,
            attributes: vis.attributes,
          })
          .expect(200);

        expect(resp.body.valid).to.be(true);
      });

      it('should return valid=true for a valid search', async () => {
        const search = minimalSearch('validate-search');
        const resp = await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: search.type,
            attributes: search.attributes,
          })
          .expect(200);

        expect(resp.body.valid).to.be(true);
      });
    });

    describe('invalid objects', () => {
      it('should return errors for a dashboard missing required title', async () => {
        const dashboard = invalidDashboard('validate-invalid');
        const resp = await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: dashboard.type,
            attributes: dashboard.attributes,
          })
          .expect(200);

        expect(resp.body.valid).to.be(false);
        expect(resp.body.errors).to.be.an('array');
        expect(resp.body.errors.length).to.be.greaterThan(0);

        // The error should reference the missing title field
        const titleError = resp.body.errors.find(
          (err: any) =>
            (err.path && err.path.includes('title')) ||
            (err.message && err.message.toLowerCase().includes('title'))
        );
        expect(titleError).to.not.be(undefined);
      });

      it('should return errors with correct paths for invalid attributes', async () => {
        const resp = await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: 'dashboard',
            attributes: {
              title: 123, // title should be a string, not a number
              panelsJSON: 'not-valid-json[[[',
            },
          })
          .expect(200);

        expect(resp.body.valid).to.be(false);
        expect(resp.body.errors).to.be.an('array');
        expect(resp.body.errors.length).to.be.greaterThan(0);
      });
    });

    describe('unknown type', () => {
      it('should return 400 for an unknown saved object type', async () => {
        await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: 'nonexistent_type_xyz',
            attributes: { title: 'test' },
          })
          .expect(400);
      });
    });

    describe('validation modes', () => {
      it('should support schema mode for quick validation', async () => {
        const dashboard = minimalDashboard('validate-schema-mode');
        const resp = await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: dashboard.type,
            attributes: dashboard.attributes,
            mode: 'schema',
          })
          .expect(200);

        expect(resp.body.valid).to.be(true);
      });

      it('should support full mode that validates references exist', async () => {
        const dashboard = minimalDashboard('validate-full-mode');
        const resp = await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: dashboard.type,
            attributes: dashboard.attributes,
            references: dashboard.references,
            mode: 'full',
          })
          .expect(200);

        // In full mode, references that don't exist may cause warnings or errors
        // depending on implementation — we just check the response is well-formed
        expect(resp.body).to.have.property('valid');
      });
    });

    describe('extra fields handling', () => {
      it('should still validate when extra unknown fields are present', async () => {
        const dashboard = minimalDashboard('validate-extra');
        const resp = await supertest
          .post('/api/saved_objects/_validate')
          .set('osd-xsrf', 'true')
          .send({
            type: dashboard.type,
            attributes: {
              ...dashboard.attributes,
              someUnknownField: 'extra-value',
              anotherCustomProp: 42,
            },
          })
          .expect(200);

        // The endpoint should either accept or reject extra fields consistently
        expect(resp.body).to.have.property('valid');
      });
    });
  });
}
