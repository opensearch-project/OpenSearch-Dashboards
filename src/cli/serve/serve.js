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

import { set as lodashSet } from '@elastic/safer-lodash-set';
import _ from 'lodash';
import { statSync } from 'fs';
import { resolve } from 'path';
import url from 'url';

import { getConfigPath } from '@osd/utils';
import { IS_OPENSEARCH_DASHBOARDS_DISTRIBUTABLE } from '../../legacy/utils';
import { fromRoot } from '../../core/server/utils';
import { bootstrap } from '../../core/server';
import { readKeystore } from './read_keystore';

function canRequire(path) {
  try {
    require.resolve(path);
    return true;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return false;
    } else {
      throw error;
    }
  }
}

const CLUSTER_MANAGER_PATH = resolve(__dirname, '../cluster/cluster_manager');
const CAN_CLUSTER = canRequire(CLUSTER_MANAGER_PATH);

const REPL_PATH = resolve(__dirname, '../repl');
const CAN_REPL = canRequire(REPL_PATH);

const pathCollector = function () {
  const paths = [];
  return function (path) {
    paths.push(resolve(process.cwd(), path));
    return paths;
  };
};

const configPathCollector = pathCollector();
const pluginDirCollector = pathCollector();
const pluginPathCollector = pathCollector();

function applyConfigOverrides(rawConfig, opts, extraCliOptions) {
  const set = _.partial(lodashSet, rawConfig);
  const get = _.partial(_.get, rawConfig);
  const has = _.partial(_.has, rawConfig);
  const merge = _.partial(_.merge, rawConfig);

  if (opts.dev) {
    set('env', 'development');

    if (!has('opensearch.username')) {
      set('opensearch.username', 'opensearch_dashboards_system');
    }

    if (!has('opensearch.password')) {
      set('opensearch.password', 'changeme');
    }

    if (opts.ssl) {
      // @osd/dev-utils is part of devDependencies
      const { CA_CERT_PATH, OSD_KEY_PATH, OSD_CERT_PATH } = require('@osd/dev-utils');
      const customOpenSearchHosts = opts.opensearch
        ? opts.opensearch.split(',')
        : [].concat(get('opensearch.hosts') || []);

      function ensureNotDefined(path) {
        if (has(path)) {
          throw new Error(`Can't use --ssl when "${path}" configuration is already defined.`);
        }
      }
      ensureNotDefined('server.ssl.certificate');
      ensureNotDefined('server.ssl.key');
      ensureNotDefined('server.ssl.keystore.path');
      ensureNotDefined('server.ssl.truststore.path');
      ensureNotDefined('server.ssl.certificateAuthorities');
      ensureNotDefined('opensearch.ssl.certificateAuthorities');

      const opensearchHosts = (
        (customOpenSearchHosts.length > 0 && customOpenSearchHosts) || ['https://localhost:9200']
      ).map((hostUrl) => {
        const parsedUrl = url.parse(hostUrl);
        if (parsedUrl.hostname !== 'localhost') {
          throw new Error(
            `Hostname "${parsedUrl.hostname}" can't be used with --ssl. Must be "localhost" to work with certificates.`
          );
        }
        return `https://localhost:${parsedUrl.port}`;
      });

      set('server.ssl.enabled', true);
      set('server.ssl.certificate', OSD_CERT_PATH);
      set('server.ssl.key', OSD_KEY_PATH);
      set('server.ssl.certificateAuthorities', CA_CERT_PATH);
      set('opensearch.hosts', opensearchHosts);
      set('opensearch.ssl.certificateAuthorities', CA_CERT_PATH);
    }
  }

  if (opts.opensearch) set('opensearch.hosts', opts.opensearch.split(','));
  if (opts.port) set('server.port', opts.port);
  if (opts.host) set('server.host', opts.host);
  if (opts.quiet) set('logging.quiet', true);
  if (opts.silent) set('logging.silent', true);
  if (opts.verbose) set('logging.verbose', true);
  if (opts.logFile) set('logging.dest', opts.logFile);

  set('plugins.scanDirs', _.compact([].concat(get('plugins.scanDirs'), opts.pluginDir)));
  set('plugins.paths', _.compact([].concat(get('plugins.paths'), opts.pluginPath)));

  merge(extraCliOptions);
  merge(readKeystore());

  return rawConfig;
}

export default function (program) {
  const command = program.command('serve');

  command
    .description('Run the opensearch-dashboards server')
    .collectUnknownOptions()
    .option('-e, --opensearch <uri1,uri2>', 'OpenSearch instances')
    .option(
      '-c, --config <path>',
      'Path to the config file, use multiple --config args to include multiple config files',
      configPathCollector,
      [getConfigPath()]
    )
    .option('-p, --port <port>', 'The port to bind to', parseInt)
    .option('-q, --quiet', 'Prevent all logging except errors')
    .option('-Q, --silent', 'Prevent all logging')
    .option('--verbose', 'Turns on verbose logging')
    .option('-H, --host <host>', 'The host to bind to')
    .option('-l, --log-file <path>', 'The file to log to')
    .option(
      '--plugin-dir <path>',
      'A path to scan for plugins, this can be specified multiple ' +
        'times to specify multiple directories',
      pluginDirCollector,
      [fromRoot('plugins')]
    )
    .option(
      '--plugin-path <path>',
      'A path to a plugin which should be included by the server, ' +
        'this can be specified multiple times to specify multiple paths',
      pluginPathCollector,
      []
    )
    .option('--plugins <path>', 'an alias for --plugin-dir', pluginDirCollector)
    .option('--optimize', 'Deprecated, running the optimizer is no longer required');

  if (CAN_REPL) {
    command.option('--repl', 'Run the server with a REPL prompt and access to the server object');
  }

  if (!IS_OPENSEARCH_DASHBOARDS_DISTRIBUTABLE) {
    command.option(
      '--run-examples',
      'Adds plugin paths for all the OpenSearch Dashboards example plugins and runs with no base path'
    );
  }

  if (CAN_CLUSTER) {
    command
      .option('--dev', 'Run the server with development mode defaults')
      .option('--ssl', 'Run the dev server using HTTPS')
      .option('--dist', 'Use production assets from osd/optimizer')
      .option(
        '--no-base-path',
        "Don't put a proxy in front of the dev server, which adds a random basePath"
      )
      .option('--no-watch', 'Prevents automatic restarts of the server in --dev mode')
      .option('--no-optimizer', 'Disable the osd/optimizer completely')
      .option('--no-cache', 'Disable the osd/optimizer cache')
      .option(
        '--no-dev-config',
        'Prevents loading the opensearch_dashboards.dev.yml file in --dev mode'
      );
  }

  command.action(async function (opts) {
    if (opts.dev && opts.devConfig !== false) {
      try {
        const osdDevConfig = fromRoot('config/opensearch_dashboards.dev.yml');
        if (statSync(osdDevConfig).isFile()) {
          opts.config.push(osdDevConfig);
        }
      } catch (err) {
        // ignore, opensearch_dashboards.dev.yml does not exist
      }
    }

    const unknownOptions = this.getUnknownOptions();
    await bootstrap({
      configs: [].concat(opts.config || []),
      cliArgs: {
        dev: !!opts.dev,
        envName: unknownOptions.env ? unknownOptions.env.name : undefined,
        quiet: !!opts.quiet,
        silent: !!opts.silent,
        watch: !!opts.watch,
        repl: !!opts.repl,
        runExamples: !!opts.runExamples,
        // We want to run without base path when the `--run-examples` flag is given so that we can use local
        // links in other documentation sources, like "View this tutorial [here](http://localhost:5601/app/tutorial/xyz)".
        // We can tell users they only have to run with `yarn start --run-examples` to get those
        // local links to work.  Similar to what we do for "View in Console" links in our
        // opensearch.org links.
        basePath: opts.runExamples ? false : !!opts.basePath,
        optimize: !!opts.optimize,
        disableOptimizer: !opts.optimizer,
        cache: !!opts.cache,
        dist: !!opts.dist,
      },
      features: {
        isClusterModeSupported: CAN_CLUSTER,
        isReplModeSupported: CAN_REPL,
      },
      applyConfigOverrides: (rawConfig) => applyConfigOverrides(rawConfig, opts, unknownOptions),
    });
  });
}
