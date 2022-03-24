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

import { getServices, chance } from './lib';

export function docMissingSuite() {
  // ensure the opensearch-dashboards index has no documents
  beforeEach(async () => {
    const { osdServer, callCluster } = getServices();

    // write a setting to ensure opensearch-dashboards index is created
    await osdServer.inject({
      method: 'POST',
      url: '/api/opensearch-dashboards/settings/defaultIndex',
      payload: { value: 'abc' },
    });

    // delete all docs from opensearch-dashboards index to ensure savedConfig is not found
    await callCluster('deleteByQuery', {
      index: osdServer.config.get('opensearchDashboards.index'),
      body: {
        query: { match_all: {} },
      },
    });
  });

  describe('get route', () => {
    it('creates doc, returns a 200 with settings', async () => {
      const { osdServer } = getServices();

      const { statusCode, result } = await osdServer.inject({
        method: 'GET',
        url: '/api/opensearch-dashboards/settings',
      });

      expect(statusCode).toBe(200);
      expect(result).toMatchObject({
        settings: {
          buildNum: {
            userValue: expect.any(Number),
          },
          foo: {
            userValue: 'bar',
            isOverridden: true,
          },
        },
      });
    });
  });

  describe('set route', () => {
    it('creates doc, returns a 200 with value set', async () => {
      const { osdServer } = getServices();

      const defaultIndex = chance.word();
      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings/defaultIndex',
        payload: { value: defaultIndex },
      });

      expect(statusCode).toBe(200);
      expect(result).toMatchObject({
        settings: {
          buildNum: {
            userValue: expect.any(Number),
          },
          defaultIndex: {
            userValue: defaultIndex,
          },
          foo: {
            userValue: 'bar',
            isOverridden: true,
          },
        },
      });
    });
  });

  describe('setMany route', () => {
    it('creates doc, returns 200 with updated values', async () => {
      const { osdServer } = getServices();

      const defaultIndex = chance.word();
      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings',
        payload: {
          changes: { defaultIndex },
        },
      });

      expect(statusCode).toBe(200);
      expect(result).toMatchObject({
        settings: {
          buildNum: {
            userValue: expect.any(Number),
          },
          defaultIndex: {
            userValue: defaultIndex,
          },
          foo: {
            userValue: 'bar',
            isOverridden: true,
          },
        },
      });
    });
  });

  describe('delete route', () => {
    it('creates doc, returns a 200 with just buildNum', async () => {
      const { osdServer } = getServices();

      const { statusCode, result } = await osdServer.inject({
        method: 'DELETE',
        url: '/api/opensearch-dashboards/settings/defaultIndex',
      });

      expect(statusCode).toBe(200);
      expect(result).toMatchObject({
        settings: {
          buildNum: {
            userValue: expect.any(Number),
          },
          foo: {
            userValue: 'bar',
            isOverridden: true,
          },
        },
      });
    });
  });
}
