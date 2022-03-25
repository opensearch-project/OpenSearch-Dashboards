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

import expect from '@osd/expect';

export default function ({ getService }) {
  const supertest = getService('supertest');
  const opensearch = getService('legacyOpenSearch');
  const opensearchArchiver = getService('opensearchArchiver');

  describe('get', () => {
    describe('with opensearch-dashboards index', () => {
      before(() => opensearchArchiver.load('saved_objects/basic'));
      after(() => opensearchArchiver.unload('saved_objects/basic'));

      it('should return 200', async () =>
        await supertest
          .get(`/api/saved_objects/visualization/dd7caf20-9efd-11e7-acb3-3dab96693fab`)
          .expect(200)
          .then((resp) => {
            expect(resp.body).to.eql({
              id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
              type: 'visualization',
              updated_at: '2017-09-21T18:51:23.794Z',
              version: resp.body.version,
              migrationVersion: resp.body.migrationVersion,
              attributes: {
                title: 'Count of requests',
                description: '',
                version: 1,
                // cheat for some of the more complex attributes
                visState: resp.body.attributes.visState,
                uiStateJSON: resp.body.attributes.uiStateJSON,
                kibanaSavedObjectMeta: resp.body.attributes.kibanaSavedObjectMeta,
              },
              references: [
                {
                  type: 'index-pattern',
                  name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
                  id: '91200a00-9efd-11e7-acb3-3dab96693fab',
                },
              ],
              namespaces: ['default'],
            });
            expect(resp.body.migrationVersion).to.be.ok();
          }));

      describe('doc does not exist', () => {
        it('should return same generic error as when index does not exist', async () =>
          await supertest
            .get(`/api/saved_objects/visualization/foobar`)
            .expect(404)
            .then((resp) => {
              expect(resp.body).to.eql({
                error: 'Not Found',
                message: 'Saved object [visualization/foobar] not found',
                statusCode: 404,
              });
            }));
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

      it('should return basic 404 without mentioning index', async () =>
        await supertest
          .get('/api/saved_objects/visualization/dd7caf20-9efd-11e7-acb3-3dab96693fab')
          .expect(404)
          .then((resp) => {
            expect(resp.body).to.eql({
              error: 'Not Found',
              message:
                'Saved object [visualization/dd7caf20-9efd-11e7-acb3-3dab96693fab] not found',
              statusCode: 404,
            });
          }));
    });
  });
}
