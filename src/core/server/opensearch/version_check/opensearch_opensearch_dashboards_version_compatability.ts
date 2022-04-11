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

import semver, { coerce } from 'semver';

/** @private */
interface VersionNumbers {
  major: number;
  minor: number;
  patch: number;
}

/**
 * @private
 *
 * List of OpenSearch Dashboards major versions that can connect to legacy version
 * 7.10.2.
 *
 * WARNING: OpenSearchDashboards 7.x could cause conflicts.
 */
const osdLegacyCompatibleMajorVersions = [1, 2];

/**
 * Checks for the compatibilitiy between OpenSearch and OpenSearchDashboards versions
 * 1. Major version differences will never work together.
 * 2. Older versions of OpenSearch won't work with newer versions of OpenSearch Dashboards.
 */
export function opensearchVersionCompatibleWithOpenSearchDashboards(
  opensearchVersion: string,
  opensearchDashboardsVersion: string
) {
  const opensearchVersionNumbers: VersionNumbers = {
    major: semver.major(opensearchVersion),
    minor: semver.minor(opensearchVersion),
    patch: semver.patch(opensearchVersion),
  };

  const opensearchDashboardsVersionNumbers: VersionNumbers = {
    major: semver.major(opensearchDashboardsVersion),
    minor: semver.minor(opensearchDashboardsVersion),
    patch: semver.patch(opensearchDashboardsVersion),
  };

  if (
    legacyVersionCompatibleWithOpenSearchDashboards(
      opensearchVersionNumbers,
      opensearchDashboardsVersionNumbers
    )
  ) {
    return true;
  }

  // Reject mismatching major version numbers.
  if (opensearchVersionNumbers.major !== opensearchDashboardsVersionNumbers.major) {
    return false;
  }

  // Reject older minor versions of OpenSearch.
  if (opensearchVersionNumbers.minor < opensearchDashboardsVersionNumbers.minor) {
    return false;
  }

  return true;
}

export function opensearchVersionEqualsOpenSearchDashboards(
  nodeVersion: string,
  opensearchDashboardsVersion: string
) {
  const nodeSemVer = coerce(nodeVersion);
  const opensearchDashboardsSemver = coerce(opensearchDashboardsVersion);
  return (
    nodeSemVer &&
    opensearchDashboardsSemver &&
    nodeSemVer.version === opensearchDashboardsSemver.version
  );
}

/**
 * Verify legacy version of engines is compatible with current version
 * of OpenSearch Dashboards if OpenSearch Dashboards is 1.x.
 *
 * @private
 * @param legacyVersionNumbers semantic version of legacy engine
 * @param opensearchDashboardsVersionNumbers semantic version of application
 * @returns {boolean}
 */
function legacyVersionCompatibleWithOpenSearchDashboards(
  legacyVersionNumbers: VersionNumbers,
  opensearchDashboardsVersionNumbers: VersionNumbers
) {
  return (
    legacyVersionNumbers.major === 7 &&
    legacyVersionNumbers.minor === 10 &&
    legacyVersionNumbers.patch === 2 &&
    osdLegacyCompatibleMajorVersions.includes(opensearchDashboardsVersionNumbers.major)
  );
}
