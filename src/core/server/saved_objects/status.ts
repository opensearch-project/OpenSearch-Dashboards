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

import { Observable, combineLatest } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { ServiceStatus, ServiceStatusLevels } from '../status';
import { SavedObjectStatusMeta } from './types';
import { OpenSearchDashboardsMigratorStatus } from './migrations/opensearch_dashboards';

export const calculateStatus$ = (
  rawMigratorStatus$: Observable<OpenSearchDashboardsMigratorStatus>,
  opensearchStatus$: Observable<ServiceStatus>
): Observable<ServiceStatus<SavedObjectStatusMeta>> => {
  const migratorStatus$: Observable<ServiceStatus<SavedObjectStatusMeta>> = rawMigratorStatus$.pipe(
    map((migrationStatus) => {
      if (migrationStatus.status === 'waiting') {
        return {
          level: ServiceStatusLevels.unavailable,
          summary: `SavedObjects service is waiting to start migrations`,
        };
      } else if (migrationStatus.status === 'running') {
        return {
          level: ServiceStatusLevels.unavailable,
          summary: `SavedObjects service is running migrations`,
        };
      }

      const statusCounts: SavedObjectStatusMeta['migratedIndices'] = { migrated: 0, skipped: 0 };
      if (migrationStatus.result) {
        migrationStatus.result.forEach(({ status }) => {
          statusCounts[status] = (statusCounts[status] ?? 0) + 1;
        });
      }

      return {
        level: ServiceStatusLevels.available,
        summary: `SavedObjects service has completed migrations and is available`,
        meta: {
          migratedIndices: statusCounts,
        },
      };
    }),
    startWith({
      level: ServiceStatusLevels.unavailable,
      summary: `SavedObjects service is waiting to start migrations`,
    })
  );

  return combineLatest([opensearchStatus$, migratorStatus$]).pipe(
    map(([openSearchStatus, migratorStatus]) => {
      if (openSearchStatus.level >= ServiceStatusLevels.unavailable) {
        return {
          level: ServiceStatusLevels.unavailable,
          summary: `SavedObjects service is not available without a healthy OpenSearch connection`,
        };
      } else if (migratorStatus.level === ServiceStatusLevels.unavailable) {
        return migratorStatus;
      } else if (openSearchStatus.level === ServiceStatusLevels.degraded) {
        return {
          level: openSearchStatus.level,
          summary: `SavedObjects service is degraded due to OpenSearch: [${openSearchStatus.summary}]`,
        };
      } else {
        return migratorStatus;
      }
    })
  );
};
