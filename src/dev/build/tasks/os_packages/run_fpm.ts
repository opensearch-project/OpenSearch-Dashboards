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

import { resolve } from 'path';

import { ToolingLog } from '@osd/dev-utils';

import { exec, Config, Build } from '../../lib';

export async function runFpm(
  config: Config,
  log: ToolingLog,
  build: Build,
  type: 'rpm' | 'deb',
  arch: 'x64' | 'arm64',
  pkgSpecificFlags: string[]
) {
  const linux = config.getPlatform('linux', arch);
  const version = config.getBuildVersion();
  const fileName = config.resolveFromTarget(
    arch === 'arm64' ? `NAME-${version}-arm64.${type}` : `NAME-${version}-ARCH.TYPE`
  );

  const resolveWithTrailingSlash = (...paths: string[]) => `${resolve(...paths)}/`;

  const fromBuild = (...paths: string[]) => build.resolvePathForPlatform(linux, ...paths);

  const pickLicense = () => {
    return type === 'rpm' ? 'ASL 2.0' : 'ASL-2.0';
  };

  const args = [
    // Force output even if it will overwrite an existing file
    '--force',

    // define the type for this package
    '-t',
    type,

    // we force dashes in the version file name because otherwise fpm uses
    // the filtered package version, which would have dashes replaced with
    // underscores
    '--package',
    fileName,

    // input type
    '-s',
    'dir',

    // general info about the package
    '--name',
    'opensearch-dashboards',
    '--description',
    'Explore and visualize your OpenSearch data',
    '--version',
    version,
    '--url',
    'https://opensearch.org',
    '--vendor',
    'OpenSearch',
    '--maintainer',
    'OpenSearch Dashboards Team <opensearch@amazon.com>',
    '--license',
    pickLicense(),

    // prevent installing opensearch-dashboards if installing opensearch-dashboards-oss and vice versa
    '--conflicts',
    'opensearch-dashboards',
    // define install/uninstall scripts
    '--after-install',
    resolve(__dirname, 'package_scripts/post_install.sh'),
    '--before-install',
    resolve(__dirname, 'package_scripts/pre_install.sh'),
    '--before-remove',
    resolve(__dirname, 'package_scripts/pre_remove.sh'),
    '--after-remove',
    resolve(__dirname, 'package_scripts/post_remove.sh'),

    // tell fpm about the config file so that it is called out in the package definition
    '--config-files',
    `/etc/opensearch-dashboards/opensearch_dashboards.yml`,

    // define template values that will be injected into the install/uninstall
    // scripts, also causes scripts to be processed with erb
    '--template-value',
    `user=opensearch-dashboards`,
    '--template-value',
    `group=opensearch-dashboards`,
    '--template-value',
    `optimizeDir=/usr/share/opensearch-dashboards/optimize`,
    '--template-value',
    `configDir=/etc/opensearch-dashboards`,
    '--template-value',
    `pluginsDir=/usr/share/opensearch-dashboards/plugins`,
    '--template-value',
    `dataDir=/var/lib/opensearch-dashboards`,

    // config and data directories are copied to /usr/share and /var/lib
    // below, so exclude them from the main package source located in
    // /usr/share/opensearch-dashboards/config. PATHS MUST BE RELATIVE, so drop the leading slash
    '--exclude',
    `usr/share/opensearch-dashboards/config`,
    '--exclude',
    `usr/share/opensearch-dashboards/data`,
    '--exclude',
    `usr/share/opensearch-dashboards/assets`,

    // flags specific to the package we are building, supplied by tasks below
    ...pkgSpecificFlags,

    // copy the build output to /usr/share/opensearch-dashboards/, config and data dirs
    // are excluded with `--exclude` flag above
    `${resolveWithTrailingSlash(fromBuild('.'))}=/usr/share/opensearch-dashboards/`,

    // copy the config directory to /etc/opensearch-dashboards
    `${resolveWithTrailingSlash(fromBuild('config'))}=/etc/opensearch-dashboards/`,

    // copy the data directory at /var/lib/opensearch-dashboards
    `${resolveWithTrailingSlash(fromBuild('data'))}=/var/lib/opensearch-dashboards/`,

    // copy package configurations
    `${resolveWithTrailingSlash(__dirname, 'service_templates/sysv/')}=/`,
    `${resolveWithTrailingSlash(__dirname, 'service_templates/systemd/')}=/`,
  ];

  log.debug('calling fpm with args:', args);
  await exec(log, 'fpm', args, {
    cwd: config.resolveFromRepo('.'),
    level: 'info',
  });
}
