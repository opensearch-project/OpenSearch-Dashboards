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

import * as osdTestServer from '../../../../core/test_helpers/osd_server';

let root;
beforeAll(async () => {
  root = osdTestServer.createRoot({
    migrations: { skip: true },
    plugins: { initialize: false },
  });

  await root.setup();
  await root.start();
}, 30000);

afterAll(async () => await root.shutdown());

describe('legacy http handler trailing-slash redirect', () => {
  test('redirects a trailing-slash path to the version without the slash', async () => {
    await osdTestServer.request
      .get(root, '/some/path/')
      .expect(301)
      .expect('location', '/some/path');
  });

  test('does not redirect protocol-relative paths starting with `//` (open redirect)', async () => {
    const response = await osdTestServer.request.get(root, '///attacker.com/aa/');
    expect(response.status).toBe(404);
    expect(response.headers.location).toBeUndefined();
  });

  test('does not redirect paths starting with `/\\` (backslash protocol-relative)', async () => {
    const response = await osdTestServer.request.get(root, '/\\attacker.com/aa/');
    expect(response.status).toBe(404);
    expect(response.headers.location).toBeUndefined();
  });

  test('does not redirect paths with many leading slashes', async () => {
    const response = await osdTestServer.request.get(root, '/////attacker.com/');
    expect(response.status).toBe(404);
    expect(response.headers.location).toBeUndefined();
  });
});
