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

export function docExistsSuite() {
  async function setup(options: any = {}) {
    const { initialSettings } = options;

    const { osdServer, uiSettings, callCluster } = getServices();

    // delete the opensearch-dashboards index to ensure we start fresh
    await callCluster('deleteByQuery', {
      index: osdServer.config.get('opensearchDashboards.index'),
      body: {
        conflicts: 'proceed',
        query: { match_all: {} },
      },
    });

    if (initialSettings) {
      await uiSettings.setMany(initialSettings);
    }

    return { osdServer, uiSettings };
  }

  describe('get route', () => {
    it('returns a 200 and includes userValues', async () => {
      const defaultIndex = chance.word({ length: 10 });
      const { osdServer } = await setup({
        initialSettings: {
          defaultIndex,
        },
      });

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

  describe('set route', () => {
    it('returns a 200 and all values including update', async () => {
      const { osdServer } = await setup();

      const defaultIndex = chance.word();
      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings/defaultIndex',
        payload: {
          value: defaultIndex,
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

    it('returns a 400 if trying to set overridden value', async () => {
      const { osdServer } = await setup();

      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings/foo',
        payload: {
          value: 'baz',
        },
      });

      expect(statusCode).toBe(400);
      expect(result).toEqual({
        error: 'Bad Request',
        message: 'Unable to update "foo" because it is overridden',
        statusCode: 400,
      });
    });
  });

  describe('setMany route', () => {
    it('returns a 200 and all values including updates', async () => {
      const { osdServer } = await setup();

      const defaultIndex = chance.word();
      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings',
        payload: {
          changes: {
            defaultIndex,
          },
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

    it('returns a 400 if trying to set overridden value', async () => {
      const { osdServer } = await setup();

      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings',
        payload: {
          changes: {
            foo: 'baz',
          },
        },
      });

      expect(statusCode).toBe(400);
      expect(result).toEqual({
        error: 'Bad Request',
        message: 'Unable to update "foo" because it is overridden',
        statusCode: 400,
      });
    });
  });

  describe('delete route', () => {
    it('returns a 200 and deletes the setting', async () => {
      const defaultIndex = chance.word({ length: 10 });

      const { osdServer, uiSettings } = await setup({
        initialSettings: { defaultIndex },
      });

      expect(await uiSettings.get('defaultIndex')).toBe(defaultIndex);

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
    it('returns a 400 if deleting overridden value', async () => {
      const { osdServer } = await setup();

      const { statusCode, result } = await osdServer.inject({
        method: 'DELETE',
        url: '/api/opensearch-dashboards/settings/foo',
      });

      expect(statusCode).toBe(400);
      expect(result).toEqual({
        error: 'Bad Request',
        message: 'Unable to update "foo" because it is overridden',
        statusCode: 400,
      });
    });
  });
}
