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

const assertStatsAndMetrics = (body) => {
  expect(typeof body.opensearchDashboards.name).toBe('string');
  expect(typeof body.opensearchDashboards.uuid).toBe('string');
  expect(typeof body.opensearchDashboards.host).toBe('string');
  expect(typeof body.opensearchDashboards.transport_address).toBe('string');
  expect(typeof body.opensearchDashboards.version).toBe('string');
  expect(typeof body.opensearchDashboards.snapshot).toBe('boolean');
  expect(typeof body.opensearchDashboards.status).toBe('green');

  expect(typeof body.process.memory.heap.total_bytes).toBe('number');
  expect(typeof body.process.memory.heap.used_bytes).toBe('number');
  expect(typeof body.process.memory.heap.size_limit).toBe('number');
  expect(typeof body.process.memory.resident_set_size_bytes).toBe('number');
  expect(typeof body.process.pid).toBe('number');
  expect(typeof body.process.uptime_ms).toBe('number');
  expect(typeof body.process.event_loop_delay).toBe('number');

  expect(typeof body.os.memory.free_bytes).toBe('number');
  expect(typeof body.os.memory.total_bytes).toBe('number');
  expect(typeof body.os.uptime_ms).toBe('number');

  expect(typeof body.os.load['1m']).toBe('number');
  expect(typeof body.os.load['5m']).toBe('number');
  expect(typeof body.os.load['15m']).toBe('number');

  expect(typeof body.response_times.avg_ms).not.toBe(null); // ok if is undefined
  expect(typeof body.response_times.max_ms).not.toBe(null); // ok if is undefined

  expect(typeof body.requests.total).toBe('number');
  expect(typeof body.requests.disconnects).toBe('number');

  expect(typeof body.concurrent_connections).toBe('number');
};

export default function ({ getService }) {
  const supertest = getService('supertest');
  const opensearchArchiver = getService('opensearchArchiver');

  describe('opensearch-dashboards stats api', () => {
    before('make sure there are some saved objects', () =>
      opensearchArchiver.load('saved_objects/basic')
    );
    after('cleanup saved objects changes', () => opensearchArchiver.unload('saved_objects/basic'));

    describe('basic', () => {
      it('should return the stats without cluster_uuid with no query string params', () => {
        return supertest
          .get('/api/stats')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(({ body }) => {
            expect(body.cluster_uuid).toBe(undefined);
            assertStatsAndMetrics(body);
          });
      });
      it(`should return the stats without cluster_uuid with 'extended' query string param = false`, () => {
        return supertest
          .get('/api/stats?extended=false')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(({ body }) => {
            expect(body.cluster_uuid).toBe(undefined);
            assertStatsAndMetrics(body);
          });
      });
    });

    // TODO load an opensearch archive and verify the counts in saved object usage info
    describe('extended', () => {
      it(`should return the stats, cluster_uuid, and usage with 'extended' query string param present`, () => {
        return supertest
          .get('/api/stats?extended')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(({ body }) => {
            expect(typeof body.cluster_uuid).toBe('string');
            expect(typeof body.usage).toBe('object'); // no usage collectors have been registered so usage is an empty object
            assertStatsAndMetrics(body);
          });
      });

      it(`should return the stats, cluster_uuid, and usage with 'extended' query string param = true`, () => {
        return supertest
          .get('/api/stats?extended=true')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(({ body }) => {
            expect(typeof body.cluster_uuid).toBe('string');
            expect(typeof body.usage).toBe('object');
            assertStatsAndMetrics(body);
          });
      });

      describe('legacy', () => {
        it(`should return return the 'extended' data in the old format with 'legacy' query string param present`, () => {
          return supertest
            .get('/api/stats?extended&legacy')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(({ body }) => {
              expect(typeof body.clusterUuid).toBe('string');
              expect(typeof body.usage).toBe('object'); // no usage collectors have been registered so usage is an empty object
              assertStatsAndMetrics(body, true);
            });
        });
      });

      describe('exclude usage', () => {
        it('should include an empty usage object from the API response', () => {
          return supertest
            .get('/api/stats?extended&exclude_usage')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(({ body }) => {
              expect(body).toHaveProperty('usage');
              expect(body.usage).toEqual({});
            });
        });

        it('should include an empty usage object from the API response if `legacy` is provided', () => {
          return supertest
            .get('/api/stats?extended&exclude_usage&legacy')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(({ body }) => {
              expect(body).toHaveProperty('usage');
              expect(body.usage).toEqual({});
            });
        });
      });
    });
  });
}
