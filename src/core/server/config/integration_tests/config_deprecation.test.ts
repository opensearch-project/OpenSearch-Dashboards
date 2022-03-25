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

import { mockLoggingSystem } from './config_deprecation.test.mocks';
import { loggingSystemMock } from '../../logging/logging_system.mock';
import * as osdTestServer from '../../../test_helpers/osd_server';

describe('configuration deprecations', () => {
  let root: ReturnType<typeof osdTestServer.createRoot>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (root) {
      await root.shutdown();
    }
  });

  it('should not log deprecation warnings for default configuration', async () => {
    root = osdTestServer.createRoot();

    await root.setup();

    const logs = loggingSystemMock.collect(mockLoggingSystem);
    expect(logs.warn.flat()).toMatchInlineSnapshot(`Array []`);
  });

  it('should log deprecation warnings for core deprecations', async () => {
    root = osdTestServer.createRoot({
      optimize: {
        lazy: true,
        lazyPort: 9090,
      },
    });

    await root.setup();

    const logs = loggingSystemMock.collect(mockLoggingSystem);
    expect(logs.warn.flat()).toMatchInlineSnapshot(`
      Array [
        "optimize.lazy is deprecated and is no longer used",
        "optimize.lazyPort is deprecated and is no longer used",
      ]
    `);
  });
});
