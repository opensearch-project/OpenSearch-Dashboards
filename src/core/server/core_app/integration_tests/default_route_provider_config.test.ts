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

import * as osdTestServer from '../../../test_helpers/osd_server';
import { Root } from '../../root';

let opensearchServer: osdTestServer.TestOpenSearchUtils;

describe('default route provider', () => {
  let root: Root;

  beforeAll(async () => {
    const { startOpenSearch } = osdTestServer.createTestServers({
      adjustTimeout: (t: number) => jest.setTimeout(t),
    });
    opensearchServer = await startOpenSearch();
    root = osdTestServer.createRootWithCorePlugins({
      server: {
        basePath: '/hello',
      },
    });

    await root.setup();
    await root.start();
  });

  afterAll(async () => {
    await osdTestServer.request
      .post(root, '/api/opensearch-dashboards/settings/defaultRoute')
      .send({ value: '/app/home' });
    await opensearchServer.stop();
    await root.shutdown();
  });

  // TODO: [RENAMEME] Temporary code for backwards compatibility.
  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/334
  beforeEach(async () => {
    await osdTestServer.request
      .post(root, '/api/opensearch-dashboards/settings/defaultRoute')
      .send({ value: '/app/home' })
      .expect(200);
  });

  it('redirects to the configured default route respecting basePath', async function () {
    const { status, header } = await osdTestServer.request.get(root, '/');

    expect(status).toEqual(302);
    expect(header).toMatchObject({
      location: '/hello/app/home',
    });
  });

  it('ignores invalid values', async function () {
    const invalidRoutes = [
      'http://not-your-opensearch-dashboards.com',
      '///example.com',
      '//example.com',
      ' //example.com',
    ];

    for (const url of invalidRoutes) {
      await osdTestServer.request
        .post(root, '/api/opensearch-dashboards/settings/defaultRoute')
        .send({ value: url })
        .expect(400);
    }

    const { status, header } = await osdTestServer.request.get(root, '/');
    expect(status).toEqual(302);
    expect(header).toMatchObject({
      location: '/hello/app/home',
    });
  });

  it('consumes valid values', async function () {
    await osdTestServer.request
      .post(root, '/api/opensearch-dashboards/settings/defaultRoute')
      .send({ value: '/valid' })
      .expect(200);

    const { status, header } = await osdTestServer.request.get(root, '/');
    expect(status).toEqual(302);
    expect(header).toMatchObject({
      location: '/hello/valid',
    });
  });

  // TODO: [RENAMEME] Temporary code for backwards compatibility.
  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/334
  it('replaces kibana_overview', async function () {
    await osdTestServer.request
      .post(root, '/api/opensearch-dashboards/settings/defaultRoute')
      .send({ value: '/kibana_overview' })
      .expect(200);

    const { status, header } = await osdTestServer.request.get(root, '/');
    expect(status).toEqual(302);
    expect(header).toMatchObject({
      location: '/hello/opensearch_dashboards_overview',
    });
  });

  it('replaces kibana_overview#', async function () {
    await osdTestServer.request
      .post(root, '/api/opensearch-dashboards/settings/defaultRoute')
      .send({ value: '/kibana_overview#' })
      .expect(200);

    const { status, header } = await osdTestServer.request.get(root, '/');
    expect(status).toEqual(302);
    expect(header).toMatchObject({
      location: '/hello/opensearch_dashboards_overview#',
    });
  });

  it('does not replace kibana', async function () {
    await osdTestServer.request
      .post(root, '/api/opensearch-dashboards/settings/defaultRoute')
      .send({ value: '/kibana' })
      .expect(200);

    const { status, header } = await osdTestServer.request.get(root, '/');
    expect(status).toEqual(302);
    expect(header).toMatchObject({
      location: '/hello/kibana',
    });
  });
});
