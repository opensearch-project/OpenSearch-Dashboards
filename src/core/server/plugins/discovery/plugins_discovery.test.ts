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

// must be before mocks imports to avoid conflicting with `REPO_ROOT` accessor.
import { REPO_ROOT } from '@osd/dev-utils';
import { mockPackage } from './plugins_discovery.test.mocks';
import mockFs from 'mock-fs';
import { loggingSystemMock } from '../../logging/logging_system.mock';
import { getEnvOptions, rawConfigServiceMock } from '../../config/mocks';

import { first, map, toArray } from 'rxjs/operators';
import { resolve } from 'path';
import { ConfigService, Env } from '../../config';
import { PluginsConfig, PluginsConfigType, config } from '../plugins_config';
import type { InstanceInfo } from '../plugin_context';
import { discover } from './plugins_discovery';
import { CoreContext } from '../../core_context';
import { PROCESS_WORKING_DIR, standardize } from '@osd/cross-platform';

const Plugins = {
  invalid: () => ({
    'opensearch_dashboards.json': 'not-json',
  }),
  incomplete: () => ({
    'opensearch_dashboards.json': JSON.stringify({ version: '1' }),
  }),
  incompatible: () => ({
    'opensearch_dashboards.json': JSON.stringify({ id: 'plugin', version: '1' }),
  }),
  missingManifest: () => ({}),
  inaccessibleManifest: () => ({
    'opensearch_dashboards.json': mockFs.file({
      mode: 0, // 0000,
      content: JSON.stringify({ id: 'plugin', version: '1' }),
    }),
  }),
  valid: (id: string) => ({
    'opensearch_dashboards.json': JSON.stringify({
      id,
      configPath: ['plugins', id],
      version: '1',
      opensearchDashboardsVersion: '1.2.3',
      requiredPlugins: [],
      optionalPlugins: [],
      server: true,
    }),
  }),
};

const packageMock = {
  branch: 'main',
  version: '1.2.3',
  build: {
    distributable: true,
    number: 1,
    sha: '',
  },
};

const manifestPath = (...pluginPath: string[]) =>
  resolve(PROCESS_WORKING_DIR, 'src', 'plugins', ...pluginPath, 'opensearch_dashboards.json');

describe('plugins discovery system', () => {
  let logger: ReturnType<typeof loggingSystemMock.create>;
  let instanceInfo: InstanceInfo;
  let env: Env;
  let configService: ConfigService;
  let pluginConfig: PluginsConfigType;
  let coreContext: CoreContext;

  beforeEach(async () => {
    logger = loggingSystemMock.create();

    mockPackage.raw = packageMock;

    instanceInfo = {
      uuid: 'instance-uuid',
    };

    env = Env.createDefault(
      REPO_ROOT,
      getEnvOptions({
        cliArgs: { envName: 'development' },
      })
    );

    configService = new ConfigService(
      rawConfigServiceMock.create({ rawConfig: { plugins: { paths: [] } } }),
      env,
      logger
    );
    await configService.setSchema(config.path, config.schema);

    coreContext = {
      coreId: Symbol(),
      configService,
      env,
      logger,
    };

    pluginConfig = await configService
      .atPath<PluginsConfigType>('plugins')
      .pipe(first())
      .toPromise();

    // jest relies on the filesystem to get sourcemaps when using console.log
    // which breaks with the mocked FS, see https://github.com/tschaub/mock-fs/issues/234
    // hijacking logging to process.stdout as a workaround for this suite.
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      process.stdout.write(args + '\n');
    });
  });

  afterEach(() => {
    mockFs.restore();
    // restore the console.log behavior
    jest.restoreAllMocks();
  });

  it('discovers plugins in the search locations', async () => {
    const { plugin$ } = discover(new PluginsConfig(pluginConfig, env), coreContext, instanceInfo);

    mockFs(
      {
        [`${PROCESS_WORKING_DIR}/src/plugins/plugin_a`]: Plugins.valid('pluginA'),
        [`${PROCESS_WORKING_DIR}/plugins/plugin_b`]: Plugins.valid('pluginB'),
      },
      { createCwd: false }
    );

    const plugins = await plugin$.pipe(toArray()).toPromise();
    const pluginNames = plugins.map((plugin) => plugin.name);

    expect(pluginNames).toHaveLength(2);
    expect(pluginNames).toEqual(expect.arrayContaining(['pluginA', 'pluginB']));
  });

  it('return errors when the manifest is invalid or incompatible', async () => {
    const { plugin$, error$ } = discover(
      new PluginsConfig(pluginConfig, env),
      coreContext,
      instanceInfo
    );

    mockFs(
      {
        [`${PROCESS_WORKING_DIR}/src/plugins/plugin_a`]: Plugins.invalid(),
        [`${PROCESS_WORKING_DIR}/src/plugins/plugin_b`]: Plugins.incomplete(),
        [`${PROCESS_WORKING_DIR}/src/plugins/plugin_c`]: Plugins.incompatible(),
        [`${PROCESS_WORKING_DIR}/src/plugins/plugin_ad`]: Plugins.missingManifest(),
      },
      { createCwd: false }
    );

    const plugins = await plugin$.pipe(toArray()).toPromise();
    expect(plugins).toHaveLength(0);

    const errors = await error$
      .pipe(
        map((error) => error.toString()),
        toArray()
      )
      .toPromise();

    expect(errors).toEqual(
      expect.arrayContaining([
        `Error: Unexpected token o in JSON at position 1 (invalid-manifest, ${manifestPath(
          'plugin_a'
        )})`,
        `Error: Plugin manifest must contain an "id" property. (invalid-manifest, ${manifestPath(
          'plugin_b'
        )})`,
        `Error: Plugin "plugin" is only compatible with OpenSearch Dashboards version "1", but used OpenSearch Dashboards version is "1.2.3". (incompatible-version, ${manifestPath(
          'plugin_c'
        )})`,
      ])
    );
  });

  it('return errors when the plugin search path is not accessible', async () => {
    const { plugin$, error$ } = discover(
      new PluginsConfig(pluginConfig, env),
      coreContext,
      instanceInfo
    );

    mockFs(
      {
        [`${PROCESS_WORKING_DIR}/src/plugins`]: mockFs.directory({
          mode: 0, // 0000
          items: {
            plugin_a: Plugins.valid('pluginA'),
          },
        }),
      },
      { createCwd: false }
    );

    const plugins = await plugin$.pipe(toArray()).toPromise();
    expect(plugins).toHaveLength(0);

    const errors = await error$
      .pipe(
        map((error) => error.toString()),
        toArray()
      )
      .toPromise();

    const srcPluginsPath = resolve(PROCESS_WORKING_DIR, 'src', 'plugins');
    expect(errors).toEqual(
      expect.arrayContaining([
        `Error: EACCES, permission denied '${standardize(
          srcPluginsPath,
          false,
          false,
          true
        )}' (invalid-search-path, ${srcPluginsPath})`,
      ])
    );
  });

  it('return an error when the manifest file is not accessible', async () => {
    const { plugin$, error$ } = discover(
      new PluginsConfig(pluginConfig, env),
      coreContext,
      instanceInfo
    );

    mockFs(
      {
        [`${PROCESS_WORKING_DIR}/src/plugins/plugin_a`]: {
          ...Plugins.inaccessibleManifest(),
          nested_plugin: Plugins.valid('nestedPlugin'),
        },
      },
      { createCwd: false }
    );

    const plugins = await plugin$.pipe(toArray()).toPromise();
    expect(plugins).toHaveLength(0);

    const errors = await error$
      .pipe(
        map((error) => error.toString()),
        toArray()
      )
      .toPromise();

    const errorPath = manifestPath('plugin_a');
    expect(errors).toEqual(
      expect.arrayContaining([
        `Error: EACCES, permission denied '${standardize(
          errorPath,
          false,
          false,
          true
        )}' (missing-manifest, ${errorPath})`,
      ])
    );
  });

  it('discovers plugins in nested directories', async () => {
    const { plugin$, error$ } = discover(
      new PluginsConfig(pluginConfig, env),
      coreContext,
      instanceInfo
    );

    mockFs(
      {
        [`${PROCESS_WORKING_DIR}/src/plugins/plugin_a`]: Plugins.valid('pluginA'),
        [`${PROCESS_WORKING_DIR}/src/plugins/sub1/plugin_b`]: Plugins.valid('pluginB'),
        [`${PROCESS_WORKING_DIR}/src/plugins/sub1/sub2/plugin_c`]: Plugins.valid('pluginC'),
        [`${PROCESS_WORKING_DIR}/src/plugins/sub1/sub2/plugin_d`]: Plugins.incomplete(),
      },
      { createCwd: false }
    );

    const plugins = await plugin$.pipe(toArray()).toPromise();
    const pluginNames = plugins.map((plugin) => plugin.name);

    expect(pluginNames).toHaveLength(3);
    expect(pluginNames).toEqual(expect.arrayContaining(['pluginA', 'pluginB', 'pluginC']));

    const errors = await error$
      .pipe(
        map((error) => error.toString()),
        toArray()
      )
      .toPromise();

    expect(errors).toEqual(
      expect.arrayContaining([
        `Error: Plugin manifest must contain an "id" property. (invalid-manifest, ${manifestPath(
          'sub1',
          'sub2',
          'plugin_d'
        )})`,
      ])
    );
  });

  it('does not discover plugins nested inside another plugin', async () => {
    const { plugin$ } = discover(new PluginsConfig(pluginConfig, env), coreContext, instanceInfo);

    mockFs(
      {
        [`${PROCESS_WORKING_DIR}/src/plugins/plugin_a`]: {
          ...Plugins.valid('pluginA'),
          nested_plugin: Plugins.valid('nestedPlugin'),
        },
      },
      { createCwd: false }
    );

    const plugins = await plugin$.pipe(toArray()).toPromise();
    const pluginNames = plugins.map((plugin) => plugin.name);

    expect(pluginNames).toEqual(['pluginA']);
  });

  it('stops scanning when reaching `maxDepth`', async () => {
    const { plugin$ } = discover(new PluginsConfig(pluginConfig, env), coreContext, instanceInfo);

    mockFs(
      {
        [`${PROCESS_WORKING_DIR}/src/plugins/sub1/plugin`]: Plugins.valid('plugin1'),
        [`${PROCESS_WORKING_DIR}/src/plugins/sub1/sub2/plugin`]: Plugins.valid('plugin2'),
        [`${PROCESS_WORKING_DIR}/src/plugins/sub1/sub2/sub3/plugin`]: Plugins.valid('plugin3'),
        [`${PROCESS_WORKING_DIR}/src/plugins/sub1/sub2/sub3/sub4/plugin`]: Plugins.valid('plugin4'),
        [`${PROCESS_WORKING_DIR}/src/plugins/sub1/sub2/sub3/sub4/sub5/plugin`]: Plugins.valid(
          'plugin5'
        ),
        [`${PROCESS_WORKING_DIR}/src/plugins/sub1/sub2/sub3/sub4/sub5/sub6/plugin`]: Plugins.valid(
          'plugin6'
        ),
      },
      { createCwd: false }
    );

    const plugins = await plugin$.pipe(toArray()).toPromise();
    const pluginNames = plugins.map((plugin) => plugin.name);

    expect(pluginNames).toHaveLength(5);
    expect(pluginNames).toEqual(
      expect.arrayContaining(['plugin1', 'plugin2', 'plugin3', 'plugin4', 'plugin5'])
    );
  });

  it('works with symlinks', async () => {
    const { plugin$ } = discover(new PluginsConfig(pluginConfig, env), coreContext, instanceInfo);

    const pluginFolder = resolve(PROCESS_WORKING_DIR, '..', 'ext-plugins');

    mockFs(
      {
        [`${PROCESS_WORKING_DIR}/plugins`]: mockFs.symlink({
          path: '../ext-plugins',
        }),
        [pluginFolder]: {
          plugin_a: Plugins.valid('pluginA'),
          plugin_b: Plugins.valid('pluginB'),
        },
      },
      { createCwd: false }
    );

    const plugins = await plugin$.pipe(toArray()).toPromise();
    const pluginNames = plugins.map((plugin) => plugin.name);

    expect(pluginNames).toHaveLength(2);
    expect(pluginNames).toEqual(expect.arrayContaining(['pluginA', 'pluginB']));
  });

  it('logs a warning about --plugin-path when used in development', async () => {
    const extraPluginTestPath = resolve(process.cwd(), 'my-extra-plugin');

    env = Env.createDefault(
      REPO_ROOT,
      getEnvOptions({
        cliArgs: { dev: false, envName: 'development' },
      })
    );

    discover(
      new PluginsConfig({ ...pluginConfig, paths: [extraPluginTestPath] }, env),
      {
        coreId: Symbol(),
        configService,
        env,
        logger,
      },
      instanceInfo
    );

    expect(loggingSystemMock.collect(logger).warn).toEqual([
      [
        `Explicit plugin paths [${extraPluginTestPath}] should only be used in development. Relative imports may not work properly in production.`,
      ],
    ]);
  });

  test('does not log a warning about --plugin-path when used in production', async () => {
    const extraPluginTestPath = resolve(process.cwd(), 'my-extra-plugin');

    env = Env.createDefault(
      REPO_ROOT,
      getEnvOptions({
        cliArgs: { dev: false, envName: 'production' },
      })
    );

    discover(
      new PluginsConfig({ ...pluginConfig, paths: [extraPluginTestPath] }, env),
      {
        coreId: Symbol(),
        configService,
        env,
        logger,
      },
      instanceInfo
    );

    expect(loggingSystemMock.collect(logger).warn).toEqual([]);
  });
});
