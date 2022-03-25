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

  const MILLISECOND_IN_WEEK = 1000 * 60 * 60 * 24 * 7;

  describe('sample data apis', () => {
    describe('list', () => {
      it('should return list of sample data sets with installed status', async () => {
        const resp = await supertest
          .get(`/api/sample_data`)
          .set('osd-xsrf', 'opensearch-dashboards')
          .expect(200);

        expect(resp.body).to.be.an('array');
        expect(resp.body.length).to.be.above(0);
        expect(resp.body[0].status).to.be('not_installed');
      });
    });

    describe('install', () => {
      it('should return 404 if id does not match any sample data sets', async () => {
        await supertest
          .post(`/api/sample_data/xxxx`)
          .set('osd-xsrf', 'opensearch-dashboards')
          .expect(404);
      });

      it('should return 200 if success', async () => {
        const resp = await supertest
          .post(`/api/sample_data/flights`)
          .set('osd-xsrf', 'opensearch-dashboards')
          .expect(200);

        expect(resp.body).to.eql({
          opensearchIndicesCreated: { opensearch_dashboards_sample_data_flights: 13059 },
          opensearchDashboardsSavedObjectsLoaded: 20,
        });
      });

      it('should load opensearch index containing sample data with dates relative to current time', async () => {
        const resp = await opensearch.search({
          index: 'opensearch_dashboards_sample_data_flights',
        });

        const doc = resp.hits.hits[0];
        const docMilliseconds = Date.parse(doc._source.timestamp);
        const nowMilliseconds = Date.now();
        const delta = Math.abs(nowMilliseconds - docMilliseconds);
        expect(delta).to.be.lessThan(MILLISECOND_IN_WEEK * 4);
      });

      describe('parameters', () => {
        it('should load opensearch index containing sample data with dates relative to now parameter', async () => {
          const nowString = `2000-01-01T00:00:00`;
          await supertest
            .post(`/api/sample_data/flights?now=${nowString}`)
            .set('osd-xsrf', 'opensearch-dashboards');

          const resp = await opensearch.search({
            index: 'opensearch_dashboards_sample_data_flights',
          });

          const doc = resp.hits.hits[0];
          const docMilliseconds = Date.parse(doc._source.timestamp);
          const nowMilliseconds = Date.parse(nowString);
          const delta = Math.abs(nowMilliseconds - docMilliseconds);
          expect(delta).to.be.lessThan(MILLISECOND_IN_WEEK * 4);
        });
      });
    });

    describe('uninstall', () => {
      it('should uninstall sample data', async () => {
        await supertest
          .delete(`/api/sample_data/flights`)
          .set('osd-xsrf', 'opensearch-dashboards')
          .expect(204);
      });

      it('should remove opensearch index containing sample data', async () => {
        const resp = await opensearch.indices.exists({
          index: 'opensearch_dashboards_sample_data_flights',
        });
        expect(resp).to.be(false);
      });
    });
  });
}
