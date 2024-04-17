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

import Fs from 'fs';

import dedent from 'dedent';
import Yaml from 'js-yaml';
import { createFailError, ToolingLog } from '@osd/dev-utils';

import { OptimizerConfig, getMetrics, Limits, SortedLimits } from './optimizer';

const LIMITS_PATH = require.resolve('../limits.yml');
const DEFAULT_BUDGET = 15000;

const diff = <T>(a: T[], b: T[]): T[] => a.filter((item) => !b.includes(item));

export function readLimits(): Limits {
  let yaml;
  try {
    yaml = Fs.readFileSync(LIMITS_PATH, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return yaml ? (Yaml.load(yaml) as any) : {};
}

export function validateLimitsForAllBundles(log: ToolingLog, config: OptimizerConfig) {
  const limitBundleIds = Object.keys(config.limits.pageLoadAssetSize || {});
  const configBundleIds = config.bundles.map((b) => b.id);

  const missingBundleIds = diff(configBundleIds, limitBundleIds);
  const extraBundleIds = diff(limitBundleIds, configBundleIds);

  const issues = [];
  if (missingBundleIds.length) {
    issues.push(`missing: ${missingBundleIds.join(', ')}`);
  }
  if (extraBundleIds.length) {
    issues.push(`extra: ${extraBundleIds.join(', ')}`);
  }
  if (issues.length) {
    throw createFailError(
      dedent`
        The limits defined in packages/osd-optimizer/limits.yml are outdated. Please update
        this file with a limit (in bytes) for every production bundle.

          ${issues.join('\n          ')}

        To automatically update the limits file locally run:

          node scripts/build_opensearch_dashboards_platform_plugins.js --update-limits

        To validate your changes locally run:

          node scripts/build_opensearch_dashboards_platform_plugins.js --validate-limits
      ` + '\n'
    );
  }

  log.success('limits.yml file valid');
}

export function updateBundleLimits(log: ToolingLog, config: OptimizerConfig) {
  const metrics = getMetrics(log, config);

  let externalPlugins: { [id: string]: number } = {};
  let osdPlugins: { [id: string]: number } = {};

  // Categorize all metrics
  for (const metric of metrics) {
    if (metric.group === 'page load bundle size') {
      const existingLimit = config.limits.pageLoadAssetSize?.[metric.id];
      const limitValue =
        existingLimit != null && existingLimit >= metric.value
          ? existingLimit
          : metric.value + DEFAULT_BUDGET;

      if (metric.id.includes('Dashboards')) {
        externalPlugins[metric.id] = limitValue;
      } else {
        osdPlugins[metric.id] = limitValue;
      }
    }
  }

  // Sort each category by their values
  externalPlugins = Object.fromEntries(Object.entries(externalPlugins).sort((a, b) => b[1] - a[1]));
  osdPlugins = Object.fromEntries(Object.entries(osdPlugins).sort((a, b) => b[1] - a[1]));

  const newLimits: SortedLimits = {
    pageLoadAssetSize: {
      'External Plugins': externalPlugins,
      'OpenSearch Dashboards Plugins': osdPlugins,
    },
  };

  Fs.writeFileSync(LIMITS_PATH, Yaml.dump(newLimits, { noRefs: true }));
  log.success(`Wrote updated and sorted limits to ${LIMITS_PATH}`);
}
