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

const dedent = require('dedent');
const getopts = require('getopts');
const { Cluster } = require('../cluster');

exports.description = 'Downloads and run from a nightly snapshot';

exports.help = (defaults = {}) => {
  const { license = 'basic', password = 'changeme', 'base-path': basePath } = defaults;

  return dedent`
    Options:

      --license         Run with a 'oss', 'basic', or 'trial' license [default: ${license}]
      --version         Version of OpenSearch to download [default: ${defaults.version}]
      --base-path       Path containing cache/installations [default: ${basePath}]
      --install-path    Installation path, defaults to 'source' within base-path
      --data-archive    Path to zip or tarball containing an OpenSearch data directory to seed the cluster with.
      --password        Sets password for opensearch user [default: ${password}]
      -E                Additional key=value settings to pass to OpenSearch
      --download-only   Download the snapshot but don't actually start it
      --ssl             Sets up SSL on OpenSearch
      --P               OpenSearch plugin artifact URL to install it on the cluster. We can use the flag multiple times
                        to install multiple plugins on the cluster snapshot. The argument value can be url to zip file, maven coordinates of the plugin 
                        or for local zip files, use file:<followed by the absolute or relative path to the plugin zip file>.

    Example:

      opensearch snapshot --version 2.2.0 -E cluster.name=test -E path.data=/tmp/opensearch-data --P org.opensearch.plugin:test-plugin:2.2.0.0 --P file:/home/user/opensearch-test-plugin-2.2.0.0.zip
  `;
};

exports.run = async (defaults = {}) => {
  const argv = process.argv.slice(2);
  const options = getopts(argv, {
    alias: {
      basePath: 'base-path',
      installPath: 'install-path',
      dataArchive: 'data-archive',
      opensearchArgs: 'E',
      opensearchPlugins: 'P',
    },

    string: ['version'],

    boolean: ['download-only'],

    default: defaults,
  });

  const cluster = new Cluster({ ssl: options.ssl });
  if (options['download-only']) {
    await cluster.downloadSnapshot(options);
  } else {
    const { installPath } = await cluster.installSnapshot(options);

    if (options.dataArchive) {
      await cluster.extractDataDirectory(installPath, options.dataArchive);
    }

    if (options.opensearchPlugins) {
      await cluster.installOpenSearchPlugins(installPath, options.opensearchPlugins);
    }

    options.bundledJDK = true;

    await cluster.run(installPath, options);
  }
};
