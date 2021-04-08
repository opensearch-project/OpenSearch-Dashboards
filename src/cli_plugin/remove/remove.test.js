/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

import sinon from 'sinon';
import glob from 'glob-all';
import del from 'del';

import { Logger } from '../lib/logger';
import { remove } from './remove';

describe('opensearchDashboards cli', function () {
  describe('plugin remover', function () {
    const pluginDir = join(__dirname, '.test.data.remove');
    let processExitStub;
    let logger;

    const settings = { pluginDir };

    beforeEach(function () {
      processExitStub = sinon.stub(process, 'exit');
      logger = new Logger(settings);
      sinon.stub(logger, 'log');
      sinon.stub(logger, 'error');
      del.sync(pluginDir);
      mkdirSync(pluginDir, { recursive: true });
    });

    afterEach(function () {
      processExitStub.restore();
      logger.log.restore();
      logger.error.restore();
      del.sync(pluginDir);
    });

    it('throw an error if the plugin is not installed.', function () {
      settings.pluginPath = join(pluginDir, 'foo');
      settings.plugin = 'foo';

      remove(settings, logger);
      expect(logger.error.firstCall.args[0]).toMatch(/not installed/);
      expect(process.exit.called).toBe(true);
    });

    it('throw an error if the specified plugin is not a folder.', function () {
      writeFileSync(join(pluginDir, 'foo'), 'This is a file, and not a folder.');

      remove(settings, logger);
      expect(logger.error.firstCall.args[0]).toMatch(/not a plugin/);
      expect(process.exit.called).toBe(true);
    });

    it('delete the specified folder.', function () {
      settings.pluginPath = join(pluginDir, 'foo');
      mkdirSync(join(pluginDir, 'foo'), { recursive: true });
      mkdirSync(join(pluginDir, 'bar'), { recursive: true });

      remove(settings, logger);

      const files = glob.sync('**/*', { cwd: pluginDir });
      const expected = ['bar'];
      expect(files.sort()).toEqual(expected.sort());
    });
  });
});
