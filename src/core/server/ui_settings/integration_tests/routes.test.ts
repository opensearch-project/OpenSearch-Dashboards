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

import { schema } from '@osd/config-schema';
import * as osdTestServer from '../../../test_helpers/osd_server';

describe('ui settings service', () => {
  describe('routes', () => {
    let root: ReturnType<typeof osdTestServer.createRoot>;
    beforeAll(async () => {
      root = osdTestServer.createRoot({ plugins: { initialize: false } });

      const { uiSettings } = await root.setup();
      uiSettings.register({
        custom: {
          value: '42',
          schema: schema.string(),
        },
      });

      await root.start();
    }, 30000);
    afterAll(async () => await root.shutdown());

    describe('set', () => {
      it('validates value', async () => {
        const response = await osdTestServer.request
          .post(root, '/api/opensearch-dashboards/settings/custom')
          .send({ value: 100 })
          .expect(400);

        expect(response.body.message).toBe(
          '[validation [custom]]: expected value of type [string] but got [number]'
        );
      });
    });
    describe('set many', () => {
      it('validates value', async () => {
        const response = await osdTestServer.request
          .post(root, '/api/opensearch-dashboards/settings')
          .send({ changes: { custom: 100, foo: 'bar' } })
          .expect(400);

        expect(response.body.message).toBe(
          '[validation [custom]]: expected value of type [string] but got [number]'
        );
      });
    });
  });
});
