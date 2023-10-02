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

import expiry from 'expiry-js';

import { fromRoot } from '../../core/server/utils';

const LATEST_PLUGIN_BASE_URL =
  'https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards';

function generateUrls({ version, plugin }) {
  return [plugin, generatePluginUrl(version, plugin)];
}

function generatePluginUrl(version, plugin) {
  const [platform, type] =
    process.platform === 'win32' ? ['windows', 'zip'] : [process.platform, 'tar'];
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';

  return `${LATEST_PLUGIN_BASE_URL}/${version}/latest/${platform}/${arch}/${type}/builds/opensearch-dashboards/plugins/${plugin}-${version}.zip`;
}

export function parseMilliseconds(val) {
  let result;

  try {
    const timeVal = expiry(val);
    result = timeVal.asMilliseconds();
  } catch (ex) {
    result = 0;
  }

  return result;
}

export function parse(command, options, osdPackage) {
  const settings = {
    timeout: options.timeout || 0,
    quiet: options.quiet || false,
    silent: options.silent || false,
    config: options.config || '',
    plugin: command,
    version: osdPackage.version,
    pluginDir: fromRoot('plugins'),
  };

  settings.urls = generateUrls(settings);
  settings.workingPath = resolve(settings.pluginDir, '.plugin.installing');
  settings.tempArchiveFile = resolve(settings.workingPath, 'archive.part');

  return settings;
}
