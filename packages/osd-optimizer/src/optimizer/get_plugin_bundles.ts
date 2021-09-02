/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import Fs from 'fs';
import Path from 'path';

import { Bundle } from '../common';

import { OpenSearchDashboardsPlatformPlugin } from './opensearch_dashboards_platform_plugins';

export function getPluginBundles(
  plugins: OpenSearchDashboardsPlatformPlugin[],
  repoRoot: string,
  outputRoot: string
) {
  return plugins
    .filter((p) => p.isUiPlugin)
    .map(
      (p) =>
        new Bundle({
          type: 'plugin',
          id: p.id,
          publicDirNames: ['public', ...p.extraPublicDirs],
          sourceRoot: repoRoot,
          contextDir: p.directory,
          outputDir: Path.resolve(
            outputRoot,
            Path.relative(repoRoot, p.directory),
            'target/public'
          ),
          moduleAliases: getBundleAliases(p.directory),
          manifestPath: p.manifestPath,
          banner: undefined,
        })
    );
}

const getBundleAliases = (contextDir: string): Record<string, string> | undefined => {
  const pathPackage = `${contextDir}/package.json`;
  if (Fs.existsSync(pathPackage)) {
    const pluginPackage = JSON.parse(Fs.readFileSync(pathPackage, 'utf8'));
    const aliases = pluginPackage?._moduleAliases as Record<string, string>;
    if (aliases !== undefined) return aliases;
  }
};
