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

import { Observable, combineLatest, concat, of, timer } from 'rxjs';
import { startWith, map, mapTo, switchMap } from 'rxjs/operators';
import { ServiceStatus, ServiceStatusLevels } from '../status';
import { SavedObjectStatusMeta } from './types';
import { OpenSearchDashboardsMigratorStatus } from './migrations/opensearch_dashboards';

/**
 * Default used if a caller passes no `waitingTimeoutMs`. The production code
 * path plumbs `migrations.integrity.waitingTimeoutMs` through; this constant
 * only matters for tests and direct callers that skip config.
 *
 * Calibrated against observed batch-duration tails (see the design doc's
 * `batch-duration-findings.md`): a healthy `.kibana` batch was observed
 * blocked for ~177s on V2189945960 and ~41s on V2160069726 under cluster-
 * state-commit pressure. 10 minutes provides headroom for healthy large-
 * corpus migrations while still bounding the detection window for crashed
 * peers. Recalibrate post-deploy via the migration-waiting histogram.
 */
const FALLBACK_WAITING_TIMEOUT_MS = 600_000;

export const calculateStatus$ = (
  rawMigratorStatus$: Observable<OpenSearchDashboardsMigratorStatus>,
  opensearchStatus$: Observable<ServiceStatus>,
  waitingTimeoutMs: number = FALLBACK_WAITING_TIMEOUT_MS
): Observable<ServiceStatus<SavedObjectStatusMeta>> => {
  const migratorStatus$: Observable<ServiceStatus<SavedObjectStatusMeta>> = rawMigratorStatus$.pipe(
    // When the migrator sits in `waiting` past the configured timeout, emit
    // `critical` so `/api/status` rolls up red. switchMap resets the timer
    // whenever the migrator status changes, so oscillation is handled: once
    // we reach `running` or `completed`, the prior timer disposes. The
    // `critical` emission persists until the underlying status changes.
    switchMap((migrationStatus) => {
      if (migrationStatus.status === 'waiting') {
        const waiting: ServiceStatus<SavedObjectStatusMeta> = {
          level: ServiceStatusLevels.unavailable,
          summary: `SavedObjects service is waiting to start migrations`,
        };
        const critical: ServiceStatus<SavedObjectStatusMeta> = {
          level: ServiceStatusLevels.critical,
          summary:
            `SavedObjects service has been waiting for a peer migration for over ` +
            `${Math.round(waitingTimeoutMs / 1000)}s. This likely indicates a stuck or ` +
            `crashed migration. Inspect .kibana_* indices and consider deleting the ` +
            `partial destination index before restarting.`,
        };
        // Emit `waiting` immediately, then `critical` once the timeout elapses.
        // No further emissions — downstream distinctUntilChanged would dedupe
        // them anyway, but stopping the timer cleanly avoids needless work.
        return concat(of(waiting), timer(waitingTimeoutMs).pipe(mapTo(critical)));
      } else if (migrationStatus.status === 'running') {
        return of<ServiceStatus<SavedObjectStatusMeta>>({
          level: ServiceStatusLevels.unavailable,
          summary: `SavedObjects service is running migrations`,
        });
      }

      const statusCounts: SavedObjectStatusMeta['migratedIndices'] = { migrated: 0, skipped: 0 };
      if (migrationStatus.result) {
        migrationStatus.result.forEach(({ status }) => {
          statusCounts[status] = (statusCounts[status] ?? 0) + 1;
        });
      }

      return of<ServiceStatus<SavedObjectStatusMeta>>({
        level: ServiceStatusLevels.available,
        summary: `SavedObjects service has completed migrations and is available`,
        meta: {
          migratedIndices: statusCounts,
        },
      });
    }),
    startWith({
      level: ServiceStatusLevels.unavailable,
      summary: `SavedObjects service is waiting to start migrations`,
    } as ServiceStatus<SavedObjectStatusMeta>)
  );

  return combineLatest([opensearchStatus$, migratorStatus$]).pipe(
    map(([openSearchStatus, migratorStatus]) => {
      if (openSearchStatus.level >= ServiceStatusLevels.unavailable) {
        return {
          level: ServiceStatusLevels.unavailable,
          summary: `SavedObjects service is not available without a healthy OpenSearch connection`,
        };
      } else if (migratorStatus.level >= ServiceStatusLevels.unavailable) {
        // Pass through unavailable + critical escalation verbatim so status
        // rollup to overall `/api/status` keeps the worst-child semantics.
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
