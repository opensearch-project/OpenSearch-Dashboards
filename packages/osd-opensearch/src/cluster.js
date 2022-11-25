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

const fs = require('fs');
const util = require('util');
const execa = require('execa');
const chalk = require('chalk');
const path = require('path');
const { downloadSnapshot, installSnapshot, installSource, installArchive } = require('./install');
const { OPENSEARCH_BIN, OPENSEARCH_PLUGIN } = require('./paths');
const { log: defaultLog, parseOpenSearchLog, extractConfigFiles, decompress } = require('./utils');
const { createCliError } = require('./errors');
const { promisify } = require('util');
const treeKillAsync = promisify(require('tree-kill'));
const { parseSettings, SettingsFilter } = require('./settings');
const { CA_CERT_PATH, OPENSEARCH_P12_PATH, OPENSEARCH_P12_PASSWORD } = require('@osd/dev-utils');
const readFile = util.promisify(fs.readFile);

// listen to data on stream until map returns anything but undefined
const first = (stream, map) =>
  new Promise((resolve) => {
    const onData = (data) => {
      const result = map(data);
      if (result !== undefined) {
        resolve(result);
        stream.removeListener('data', onData);
      }
    };
    stream.on('data', onData);
  });

exports.Cluster = class Cluster {
  constructor({ log = defaultLog, ssl = false } = {}) {
    this._log = log;
    this._ssl = ssl;
    this._caCertPromise = ssl ? readFile(CA_CERT_PATH) : undefined;
  }

  /**
   * Builds and installs OpenSearch from source
   *
   * @param {Object} options
   * @property {Array} options.installPath
   * @property {Array} options.sourcePath
   * @returns {Promise<{installPath}>}
   */
  async installSource(options = {}) {
    this._log.info(chalk.bold('Installing from source'));
    this._log.indent(4);

    const { installPath } = await installSource({ log: this._log, ...options });

    this._log.indent(-4);

    return { installPath };
  }

  /**
   * Download OpenSearch from a snapshot
   *
   * @param {Object} options
   * @property {Array} options.installPath
   * @property {Array} options.sourcePath
   * @returns {Promise<{installPath}>}
   */
  async downloadSnapshot(options = {}) {
    this._log.info(chalk.bold('Downloading snapshot'));
    this._log.indent(4);

    const { installPath } = await downloadSnapshot({
      log: this._log,
      ...options,
    });

    this._log.indent(-4);

    return { installPath };
  }

  /**
   * Download and installs OpenSearch from a snapshot
   *
   * @param {Object} options
   * @property {Array} options.installPath
   * @property {Array} options.sourcePath
   * @returns {Promise<{installPath}>}
   */
  async installSnapshot(options = {}) {
    this._log.info(chalk.bold('Installing from snapshot'));
    this._log.indent(4);

    const { installPath } = await installSnapshot({
      log: this._log,
      ...options,
    });

    this._log.indent(-4);

    return { installPath };
  }

  /**
   * Installs OpenSearch from a local tar
   *
   * @param {String} path
   * @param {Object} options
   * @property {Array} options.installPath
   * @returns {Promise<{installPath}>}
   */
  async installArchive(path, options = {}) {
    this._log.info(chalk.bold('Installing from an archive'));
    this._log.indent(4);

    const { installPath } = await installArchive(path, {
      log: this._log,
      ...options,
    });

    this._log.indent(-4);

    return { installPath };
  }

  /**
   * Unpakcs a tar or zip file containing the data directory for an
   * OpenSearch cluster.
   *
   * @param {String} installPath
   * @param {String} archivePath
   */
  async extractDataDirectory(installPath, archivePath) {
    this._log.info(chalk.bold(`Extracting data directory`));
    this._log.indent(4);

    // decompress excludes the root directory as that is how our archives are
    // structured. This works in our favor as we can explicitly extract into the data dir
    const extractPath = path.resolve(installPath, 'data');
    this._log.info(`Data archive: ${archivePath}`);
    this._log.info(`Extract path: ${extractPath}`);

    await decompress(archivePath, extractPath);

    this._log.indent(-4);
  }

  /**
   * Unpacks a tar or zip file containing the OpenSearch plugin directory for an
   * OpenSearch cluster.
   *
   * @param {string} installPath
   * @param {Array|string} opensearchPlugins Array or string of OpenSearch plugin(s) artifact url
   */
  async installOpenSearchPlugins(installPath, opensearchPluginsPath) {
    if (opensearchPluginsPath) {
      this._log.info(chalk.bold(`Downloading OpenSearch plugin(s) on the cluster snapshot`));
      this._log.indent(4);
      opensearchPluginsPath =
        typeof opensearchPluginsPath === 'string' ? [opensearchPluginsPath] : opensearchPluginsPath;
      // Run opensearch-plugin tool script to download OpenSearch plugin artifacts
      for (const pluginPath of opensearchPluginsPath) {
        this._log.info(`Installing OpenSearch Plugin from the path: ${pluginPath}`);
        await execa(OPENSEARCH_PLUGIN, [`install`, `--batch`, pluginPath], { cwd: installPath });
      }
      this._log.info(`Plugin installation complete`);
      this._log.indent(-4);
    }
  }

  /**
   * Starts OpenSearch and returns resolved promise once started
   *
   * @param {String} installPath
   * @param {Object} options
   * @property {Array} options.opensearchArgs
   * @property {String} options.password - super user password used to bootstrap
   * @returns {Promise}
   */
  async start(installPath, options = {}) {
    this._exec(installPath, options);

    await Promise.race([
      // wait for opensearch to be started
      Promise.all([
        first(this._process.stdout, (data) => {
          if (/started/.test(data)) {
            return true;
          }
        }),
      ]),

      // await the outcome of the process in case it exits before starting
      this._outcome.then(() => {
        throw createCliError('OpenSearch exited without starting');
      }),
    ]);
  }

  /**
   * Starts OpenSearch and waits for OpenSearch to exit
   *
   * @param {String} installPath
   * @param {Object} options
   * @property {Array} options.opensearchArgs
   * @returns {Promise<undefined>}
   */
  async run(installPath, options = {}) {
    this._exec(installPath, options);

    // await the final outcome of the process
    await this._outcome;
  }

  /**
   * Stops OpenSearch process, if it's running
   *
   * @returns {Promise}
   */
  async stop() {
    if (this._stopCalled) {
      return;
    }
    this._stopCalled = true;

    if (!this._process || !this._outcome) {
      throw new Error('OpenSearch has not been started');
    }

    /* Temporary fix for https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2811
     *
     * `tree-kill` behaves differently on Windows, where it throws if `pid` is already dead, when
     * compared to other operating systems, where it silently returns.
     */
    try {
      await treeKillAsync(this._process.pid);
    } catch (ex) {
      console.log('ex.message', ex.message);
      if (
        process.platform === 'win32' &&
        !ex.message?.includes(`The process "${this._process.pid}" not found`)
      ) {
        throw ex;
      }
    }

    await this._outcome;
  }

  /**
   * Common logic from this.start() and this.run()
   *
   * Start the opensearch process (stored at `this._process`)
   * and "pipe" its stdio to `this._log`. Also create `this._outcome`
   * which will be resolved/rejected when the process exits.
   *
   * @private
   * @param {String} installPath
   * @param {Object} options
   * @property {Array} options.opensearchArgs
   * @return {undefined}
   */
  _exec(installPath, options = {}) {
    if (this._process || this._outcome) {
      throw new Error('OpenSearch has already been started');
    }

    this._log.info(chalk.bold('Starting'));
    this._log.indent(4);

    // Add to opensearchArgs if ssl is enabled
    const opensearchArgs = [].concat(options.opensearchArgs || []);
    if (this._ssl) {
      opensearchArgs.push('xpack.security.http.ssl.enabled=true');
      opensearchArgs.push(`xpack.security.http.ssl.keystore.path=${OPENSEARCH_P12_PATH}`);
      opensearchArgs.push(`xpack.security.http.ssl.keystore.type=PKCS12`);
      opensearchArgs.push(`xpack.security.http.ssl.keystore.password=${OPENSEARCH_P12_PASSWORD}`);
    }

    const args = parseSettings(
      extractConfigFiles(opensearchArgs, installPath, { log: this._log }),
      {
        filter: SettingsFilter.NonSecureOnly,
      }
    ).reduce(
      (acc, [settingName, settingValue]) => acc.concat(['-E', `${settingName}=${settingValue}`]),
      []
    );

    this._log.debug('%s %s', OPENSEARCH_BIN, args.join(' '));

    options.opensearchEnvVars = options.opensearchEnvVars || {};

    // OpenSearch now automatically sets heap size to 50% of the machine's available memory
    // so we need to set it to a smaller size for local dev and CI
    // especially because we currently run many instances of OpenSearch on the same machine during CI
    options.opensearchEnvVars.OPENSEARCH_JAVA_OPTS =
      (options.opensearchEnvVars.OPENSEARCH_JAVA_OPTS
        ? `${options.opensearchEnvVars.OPENSEARCH_JAVA_OPTS} `
        : '') + '-Xms1g -Xmx1g';

    this._process = execa(OPENSEARCH_BIN, args, {
      cwd: installPath,
      env: {
        //...(installPath
        //? { OPENSEARCH_TMPDIR: path.resolve(installPath, 'OPENSEARCH_TMPDIR') }
        //: {}),
        ...process.env,
        ...(options.bundledJDK ? { JAVA_HOME: '' } : {}),
        ...(options.opensearchEnvVars || {}),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // parse and forward opensearch stdout to the log
    this._process.stdout.on('data', (data) => {
      const lines = parseOpenSearchLog(data.toString());
      lines.forEach((line) => {
        this._log.info(line.formattedMessage);
      });
    });

    // forward opensearcch stderr to the log
    this._process.stderr.on('data', (data) => this._log.error(chalk.red(data.toString())));

    // observe the exit code of the process and reflect in _outcome promies
    const exitCode = new Promise((resolve) => this._process.once('exit', resolve));
    this._outcome = exitCode.then((code) => {
      if (this._stopCalled) {
        return;
      }

      // JVM exits with 143 on SIGTERM and 130 on SIGINT, dont' treat them as errors
      if (code > 0 && !(code === 143 || code === 130)) {
        throw createCliError(`OpenSearch exited with code ${code}`);
      }
    });
  }
};
