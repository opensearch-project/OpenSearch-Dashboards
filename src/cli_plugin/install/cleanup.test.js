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

import fs from 'fs/promises';
import { rmSync } from 'fs';

jest.mock('fs');
jest.mock('fs/promises');

import { cleanPrevious, cleanArtifacts } from './cleanup';
import { Logger } from '../lib/logger';

describe('opensearchDashboards cli', function () {
  describe('plugin installer', function () {
    describe('pluginCleaner', function () {
      const settings = {
        workingPath: 'dummy',
      };
      const logger = new Logger(settings);

      describe('cleanPrevious', function () {
        afterEach(function () {
          jest.resetAllMocks();
        });

        it('should resolve if the working path does not exist', async () => {
          fs.access.mockImplementation(() => {
            const notFoundError = new Error('ENOENT');
            notFoundError.code = 'ENOENT';
            throw notFoundError;
          });

          const exceptionCatcher = jest.fn();

          try {
            await cleanPrevious(settings, logger);
          } catch (e) {
            exceptionCatcher();
          }

          expect(fs.rm).not.toHaveBeenCalled();
          expect(exceptionCatcher).not.toHaveBeenCalled();
        });

        it('should rethrow any exceptions from accessing the folders except ENOENT', async () => {
          fs.access.mockImplementation(() => {
            const noAccessError = new Error('EACCES');
            noAccessError.code = 'EACCES';
            throw noAccessError;
          });

          const exceptionCatcher = jest.fn();

          try {
            await cleanPrevious(settings, logger);
          } catch (e) {
            exceptionCatcher();
          }

          expect(fs.rm).not.toHaveBeenCalled();
          expect(exceptionCatcher).toHaveBeenCalled();
        });

        it('should log a message if there was a working directory', async () => {
          jest.spyOn(logger, 'log');
          const exceptionCatcher = jest.fn();

          try {
            await cleanPrevious(settings, logger);
          } catch (e) {
            exceptionCatcher();
          }

          expect(logger.log).toHaveBeenCalledWith('Found previous install attempt. Deleting...');
          expect(fs.rm).toHaveBeenCalled();
          expect(exceptionCatcher).not.toHaveBeenCalled();
        });

        it('should rethrow any exception from deleting the folder', async () => {
          fs.rm.mockImplementation(() => {
            const dummyError = new Error('EDUMMY');
            dummyError.code = 'EDUMMY';
            throw dummyError;
          });

          const exceptionCatcher = jest.fn();

          try {
            await cleanPrevious(settings, logger);
          } catch (e) {
            exceptionCatcher();
          }

          expect(fs.rm).toHaveBeenCalled();
          expect(exceptionCatcher).toHaveBeenCalled();
        });

        it('should resolve if the working path is deleted', async () => {
          const exceptionCatcher = jest.fn();

          try {
            await cleanPrevious(settings, logger);
          } catch (e) {
            exceptionCatcher();
          }

          expect(fs.rm).toHaveBeenCalled();
          expect(exceptionCatcher).not.toHaveBeenCalled();
        });
      });

      describe('cleanArtifacts', function () {
        afterEach(function () {
          jest.resetAllMocks();
        });

        it('should attempt to delete the working directory', () => {
          cleanArtifacts(settings);

          expect(rmSync).toHaveBeenCalledWith(settings.workingPath, expect.anything());
        });

        it('should swallow any errors thrown by del.sync', () => {
          rmSync.mockImplementation(() => {
            const dummyError = new Error('EDUMMY');
            dummyError.code = 'EDUMMY';
            throw dummyError;
          });

          expect(() => cleanArtifacts(settings)).not.toThrow();
        });
      });
    });
  });
});
