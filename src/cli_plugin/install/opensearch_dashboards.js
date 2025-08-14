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
import { statSync } from 'fs';
import semver from 'semver';

import { cleanVersion } from '../../legacy/utils/version';

export function existingInstall(settings, logger) {
  try {
    statSync(path.join(settings.pluginDir, settings.plugins[0].id));

    logger.error(
      `Plugin ${settings.plugins[0].id} already exists, please remove before installing a new version`
    );
    process.exit(70);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

export function assertVersion(settings, logger) {
  if (!settings.plugins[0].opensearchDashboardsVersion) {
    throw new Error(
      `Plugin opensearch_dashboards.json is missing both a version property (required) and a opensearchDashboardsVersion property (optional).`
    );
  }

  const actual = cleanVersion(settings.plugins[0].opensearchDashboardsVersion);
  const expected = cleanVersion(settings.version);

  if (actual === 'opensearchDashboards') {
    return;
  }

  const actualVersion = semver.parse(actual);
  const expectedVersion = semver.parse(expected);

  if (!actualVersion || !expectedVersion) {
    throw new Error(
      `Invalid version format. Plugin: ${actual}, OpenSearch Dashboards: ${expected}`
    );
  }

  const mode = settings.singleVersion;

  switch (mode) {
    case 'strict':
      if (!semver.eq(actualVersion, expectedVersion)) {
        throw new Error(
          `Plugin ${settings.plugins[0].id} [${actual}] is incompatible with OpenSearch Dashboards [${expected}]. Strict mode requires exact version match.`
        );
      }
      break;

    case 'ignore':
      if (actualVersion.major !== expectedVersion.major) {
        logger.log(
          `WARNING: Plugin ${settings.plugins[0].id} [${actual}] major version differs from OpenSearch Dashboards [${expected}]. Plugin may not function correctly.`
        );
      }
      break;

    default:
      throw new Error(`Invalid single-version mode: ${mode}. Use 'strict' or 'ignore'.`);
  }
}
