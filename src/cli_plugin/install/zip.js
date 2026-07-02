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

import path from 'path';
import { createWriteStream, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';

import yauzl from 'yauzl';

/**
 * Returns an array of package objects. There will be one for each of
 * package.json files in the archive
 */

export async function analyzeArchive(archive) {
  const plugins = [];
  const regExp = new RegExp(
    '(opensearch-dashboards[\\\\/][^\\\\/]+)[\\\\/]opensearch_dashboards.json',
    'i'
  );

  const zipfile = await yauzl.openPromise(archive);
  for await (const entry of zipfile.eachEntry()) {
    const match = entry.fileName.match(regExp);
    if (!match) continue;

    const readStream = await zipfile.openReadStreamPromise(entry);
    const chunks = [];
    for await (const chunk of readStream) {
      chunks.push(chunk);
    }

    const manifest = JSON.parse(Buffer.concat(chunks).toString());
    plugins.push({
      id: manifest.id,
      stripPrefix: match[1],

      // Plugins must specify their version, and by default that version in the plugin
      // manifest should match the version of opensearch-dashboards down to the patch level. If these
      // two versions need plugins can specify a opensearchDashboardsVersion to indicate the version
      // of opensearch-dashboards the plugin is intended to work with.
      opensearchDashboardsVersion:
        typeof manifest.opensearchDashboardsVersion === 'string' &&
        manifest.opensearchDashboardsVersion
          ? manifest.opensearchDashboardsVersion
          : manifest.version,
    });
  }

  return plugins;
}

export async function extractArchive(archive, targetDir, stripPrefix) {
  const resolvedTarget = targetDir ? path.resolve(targetDir) : null;
  // Normalise stripPrefix so the boundary check is suffix-safe:
  // 'opensearch-dashboards/plugin' must not match 'opensearch-dashboards/plugin-evil'.
  // NOTE: stripPrefix is required for any files to be extracted; if omitted, nothing is written.
  let normalizedPrefix = null;
  if (stripPrefix) {
    normalizedPrefix = stripPrefix.endsWith('/') ? stripPrefix : stripPrefix + '/';
  }

  const zipfile = await yauzl.openPromise(archive);
  for await (const entry of zipfile.eachEntry()) {
    if (!normalizedPrefix || !entry.fileName.startsWith(normalizedPrefix)) {
      continue;
    }

    let fileName = entry.fileName.substring(normalizedPrefix.length);

    if (resolvedTarget) {
      fileName = path.resolve(resolvedTarget, fileName);
      if (fileName !== resolvedTarget && !fileName.startsWith(resolvedTarget + path.sep)) {
        throw new Error(`Zip slip detected: ${entry.fileName}`);
      }
    }

    if (entry.fileName.endsWith('/')) {
      mkdirSync(fileName, { recursive: true });
    } else {
      // file entry — ensure parent directory exists
      mkdirSync(path.dirname(fileName), { recursive: true });

      const readStream = await zipfile.openReadStreamPromise(entry);
      await pipeline(
        readStream,
        createWriteStream(fileName, {
          // eslint-disable-next-line no-bitwise
          mode: entry.externalFileAttributes >>> 16,
        })
      );
    }
  }
}
