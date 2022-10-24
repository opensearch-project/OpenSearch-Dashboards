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

import path from 'path';
import os from 'os';

import del from 'del';
import glob from 'glob';

import { analyzeArchive, extractArchive } from './zip';

describe('opensearchDashboards cli', function () {
  describe('zip', function () {
    const repliesPath = path.resolve(__dirname, '__fixtures__', 'replies');
    const archivePath = path.resolve(repliesPath, 'test_plugin.zip');

    let tempPath;

    beforeEach(() => {
      const randomDir = Math.random().toString(36);
      tempPath = path.resolve(os.tmpdir(), randomDir);
    });

    afterEach(async () => {
      await del(tempPath, { force: true });
    });

    describe('analyzeArchive', function () {
      it('returns array of plugins', async () => {
        const packages = await analyzeArchive(archivePath);
        expect(packages).toMatchInlineSnapshot(`
          Array [
            Object {
              "id": "testPlugin",
              "opensearchDashboardsVersion": "1.0.0",
              "stripPrefix": "opensearch-dashboards/test-plugin",
            },
          ]
        `);
      });
    });

    describe('extractArchive', () => {
      it('extracts files using the extractPath filter', async () => {
        const archive = path.resolve(repliesPath, 'test_plugin.zip');
        await extractArchive(archive, tempPath, 'opensearch-dashboards/test-plugin');

        expect(glob.sync('**/*', { cwd: tempPath })).toMatchInlineSnapshot(`
          Array [
            "bin",
            "bin/executable",
            "bin/not-executable",
            "node_modules",
            "node_modules/some-package",
            "node_modules/some-package/index.js",
            "node_modules/some-package/package.json",
            "opensearch_dashboards.json",
            "public",
            "public/index.js",
          ]
        `);
      });
    });

    it('handles a corrupt zip archive', async () => {
      await expect(
        extractArchive(path.resolve(repliesPath, 'corrupt.zip'))
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"end of central directory record signature not found"`
      );
    });
  });
});
