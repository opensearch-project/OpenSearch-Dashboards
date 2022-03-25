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

import { omit } from 'lodash';
import { UsageCollectionSetup } from 'src/plugins/usage_collection/server';
import { LegacyAPICaller } from 'opensearch-dashboards/server';
import { StatsCollectionContext } from 'src/plugins/telemetry_collection_manager/server';
import { OpenSearchClient } from 'src/core/server';

export interface OpenSearchDashboardsUsageStats {
  opensearchDashboards: {
    index: string;
  };
  opensearch_dashboards_stats: {
    os: {
      // These should be provided
      platform: string | undefined;
      platformRelease: string | undefined;
      // The ones below are really optional
      distro?: string;
      distroRelease?: string;
    };
  };

  [plugin: string]: any;
}

export function handleOpenSearchDashboardsStats(
  { logger, version: serverVersion }: StatsCollectionContext,
  response?: OpenSearchDashboardsUsageStats
) {
  if (!response) {
    logger.warn('No OpenSearchDashboards stats returned from usage collectors');
    return;
  }
  const {
    opensearchDashboards,
    opensearch_dashboards_stats: opensearchDashboardsStats,
    ...plugins
  } = response;

  const os = {
    platform: 'unknown',
    platformRelease: 'unknown',
    ...opensearchDashboardsStats.os,
  };
  const formattedOsStats = Object.entries(os).reduce((acc, [key, value]) => {
    if (typeof value !== 'string') {
      // There are new fields reported now from the "os" property like "load", "memory", etc. They are objects.
      return acc;
    }
    return {
      ...acc,
      [`${key}s`]: [{ [key]: value, count: 1 }],
    };
  }, {});

  const version = serverVersion.replace(/-snapshot/i, ''); // Shouldn't we better maintain the -snapshot so we can differentiate between actual final releases and snapshots?

  // combine core stats (os types, saved objects) with plugin usage stats
  // organize the object into the same format as monitoring-enabled telemetry
  return {
    ...omit(opensearchDashboards, 'index'), // discard index
    count: 1,
    indices: 1,
    os: formattedOsStats,
    versions: [{ version, count: 1 }],
    plugins,
  };
}

export async function getOpenSearchDashboards(
  usageCollection: UsageCollectionSetup,
  callWithInternalUser: LegacyAPICaller,
  asInternalUser: OpenSearchClient
): Promise<OpenSearchDashboardsUsageStats> {
  const usage = await usageCollection.bulkFetch(callWithInternalUser, asInternalUser);
  return usageCollection.toObject(usage);
}
