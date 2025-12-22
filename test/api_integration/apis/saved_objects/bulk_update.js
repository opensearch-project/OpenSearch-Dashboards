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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { jestExpect as expect } from '@jest/expect';
import _ from 'lodash';

export default function ({ getService }) {
  const supertest = getService('supertest');
  const opensearch = getService('legacyOpenSearch');
  const opensearchArchiver = getService('opensearchArchiver');

  describe('bulkUpdate', () => {
    describe('with opensearch-dashboards index', () => {
      before(() => opensearchArchiver.load('saved_objects/basic'));
      after(() => opensearchArchiver.unload('saved_objects/basic'));
      it('should return 200', async () => {
        const response = await supertest
          .put(`/api/saved_objects/_bulk_update`)
          .send([
            {
              type: 'visualization',
              id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
              attributes: {
                title: 'An existing visualization',
              },
            },
            {
              type: 'dashboard',
              id: 'be3733a0-9efe-11e7-acb3-3dab96693fab',
              attributes: {
                title: 'An existing dashboard',
              },
            },
          ])
          .expect(200);

        const {
          saved_objects: [firstObject, secondObject],
        } = response.body;

        // loose ISO8601 UTC time with milliseconds validation
        expect(firstObject)
          .toHaveProperty('updated_at')
          .match(/^[\d-]{10}T[\d:\.]{12}Z$/);
        expect(_.omit(firstObject, ['updated_at'])).toEqual({
          id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
          type: 'visualization',
          version: 'WzgsMV0=',
          attributes: {
            title: 'An existing visualization',
          },
          namespaces: ['default'],
        });

        expect(secondObject)
          .toHaveProperty('updated_at')
          .match(/^[\d-]{10}T[\d:\.]{12}Z$/);
        expect(_.omit(secondObject, ['updated_at'])).toEqual({
          id: 'be3733a0-9efe-11e7-acb3-3dab96693fab',
          type: 'dashboard',
          version: 'WzksMV0=',
          attributes: {
            title: 'An existing dashboard',
          },
          namespaces: ['default'],
        });
      });

      it('does not pass references if omitted', async () => {
        const {
          body: {
            saved_objects: [visObject, dashObject],
          },
        } = await supertest.post(`/api/saved_objects/_bulk_get`).send([
          {
            type: 'visualization',
            id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
          },
          {
            type: 'dashboard',
            id: 'be3733a0-9efe-11e7-acb3-3dab96693fab',
          },
        ]);

        const response = await supertest
          .put(`/api/saved_objects/_bulk_update`)
          .send([
            {
              type: 'visualization',
              id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
              attributes: {
                title: 'Changed title but nothing else',
              },
              version: visObject.version,
            },
            {
              type: 'dashboard',
              id: 'be3733a0-9efe-11e7-acb3-3dab96693fab',
              attributes: {
                title: 'Changed title and references',
              },
              version: dashObject.version,
              references: [{ id: 'foo', name: 'Foo', type: 'visualization' }],
            },
          ])
          .expect(200);

        const {
          saved_objects: [firstUpdatedObject, secondUpdatedObject],
        } = response.body;
        expect(firstUpdatedObject).not.toHaveProperty('error');
        expect(secondUpdatedObject).not.toHaveProperty('error');

        const {
          body: {
            saved_objects: [visObjectAfterUpdate, dashObjectAfterUpdate],
          },
        } = await supertest.post(`/api/saved_objects/_bulk_get`).send([
          {
            type: 'visualization',
            id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
          },
          {
            type: 'dashboard',
            id: 'be3733a0-9efe-11e7-acb3-3dab96693fab',
          },
        ]);

        expect(visObjectAfterUpdate.references).toEqual(visObject.references);
        expect(dashObjectAfterUpdate.references).toEqual([
          { id: 'foo', name: 'Foo', type: 'visualization' },
        ]);
      });

      it('passes empty references array if empty references array is provided', async () => {
        const {
          body: {
            saved_objects: [{ version }],
          },
        } = await supertest.post(`/api/saved_objects/_bulk_get`).send([
          {
            type: 'visualization',
            id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
          },
        ]);

        await supertest
          .put(`/api/saved_objects/_bulk_update`)
          .send([
            {
              type: 'visualization',
              id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
              attributes: {
                title: 'Changed title but nothing else',
              },
              version,
              references: [],
            },
          ])
          .expect(200);

        const {
          body: {
            saved_objects: [visObjectAfterUpdate],
          },
        } = await supertest.post(`/api/saved_objects/_bulk_get`).send([
          {
            type: 'visualization',
            id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
          },
        ]);

        expect(visObjectAfterUpdate.references).toEqual([]);
      });

      describe('unknown id', () => {
        it('should return a generic 404', async () => {
          const response = await supertest
            .put(`/api/saved_objects/_bulk_update`)
            .send([
              {
                type: 'visualization',
                id: 'not an id',
                attributes: {
                  title: 'An existing visualization',
                },
              },
              {
                type: 'dashboard',
                id: 'be3733a0-9efe-11e7-acb3-3dab96693fab',
                attributes: {
                  title: 'An existing dashboard',
                },
              },
            ])
            .expect(200);

          const {
            saved_objects: [missingObject, updatedObject],
          } = response.body;

          // loose ISO8601 UTC time with milliseconds validation
          expect(missingObject).eql({
            type: 'visualization',
            id: 'not an id',
            error: {
              statusCode: 404,
              error: 'Not Found',
              message: 'Saved object [visualization/not an id] not found',
            },
          });

          expect(updatedObject)
            .toHaveProperty('updated_at')
            .match(/^[\d-]{10}T[\d:\.]{12}Z$/);
          expect(_.omit(updatedObject, ['updated_at', 'version'])).toEqual({
            id: 'be3733a0-9efe-11e7-acb3-3dab96693fab',
            type: 'dashboard',
            attributes: {
              title: 'An existing dashboard',
            },
            namespaces: ['default'],
          });
        });
      });
    });

    describe('without opensearch-dashboards index', () => {
      before(
        async () =>
          // just in case the opensearch-dashboards server has recreated it
          await opensearch.indices.delete({
            index: '.kibana',
            ignore: [404],
          })
      );

      it('should return generic 404', async () => {
        const response = await supertest
          .put(`/api/saved_objects/_bulk_update`)
          .send([
            {
              type: 'visualization',
              id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
              attributes: {
                title: 'An existing visualization',
              },
            },
            {
              type: 'dashboard',
              id: 'be3733a0-9efe-11e7-acb3-3dab96693fab',
              attributes: {
                title: 'An existing dashboard',
              },
            },
          ])
          .expect(200);

        const {
          saved_objects: [firstObject, secondObject],
        } = response.body;

        expect(firstObject).toEqual({
          id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
          type: 'visualization',
          error: {
            statusCode: 404,
            error: 'Not Found',
            message: 'Saved object [visualization/dd7caf20-9efd-11e7-acb3-3dab96693fab] not found',
          },
        });

        expect(secondObject).toEqual({
          id: 'be3733a0-9efe-11e7-acb3-3dab96693fab',
          type: 'dashboard',
          error: {
            statusCode: 404,
            error: 'Not Found',
            message: 'Saved object [dashboard/be3733a0-9efe-11e7-acb3-3dab96693fab] not found',
          },
        });
      });
    });
  });
}
