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

import { mockReadFilePromise } from './plugin_manifest_parser.test.mocks';

import { PluginDiscoveryErrorType } from './plugin_discovery_error';
import { loggingSystemMock } from '../../logging/logging_system.mock';

import { resolve } from 'path';
import { parseManifest } from './plugin_manifest_parser';

const logger = loggingSystemMock.createLogger();
const pluginPath = resolve('path', 'existent-dir');
const pluginManifestPath = resolve(pluginPath, 'opensearch_dashboards.json');
const packageInfo = {
  branch: 'main',
  buildNum: 1,
  buildSha: '',
  version: '7.0.0-alpha1',
  dist: false,
};

afterEach(() => {
  jest.clearAllMocks();
});

test('return error when manifest is empty', async () => {
  mockReadFilePromise.mockResolvedValue(Buffer.from(''));

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Unexpected end of JSON input (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

test('return error when manifest content is null', async () => {
  mockReadFilePromise.mockResolvedValue(Buffer.from('null'));

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Plugin manifest must contain a JSON encoded object. (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

test('return error when manifest content is not a valid JSON', async () => {
  mockReadFilePromise.mockResolvedValue(Buffer.from('not-json'));

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Unexpected token o in JSON at position 1 (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

test('return error when plugin id is missing', async () => {
  mockReadFilePromise.mockResolvedValue(Buffer.from(JSON.stringify({ version: 'some-version' })));

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Plugin manifest must contain an "id" property. (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

test('return error when plugin id includes `.` characters', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'some.name', version: 'some-version' }))
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Plugin "id" must not include \`.\` characters. (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

test('logs warning if pluginId is not in camelCase format', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'some_name', version: 'opensearchDashboards', server: true }))
  );

  expect(loggingSystemMock.collect(logger).warn).toHaveLength(0);
  await parseManifest(pluginPath, packageInfo, logger);
  expect(loggingSystemMock.collect(logger).warn).toMatchInlineSnapshot(`
    Array [
      Array [
        "Expect plugin \\"id\\" in camelCase, but found: some_name",
      ],
    ]
  `);
});

test('does not log pluginId format warning in dist mode', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'some_name', version: 'opensearchDashboards', server: true }))
  );

  expect(loggingSystemMock.collect(logger).warn).toHaveLength(0);
  await parseManifest(pluginPath, { ...packageInfo, dist: true }, logger);
  expect(loggingSystemMock.collect(logger).warn.length).toBe(0);
});

test('return error when plugin version is missing', async () => {
  mockReadFilePromise.mockResolvedValue(Buffer.from(JSON.stringify({ id: 'someId' })));

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Plugin manifest for "someId" must contain a "version" property. (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

test('return error when plugin expected OpenSearch Dashboards version is lower than actual version', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'someId', version: '6.4.2' }))
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Plugin "someId" is only compatible with OpenSearch Dashboards version "6.4.2", but used OpenSearch Dashboards version is "7.0.0-alpha1". (incompatible-version, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.IncompatibleVersion,
    path: pluginManifestPath,
  });
});

test('return error when plugin expected OpenSearch Dashboards version cannot be interpreted as semver', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(
      JSON.stringify({
        id: 'someId',
        version: '1.0.0',
        opensearchDashboardsVersion: 'non-sem-ver',
      })
    )
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Plugin "someId" is only compatible with OpenSearch Dashboards version "non-sem-ver", but used OpenSearch Dashboards version is "7.0.0-alpha1". (incompatible-version, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.IncompatibleVersion,
    path: pluginManifestPath,
  });
});

test('return error when plugin config path is not a string', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'someId', version: '7.0.0', configPath: 2 }))
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `The "configPath" in plugin manifest for "someId" should either be a string or an array of strings. (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

test('return error when plugin config path is an array that contains non-string values', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'someId', version: '7.0.0', configPath: ['config', 2] }))
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `The "configPath" in plugin manifest for "someId" should either be a string or an array of strings. (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

test('return error when plugin expected OpenSearch Dashboards version is higher than actual version', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'someId', version: '7.0.1' }))
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Plugin "someId" is only compatible with OpenSearch Dashboards version "7.0.1", but used OpenSearch Dashboards version is "7.0.0-alpha1". (incompatible-version, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.IncompatibleVersion,
    path: pluginManifestPath,
  });
});

test('return error when both `server` and `ui` are set to `false` or missing', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'someId', version: '7.0.0' }))
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Both "server" and "ui" are missing or set to "false" in plugin manifest for "someId", but at least one of these must be set to "true". (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });

  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'someId', version: '7.0.0', server: false, ui: false }))
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Both "server" and "ui" are missing or set to "false" in plugin manifest for "someId", but at least one of these must be set to "true". (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

test('return error when manifest contains unrecognized properties', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(
      JSON.stringify({
        id: 'someId',
        version: '7.0.0',
        server: true,
        unknownOne: 'one',
        unknownTwo: true,
      })
    )
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
    message: `Manifest for plugin "someId" contains the following unrecognized properties: unknownOne,unknownTwo. (invalid-manifest, ${pluginManifestPath})`,
    type: PluginDiscoveryErrorType.InvalidManifest,
    path: pluginManifestPath,
  });
});

describe('requiredEnginePlugins', () => {
  test('return error when plugin `requiredEnginePlugins` is a string and not an object', async () => {
    mockReadFilePromise.mockResolvedValue(
      Buffer.from(
        JSON.stringify({
          id: 'invalid-manifest-plugin',
          version: '7.0.0',
          server: true,
          requiredEnginePlugins: 'abc',
        })
      )
    );

    await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
      message: `The "requiredEnginePlugins" in plugin manifest for "invalid-manifest-plugin" should be an object that maps a plugin name to a version range. (invalid-manifest, ${pluginManifestPath})`,
      type: PluginDiscoveryErrorType.InvalidManifest,
      path: pluginManifestPath,
    });
  });

  test('return error when plugin `requiredEnginePlugins` is an array and not an object', async () => {
    mockReadFilePromise.mockResolvedValue(
      Buffer.from(
        JSON.stringify({
          id: 'invalid-manifest-plugin',
          version: '7.0.0',
          server: true,
          requiredEnginePlugins: [{ 'plugin-1': '1.0.0.0', 'plugin-2': '^2.0.1' }],
        })
      )
    );

    await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
      message: `The "requiredEnginePlugins" in plugin manifest for "invalid-manifest-plugin" should be an object that maps a plugin name to a version range. (invalid-manifest, ${pluginManifestPath})`,
      type: PluginDiscoveryErrorType.InvalidManifest,
      path: pluginManifestPath,
    });
  });

  test('return error when plugin requiredEnginePlugins is an object but contains non-string version value', async () => {
    mockReadFilePromise.mockResolvedValue(
      Buffer.from(
        JSON.stringify({
          id: 'test-invalid-version-type-plugin',
          version: '7.0.0',
          requiredEnginePlugins: { 'invalid-plugin-version-range': 2 },
        })
      )
    );

    await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
      message: `The "requiredEnginePlugins" in plugin manifest for "test-invalid-version-type-plugin" should be an object that maps a plugin name to a version range. (invalid-manifest, ${pluginManifestPath})`,
      type: PluginDiscoveryErrorType.InvalidManifest,
      path: pluginManifestPath,
    });
  });

  test('return error when plugin requiredEnginePlugins contains invalid version range', async () => {
    mockReadFilePromise.mockResolvedValue(
      Buffer.from(
        JSON.stringify({
          id: 'test-invalid-version-range-plugin',
          version: '7.0.0',
          requiredEnginePlugins: {
            'invalid-version-range-plugin': '?1.0.0',
            'valid-version-range-plugin': '^1.0.0',
          },
        })
      )
    );

    await expect(parseManifest(pluginPath, packageInfo, logger)).rejects.toMatchObject({
      message: `The "requiredEnginePlugins" in the plugin manifest for "test-invalid-version-range-plugin" contains invalid version ranges: ?1.0.0 for invalid-version-range-plugin (invalid-manifest, ${pluginManifestPath})`,
      type: PluginDiscoveryErrorType.InvalidManifest,
      path: pluginManifestPath,
    });
  });

  test('Happy path when plugin `requiredEnginePlugins` is a map of plugin name to its compatible version ranges', async () => {
    mockReadFilePromise.mockResolvedValue(
      Buffer.from(
        JSON.stringify({
          id: 'test-plugin-version-range-sanity',
          version: '7.0.0',
          server: true,
          requiredEnginePlugins: {
            'valid-plugin-1': '^1.0.0',
            'valid-plugin-2': '1.0.0',
          },
        })
      )
    );

    await expect(parseManifest(pluginPath, packageInfo, logger)).resolves.toEqual({
      id: 'test-plugin-version-range-sanity',
      configPath: 'test_plugin_version_range_sanity',
      version: '7.0.0',
      opensearchDashboardsVersion: '7.0.0',
      optionalPlugins: [],
      requiredPlugins: [],
      requiredEnginePlugins: {
        'valid-plugin-1': '^1.0.0',
        'valid-plugin-2': '1.0.0',
      },
      requiredBundles: [],
      server: true,
      ui: false,
    });
  });
});

describe('configPath', () => {
  test('falls back to plugin id if not specified', async () => {
    mockReadFilePromise.mockResolvedValue(
      Buffer.from(JSON.stringify({ id: 'plugin', version: '7.0.0', server: true }))
    );

    const manifest = await parseManifest(pluginPath, packageInfo, logger);
    expect(manifest.configPath).toBe(manifest.id);
  });

  test('falls back to plugin id in snakeCase format', async () => {
    mockReadFilePromise.mockResolvedValue(
      Buffer.from(JSON.stringify({ id: 'SomeId', version: '7.0.0', server: true }))
    );

    const manifest = await parseManifest(pluginPath, packageInfo, logger);
    expect(manifest.configPath).toBe('some_id');
  });

  test('not formated to snakeCase if defined explicitly as string', async () => {
    mockReadFilePromise.mockResolvedValue(
      Buffer.from(
        JSON.stringify({ id: 'someId', configPath: 'somePath', version: '7.0.0', server: true })
      )
    );

    const manifest = await parseManifest(pluginPath, packageInfo, logger);
    expect(manifest.configPath).toBe('somePath');
  });

  test('not formated to snakeCase if defined explicitly as an array of strings', async () => {
    mockReadFilePromise.mockResolvedValue(
      Buffer.from(
        JSON.stringify({ id: 'someId', configPath: ['somePath'], version: '7.0.0', server: true })
      )
    );

    const manifest = await parseManifest(pluginPath, packageInfo, logger);
    expect(manifest.configPath).toEqual(['somePath']);
  });
});

test('set defaults for all missing optional fields', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(JSON.stringify({ id: 'someId', version: '7.0.0', server: true }))
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).resolves.toEqual({
    id: 'someId',
    configPath: 'some_id',
    version: '7.0.0',
    opensearchDashboardsVersion: '7.0.0',
    optionalPlugins: [],
    requiredPlugins: [],
    requiredEnginePlugins: {},
    requiredBundles: [],
    server: true,
    ui: false,
  });
});

test('return all set optional fields as they are in manifest', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(
      JSON.stringify({
        id: 'someId',
        configPath: ['some', 'path'],
        version: 'some-version',
        opensearchDashboardsVersion: '7.0.0',
        requiredPlugins: ['some-required-plugin', 'some-required-plugin-2'],
        optionalPlugins: ['some-optional-plugin'],
        requiredEnginePlugins: {
          'test-opensearch-plugin-1': '^1.0.0',
          'test-opensearch-plugin-2': '>=1.0.0',
        },
        ui: true,
      })
    )
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).resolves.toEqual({
    id: 'someId',
    configPath: ['some', 'path'],
    version: 'some-version',
    opensearchDashboardsVersion: '7.0.0',
    optionalPlugins: ['some-optional-plugin'],
    requiredBundles: [],
    requiredPlugins: ['some-required-plugin', 'some-required-plugin-2'],
    requiredEnginePlugins: {
      'test-opensearch-plugin-1': '^1.0.0',
      'test-opensearch-plugin-2': '>=1.0.0',
    },
    server: false,
    ui: true,
  });
});

test('return manifest when plugin expected OpenSearch Dashboards version matches actual version', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(
      JSON.stringify({
        id: 'someId',
        configPath: 'some-path',
        version: 'some-version',
        opensearchDashboardsVersion: '7.0.0-alpha2',
        requiredPlugins: ['some-required-plugin'],
        requiredEnginePlugins: {},
        server: true,
      })
    )
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).resolves.toEqual({
    id: 'someId',
    configPath: 'some-path',
    version: 'some-version',
    opensearchDashboardsVersion: '7.0.0-alpha2',
    optionalPlugins: [],
    requiredPlugins: ['some-required-plugin'],
    requiredEnginePlugins: {},
    requiredBundles: [],
    server: true,
    ui: false,
  });
});

test('return manifest when plugin expected OpenSearch Dashboards version is `opensearchDashboards`', async () => {
  mockReadFilePromise.mockResolvedValue(
    Buffer.from(
      JSON.stringify({
        id: 'someId',
        version: 'some-version',
        opensearchDashboardsVersion: 'opensearchDashboards',
        requiredPlugins: ['some-required-plugin'],
        server: true,
        ui: true,
      })
    )
  );

  await expect(parseManifest(pluginPath, packageInfo, logger)).resolves.toEqual({
    id: 'someId',
    configPath: 'some_id',
    version: 'some-version',
    opensearchDashboardsVersion: 'opensearchDashboards',
    optionalPlugins: [],
    requiredPlugins: ['some-required-plugin'],
    requiredEnginePlugins: {},
    requiredBundles: [],
    server: true,
    ui: true,
  });
});
