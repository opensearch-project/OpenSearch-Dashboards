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
import fs from 'fs';
import { mkdir } from 'fs/promises';

import sinon from 'sinon';
import del from 'del';

import { existingInstall, assertVersion } from './opensearch_dashboards';
import { Logger } from '../lib/logger';
import { PROCESS_WORKING_DIR } from '@osd/cross-platform';

jest.spyOn(fs, 'statSync');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('opensearchDashboards cli', function () {
  describe('plugin installer', function () {
    describe('OpenSearch Dashboards', function () {
      const testWorkingPath = join(__dirname, '.test.data.opensearch_dashboards');
      const tempArchiveFilePath = join(testWorkingPath, 'archive.part');
      const pluginDir = join(__dirname, 'plugins');

      const settings = {
        workingPath: testWorkingPath,
        tempArchiveFile: tempArchiveFilePath,
        plugin: 'test-plugin',
        version: '1.0.0',
        plugins: [{ id: 'foo' }],
        pluginDir,
      };

      const logger = new Logger(settings);

      describe('assertVersion', function () {
        beforeEach(async () => {
          await del(testWorkingPath, { cwd: PROCESS_WORKING_DIR });
          await mkdir(testWorkingPath, { recursive: true });
          sinon.stub(logger, 'log');
          sinon.stub(logger, 'error');
        });

        afterEach(async () => {
          logger.log.restore();
          logger.error.restore();
          await del(testWorkingPath, { cwd: PROCESS_WORKING_DIR });
        });

        it('should succeed with exact match', function () {
          const settings = {
            workingPath: testWorkingPath,
            tempArchiveFile: tempArchiveFilePath,
            plugin: 'test-plugin',
            version: '5.0.0-SNAPSHOT',
            plugins: [
              {
                id: 'foo',
                opensearchDashboardsVersion: '5.0.0-SNAPSHOT',
              },
            ],
          };

          expect(() => assertVersion(settings)).not.toThrow();
        });

        it('should throw an error if plugin is missing a opensearch-dashboards version.', function () {
          expect(() => assertVersion(settings)).toThrowErrorMatchingInlineSnapshot(
            `"Plugin opensearch_dashboards.json is missing both a version property (required) and a opensearchDashboardsVersion property (optional)."`
          );
        });

        it('should throw an error if plugin opensearchDashboardsVersion does not match opensearch-dashboards version', function () {
          settings.plugins[0].opensearchDashboardsVersion = '1.2.3.4';

          expect(() => assertVersion(settings)).toThrowErrorMatchingInlineSnapshot(
            `"Plugin foo [1.2.3] is incompatible with OpenSearch Dashboards [1.0.0]"`
          );
        });

        it('should not throw an error if plugin opensearchDashboardsVersion matches opensearch-dashboards version', function () {
          settings.plugins[0].opensearchDashboardsVersion = '1.0.0';

          expect(() => assertVersion(settings)).not.toThrow();
        });

        it('should ignore version info after the dash in checks on valid version', function () {
          settings.plugins[0].opensearchDashboardsVersion = '1.0.0-foo-bar-version-1.2.3';

          expect(() => assertVersion(settings)).not.toThrow();
        });

        it('should ignore version info after the dash in checks on invalid version', function () {
          settings.plugins[0].opensearchDashboardsVersion = '2.0.0-foo-bar-version-1.2.3';

          expect(() => assertVersion(settings)).toThrowErrorMatchingInlineSnapshot(
            `"Plugin foo [2.0.0] is incompatible with OpenSearch Dashboards [1.0.0]"`
          );
        });
      });

      describe('existingInstall', function () {
        let processExitStub;

        beforeEach(function () {
          processExitStub = sinon.stub(process, 'exit');
          sinon.stub(logger, 'log');
          sinon.stub(logger, 'error');
        });

        afterEach(function () {
          processExitStub.restore();
          logger.log.restore();
          logger.error.restore();
        });

        it('should throw an error if the plugin already exists.', function () {
          fs.statSync.mockImplementationOnce(() => true);
          existingInstall(settings, logger);
          expect(logger.error.firstCall.args[0]).toMatch(/already exists/);
          expect(process.exit.called).toBe(true);
        });

        it('should not throw an error if the plugin does not exist.', function () {
          fs.statSync.mockImplementationOnce(() => {
            throw { code: 'ENOENT' };
          });
          existingInstall(settings, logger);
          expect(logger.error.called).toBe(false);
        });
      });
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
