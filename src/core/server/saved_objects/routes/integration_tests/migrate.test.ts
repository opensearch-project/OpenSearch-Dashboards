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

import { migratorInstanceMock } from './migrate.test.mocks';
import * as osdTestServer from '../../../../test_helpers/osd_server';

describe('SavedObjects /_migrate endpoint', () => {
  let root: ReturnType<typeof osdTestServer.createRoot>;

  beforeEach(async () => {
    root = osdTestServer.createRoot({ migrations: { skip: true }, plugins: { initialize: false } });
    await root.setup();
    await root.start();
    migratorInstanceMock.runMigrations.mockClear();
  }, 30000);

  afterEach(async () => {
    await root.shutdown();
  });

  it('calls runMigrations on the migrator with rerun=true when accessed', async () => {
    await osdTestServer.request.post(root, '/internal/saved_objects/_migrate').send({}).expect(200);

    expect(migratorInstanceMock.runMigrations).toHaveBeenCalledTimes(1);
    expect(migratorInstanceMock.runMigrations).toHaveBeenCalledWith({ rerun: true });
  });

  it('calls runMigrations multiple time when multiple access', async () => {
    await osdTestServer.request.post(root, '/internal/saved_objects/_migrate').send({}).expect(200);

    expect(migratorInstanceMock.runMigrations).toHaveBeenCalledTimes(1);

    await osdTestServer.request.post(root, '/internal/saved_objects/_migrate').send({}).expect(200);

    expect(migratorInstanceMock.runMigrations).toHaveBeenCalledTimes(2);
  });
});
