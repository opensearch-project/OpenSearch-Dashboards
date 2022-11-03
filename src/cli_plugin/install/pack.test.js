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

import { join } from 'path';
import { mkdir } from 'fs/promises';

import sinon from 'sinon';
import glob from 'glob-all';
import del from 'del';

import { Logger } from '../lib/logger';
import { extract, getPackData } from './pack';
import { _downloadSingle } from './download';
import { PROCESS_WORKING_DIR } from '@osd/cross-platform';

describe('opensearchDashboards cli', function () {
  describe('pack', function () {
    let testNum = 0;
    const workingPathRoot = join(__dirname, '.test.data.pack');
    let testWorkingPath;
    let tempArchiveFilePath;
    let testPluginPath;
    let logger;
    let settings;

    beforeEach(async () => {
      //These tests are dependent on the file system, and I had some inconsistent
      //behavior with del.sync show up. Until these tests are re-written to not
      //depend on the file system, I make sure that each test uses a different
      //working directory.
      testNum += 1;
      testWorkingPath = join(workingPathRoot, testNum + '');
      tempArchiveFilePath = join(testWorkingPath, 'archive.part');
      testPluginPath = join(testWorkingPath, '.installedPlugins');

      settings = {
        workingPath: testWorkingPath,
        tempArchiveFile: tempArchiveFilePath,
        pluginDir: testPluginPath,
        plugin: 'test-plugin',
      };

      logger = new Logger(settings);
      sinon.stub(logger, 'log');
      sinon.stub(logger, 'error');
      await mkdir(testWorkingPath, { recursive: true });
    });

    afterEach(async () => {
      logger.log.restore();
      logger.error.restore();

      await del(workingPathRoot, { cwd: PROCESS_WORKING_DIR });
    });

    function copyReplyFile(filename) {
      const filePath = join(__dirname, '__fixtures__', 'replies', filename);
      const sourceUrl = 'file://' + filePath.replace(/\\/g, '/');

      return _downloadSingle(settings, logger, sourceUrl);
    }

    describe('extract', function () {
      // Also only extracts the content from the opensearch-dashboards folder.
      // Ignores the others.
      it('successfully extract a valid zip', async () => {
        await copyReplyFile('test_plugin.zip');
        await getPackData(settings, logger);
        await extract(settings, logger);

        expect(glob.sync('**/*', { cwd: testWorkingPath })).toMatchInlineSnapshot(`
          Array [
            "archive.part",
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

    describe('getPackData', () => {
      it('populate settings.plugins', async () => {
        await copyReplyFile('test_plugin.zip');
        await getPackData(settings, logger);
        expect(settings.plugins).toMatchInlineSnapshot(`
          Array [
            Object {
              "id": "testPlugin",
              "opensearchDashboardsVersion": "1.0.0",
              "stripPrefix": "opensearch-dashboards/test-plugin",
            },
          ]
        `);
      });

      it('populate settings.plugin.opensearchDashboardsVersion', async () => {
        await copyReplyFile('test_plugin_different_version.zip');
        await getPackData(settings, logger);
        expect(settings.plugins).toMatchInlineSnapshot(`
          Array [
            Object {
              "id": "testPlugin",
              "opensearchDashboardsVersion": "5.0.1",
              "stripPrefix": "opensearch-dashboards/test-plugin",
            },
          ]
        `);
      });

      it('populate settings.plugins with multiple plugins', async () => {
        await copyReplyFile('test_plugin_many.zip');
        await getPackData(settings, logger);
        expect(settings.plugins).toMatchInlineSnapshot(`
          Array [
            Object {
              "id": "fungerPlugin",
              "opensearchDashboardsVersion": "1.0.0",
              "stripPrefix": "opensearch-dashboards/funger-plugin",
            },
            Object {
              "id": "pdf",
              "opensearchDashboardsVersion": "1.0.0",
              "stripPrefix": "opensearch-dashboards/pdf",
            },
            Object {
              "id": "testPlugin",
              "opensearchDashboardsVersion": "1.0.0",
              "stripPrefix": "opensearch-dashboards/test-plugin",
            },
          ]
        `);
      });

      it('throw an error if there is no opensearch-dashboards plugin', async () => {
        await copyReplyFile('test_plugin_no_opensearch_dashboards.zip');
        await expect(getPackData(settings, logger)).rejects.toThrowErrorMatchingInlineSnapshot(
          `"No opensearch-dashboards plugins found in archive"`
        );
      });

      it('throw an error with a corrupt zip', async () => {
        await copyReplyFile('corrupt.zip');
        await expect(getPackData(settings, logger)).rejects.toThrowErrorMatchingInlineSnapshot(
          `"Error retrieving metadata from plugin archive"`
        );
      });

      it('throw an error if there an invalid plugin name', async () => {
        await copyReplyFile('invalid_name.zip');
        await expect(getPackData(settings, logger)).rejects.toThrowErrorMatchingInlineSnapshot(
          `"Invalid plugin name [invalid name] in opensearch_dashboards.json, expected it to be valid camelCase"`
        );
      });
    });
  });
});
