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

import { SuperTest, Test } from 'supertest';
import expect from '@osd/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

const apiUrl = '/api/opensearch-dashboards/management/saved_objects/scroll/counts';
const defaultTypes = ['visualization', 'index-pattern', 'search', 'dashboard'];

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest') as SuperTest<Test>;
  const opensearchArchiver = getService('opensearchArchiver');

  describe('scroll_count', () => {
    before(async () => {
      await opensearchArchiver.load('management/saved_objects/scroll_count');
    });
    after(async () => {
      await opensearchArchiver.unload('management/saved_objects/scroll_count');
    });

    it('returns the count for each included types', async () => {
      const res = await supertest
        .post(apiUrl)
        .send({
          typesToInclude: defaultTypes,
        })
        .expect(200);

      expect(res.body).to.eql({
        dashboard: 2,
        'index-pattern': 1,
        search: 1,
        visualization: 2,
      });
    });

    it('only returns count for types to include', async () => {
      const res = await supertest
        .post(apiUrl)
        .send({
          typesToInclude: ['dashboard', 'search'],
        })
        .expect(200);

      expect(res.body).to.eql({
        dashboard: 2,
        search: 1,
      });
    });

    it('filters on title when `searchString` is provided', async () => {
      const res = await supertest
        .post(apiUrl)
        .send({
          typesToInclude: defaultTypes,
          searchString: 'Amazing',
        })
        .expect(200);

      expect(res.body).to.eql({
        dashboard: 1,
        visualization: 1,
        'index-pattern': 0,
        search: 0,
      });
    });

    it('includes all requested types even when none match the search', async () => {
      const res = await supertest
        .post(apiUrl)
        .send({
          typesToInclude: ['dashboard', 'search', 'visualization'],
          searchString: 'nothing-will-match',
        })
        .expect(200);

      expect(res.body).to.eql({
        dashboard: 0,
        visualization: 0,
        search: 0,
      });
    });
  });
}
