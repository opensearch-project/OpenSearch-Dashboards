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
import path from 'path';

import dedent from 'dedent';
import Yaml from 'js-yaml';
import { createFailError, ToolingLog } from '@osd/dev-utils';

import { OptimizerConfig, getMetrics, Limits } from './optimizer';

const LIMITS_PATH = require.resolve('../limits.yml');
const DELTA_FILE_PATH = path.resolve(__dirname, '../limits_delta.yml');
const DELTA_LIMIT = 0.05;

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

interface Metric {
  group: string;
  id: string;
  value: number;
  limit?: number;
}

const readDeltas = (): { [key: string]: any } => {
  if (Fs.existsSync(DELTA_FILE_PATH)) {
    const fileContent = Fs.readFileSync(DELTA_FILE_PATH, 'utf-8');
    return Yaml.load(fileContent) as { [key: string]: any };
  }
  return {};
};

const updateBundleSizeVariation = (log: ToolingLog, metric: Metric) => {
  if (metric.limit != null && metric.value > metric.limit) {
    const delta = (metric.value - metric.limit) / metric.limit; // Decimal format

    if (delta > DELTA_LIMIT) {
      // DELTA_LIMIT is 0.05 (5%)
      log.warning(
        `Metric [${metric.group}] for [${metric.id}] exceeds the limit by more than ${(
          delta * 100
        ).toFixed(2)}%`
      );

      // Read existing data
      const existingData = readDeltas() || {};

      // Ensure `pageLoadAssetSizeVariation` exists in the structure
      if (!existingData.pageLoadAssetSizeVariation) {
        existingData.pageLoadAssetSizeVariation = {};
      }

      // Convert decimal to whole number percentage and store
      existingData.pageLoadAssetSizeVariation[metric.id] = Math.round(delta * 100);

      // Write the updated structure back to the file
      Fs.writeFileSync(DELTA_FILE_PATH, Yaml.dump(existingData));
    }
  }
};

export function updateBundleLimits(log: ToolingLog, config: OptimizerConfig) {
  const metrics = getMetrics(log, config);

  const pageLoadAssetSize: NonNullable<Limits['pageLoadAssetSize']> = {};

  for (const metric of metrics.sort((a, b) => a.id.localeCompare(b.id))) {
    if (metric.group === 'page load bundle size') {
      const existingLimit = config.limits.pageLoadAssetSize?.[metric.id];
      pageLoadAssetSize[metric.id] =
        existingLimit != null && existingLimit >= metric.value ? existingLimit : metric.value;

      // Update the bundle size variation file for bundles that exceed the limit by more than 5%.
      updateBundleSizeVariation(log, metric);
    }
  }

  const newLimits: Limits = {
    pageLoadAssetSize,
  };

  Fs.writeFileSync(LIMITS_PATH, Yaml.dump(newLimits));
  log.success(`wrote updated limits to ${LIMITS_PATH}`);
}
