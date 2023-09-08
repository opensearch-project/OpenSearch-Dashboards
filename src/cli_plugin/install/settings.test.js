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

import { createAbsolutePathSerializer } from '@osd/dev-utils';

import { fromRoot } from '../../core/server/utils';
import { parseMilliseconds, parse } from './settings';

const SECOND = 1000;
const MINUTE = SECOND * 60;

const ORIGINAL_PLATFORM = process.platform;
const ORIGINAL_ARCHITECTURE = process.arch;

expect.addSnapshotSerializer(createAbsolutePathSerializer());

describe('parseMilliseconds function', function () {
  it.each([
    ['', 0],
    ['1gigablasts', 0],
    [1, 1],
    ['1', 1],
    ['5s', 5 * SECOND],
    ['5second', 5 * SECOND],
    ['5seconds', 5 * SECOND],
    ['9m', 9 * MINUTE],
    ['9minute', 9 * MINUTE],
    ['9minutes', 9 * MINUTE],
  ])('should parse %j to %j', (input, result) => {
    expect(parseMilliseconds(input)).toBe(result);
  });
});

describe('parse function', function () {
  const command = 'plugin name';
  const defaultOptions = { pluginDir: fromRoot('plugins') };
  const osdPackage = { version: 1234 };

  afterAll(() => {
    Object.defineProperties(process, {
      platform: {
        value: ORIGINAL_PLATFORM,
      },
      arch: {
        value: ORIGINAL_ARCHITECTURE,
      },
    });
  });

  it('produces expected defaults', function () {
    Object.defineProperties(process, {
      platform: {
        value: 'linux',
      },
      arch: {
        value: 'x64',
      },
    });
    expect(parse(command, { ...defaultOptions }, osdPackage)).toMatchInlineSnapshot(`
      Object {
        "config": "",
        "plugin": "plugin name",
        "pluginDir": <absolute path>/plugins,
        "quiet": false,
        "silent": false,
        "tempArchiveFile": <absolute path>/plugins/.plugin.installing/archive.part,
        "timeout": 0,
        "urls": Array [
          "plugin name",
          "https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/1234/latest/linux/x64/tar/builds/opensearch-dashboards/plugins/plugin name-1234.zip",
        ],
        "version": 1234,
        "workingPath": <absolute path>/plugins/.plugin.installing,
      }
    `);
  });

  it('consumes overrides', function () {
    Object.defineProperties(process, {
      platform: {
        value: 'linux',
      },
      arch: {
        value: 'x64',
      },
    });
    const options = {
      quiet: true,
      silent: true,
      config: 'foo bar baz',
      ...defaultOptions,
    };

    expect(parse(command, options, osdPackage)).toMatchInlineSnapshot(`
      Object {
        "config": "foo bar baz",
        "plugin": "plugin name",
        "pluginDir": <absolute path>/plugins,
        "quiet": true,
        "silent": true,
        "tempArchiveFile": <absolute path>/plugins/.plugin.installing/archive.part,
        "timeout": 0,
        "urls": Array [
          "plugin name",
          "https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/1234/latest/linux/x64/tar/builds/opensearch-dashboards/plugins/plugin name-1234.zip",
        ],
        "version": 1234,
        "workingPath": <absolute path>/plugins/.plugin.installing,
      }
    `);
  });

  it('produces expected results on Windows', function () {
    Object.defineProperties(process, {
      platform: {
        value: 'win32',
      },
      arch: {
        value: 'x64',
      },
    });
    expect(parse(command, { ...defaultOptions }, osdPackage)).toMatchInlineSnapshot(`
      Object {
        "config": "",
        "plugin": "plugin name",
        "pluginDir": <absolute path>/plugins,
        "quiet": false,
        "silent": false,
        "tempArchiveFile": <absolute path>/plugins/.plugin.installing/archive.part,
        "timeout": 0,
        "urls": Array [
          "plugin name",
          "https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/1234/latest/windows/x64/zip/builds/opensearch-dashboards/plugins/plugin name-1234.zip",
        ],
        "version": 1234,
        "workingPath": <absolute path>/plugins/.plugin.installing,
      }
    `);
  });

  it('should not throw when on a non-x64 arch', function () {
    Object.defineProperties(process, {
      platform: {
        value: 'linux',
      },
      arch: {
        value: 'arm64',
      },
    });
    expect(parse(command, { ...defaultOptions }, osdPackage)).toMatchInlineSnapshot(`
      Object {
        "config": "",
        "plugin": "plugin name",
        "pluginDir": <absolute path>/plugins,
        "quiet": false,
        "silent": false,
        "tempArchiveFile": <absolute path>/plugins/.plugin.installing/archive.part,
        "timeout": 0,
        "urls": Array [
          "plugin name",
          "https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/1234/latest/linux/arm64/tar/builds/opensearch-dashboards/plugins/plugin name-1234.zip",
        ],
        "version": 1234,
        "workingPath": <absolute path>/plugins/.plugin.installing,
      }
    `);
  });
});
