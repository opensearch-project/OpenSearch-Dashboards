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

import fs from 'fs';
import semver from 'semver';
import { engines } from '../../package.json';
import { promisify } from 'util';
const readFile = promisify(fs.readFile);
import expect from '@osd/expect';

/*
 * The build-time and runtime versions of Node.js are deliberately decoupled:
 *
 *   `.nvmrc`         major version used to *build* (CI, `actions/setup-node`, local dev)
 *   `.node-version`  exact version of the Node.js binary *bundled into the distributable*,
 *                    i.e. what actually runs OpenSearch Dashboards for end users
 *
 * They are allowed to differ, but both must fall within `engines.node`, because
 * `src/setup_node_env/node_version_validator.js` enforces that range at startup
 * against whichever runtime is in use.
 */
describe('Node versions must be within the supported range', () => {
  it('should have a .nvmrc that satisfies engines.node from package.json', async () => {
    const nvmrc = (await readFile('./.nvmrc', { encoding: 'utf-8' })).trim();

    // `.nvmrc` holds a bare major (e.g. `18`), which is not a complete semver version
    const coerced = semver.coerce(nvmrc);
    expect(coerced === null).to.be(false);
    expect(semver.satisfies(coerced!.version, engines.node)).to.be(true);
  });

  it('should have a .node-version that satisfies engines.node from package.json', async () => {
    const nodeVersion = (await readFile('./.node-version', { encoding: 'utf-8' })).trim();

    expect(semver.valid(nodeVersion) === null).to.be(false);
    expect(semver.satisfies(nodeVersion, engines.node)).to.be(true);
  });

  it('should not bundle a runtime older than the version used to build', async () => {
    const [nodeVersion, nvmrc] = await Promise.all([
      readFile('./.node-version', { encoding: 'utf-8' }),
      readFile('./.nvmrc', { encoding: 'utf-8' }),
    ]);

    // Transpiled output targets the build-time Node.js; running it on an older
    // runtime is not safe, while running it on a newer one is.
    expect(semver.major(nodeVersion.trim()) >= Number(nvmrc.trim())).to.be(true);
  });
});
