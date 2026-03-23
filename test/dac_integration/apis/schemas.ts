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

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  describe('GET /api/saved_objects/_schemas', () => {
    describe('list all schemas', () => {
      it('should return a list of available schemas', async () => {
        const resp = await supertest
          .get('/api/saved_objects/_schemas')
          .set('osd-xsrf', 'true')
          .expect(200);

        expect(resp.body).to.be.an('object');
        expect(resp.body).to.have.property('schemas');
        expect(resp.body.schemas).to.be.an('array');
        expect(resp.body.schemas.length).to.be.greaterThan(0);

        // Each schema entry should have at least a type and version
        for (const schema of resp.body.schemas) {
          expect(schema).to.have.property('type');
          expect(schema.type).to.be.a('string');
          expect(schema.type.length).to.be.greaterThan(0);
        }

        // Dashboard schema should be in the list
        const dashboardSchema = resp.body.schemas.find((s: any) => s.type === 'dashboard');
        expect(dashboardSchema).to.not.be(undefined);
      });

      it('should include common saved object types', async () => {
        const resp = await supertest
          .get('/api/saved_objects/_schemas')
          .set('osd-xsrf', 'true')
          .expect(200);

        const types = resp.body.schemas.map((s: any) => s.type);

        // These are core types that should always be present
        expect(types).to.contain('dashboard');
        expect(types).to.contain('visualization');
        expect(types).to.contain('search');
      });
    });

    describe('get specific schema', () => {
      it('should return the dashboard schema for /api/saved_objects/_schemas/dashboard/v1', async () => {
        const resp = await supertest
          .get('/api/saved_objects/_schemas/dashboard/v1')
          .set('osd-xsrf', 'true')
          .expect(200);

        expect(resp.body).to.be.an('object');

        // It should be a valid JSON Schema
        expect(resp.body).to.have.property('type');

        // If it follows JSON Schema conventions, check for common markers
        if (resp.body.$schema) {
          expect(resp.body.$schema).to.contain('json-schema');
        }

        // The schema should describe dashboard attributes
        if (resp.body.properties) {
          expect(resp.body.properties).to.be.an('object');
          // Title is a fundamental dashboard attribute
          expect(resp.body.properties).to.have.property('title');
        }
      });

      it('should return a valid JSON Schema structure', async () => {
        const resp = await supertest
          .get('/api/saved_objects/_schemas/dashboard/v1')
          .set('osd-xsrf', 'true')
          .expect(200);

        const schema = resp.body;

        // A JSON Schema must be an object
        expect(schema).to.be.an('object');

        // Verify it has schema-like properties (type, properties, or $ref)
        const hasSchemaIndicators =
          schema.type !== undefined ||
          schema.properties !== undefined ||
          schema.$ref !== undefined ||
          schema.allOf !== undefined ||
          schema.oneOf !== undefined ||
          schema.anyOf !== undefined;

        expect(hasSchemaIndicators).to.be(true);
      });

      it('should return 404 for an unknown type', async () => {
        await supertest
          .get('/api/saved_objects/_schemas/nonexistent_type_xyz/v1')
          .set('osd-xsrf', 'true')
          .expect(404);
      });
    });
  });
}
