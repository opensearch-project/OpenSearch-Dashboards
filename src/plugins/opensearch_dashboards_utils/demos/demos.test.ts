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

import { result as counterResult } from './state_containers/counter';
import { result as todomvcResult } from './state_containers/todomvc';

describe('demos', () => {
  describe('state containers', () => {
    test('counter demo works', () => {
      expect(counterResult).toBe(10);
    });

    test('TodoMVC demo works', () => {
      expect(todomvcResult).toEqual([
        { id: 0, text: 'Learning state containers', completed: true },
        { id: 1, text: 'Learning transitions...', completed: true },
      ]);
    });
  });

  describe('state sync', () => {
    test('url sync demo works', async () => {
      // The url.ts demo module must be loaded inside the test body so it runs
      // after Jest's jsdom environment is fully initialised. A static top-level
      // import executes during module evaluation (before any test setup), which
      // in jsdom 26 means window.history.pushState updates may not be reflected
      // in window.location.href by the time the demo's result promise resolves.
      // jest.isolateModules() gives us a fresh module registry scoped to this
      // callback, so the demo re-executes in a clean state right here.
      let urlSyncResult!: Promise<string>;
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        urlSyncResult = require('./state_sync/url').result;
      });
      expect(await urlSyncResult).toMatchInlineSnapshot(
        `"http://localhost:5601/#?_s=(todos:!((completed:!f,id:0,text:'Learning%20state%20containers'),(completed:!f,id:2,text:test)))"`
      );
    });
  });
});
