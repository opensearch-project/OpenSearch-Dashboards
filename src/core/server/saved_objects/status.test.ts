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

import { of, Observable, Subject } from 'rxjs';
import { ServiceStatus, ServiceStatusLevels } from '../status';
import { calculateStatus$ } from './status';
import { take } from 'rxjs/operators';
import { OpenSearchDashboardsMigratorStatus } from './migrations/opensearch_dashboards';

describe('calculateStatus$', () => {
  const expectUnavailableDueToOpenSearch = (status$: Observable<ServiceStatus>) =>
    expect(status$.pipe(take(1)).toPromise()).resolves.toEqual({
      level: ServiceStatusLevels.unavailable,
      summary: `SavedObjects service is not available without a healthy OpenSearch connection`,
    });

  const expectUnavailableDueToMigrations = (status$: Observable<ServiceStatus>) =>
    expect(status$.pipe(take(1)).toPromise()).resolves.toEqual({
      level: ServiceStatusLevels.unavailable,
      summary: `SavedObjects service is waiting to start migrations`,
    });

  describe('when opensearch is unavailable', () => {
    const openSearchStatus$ = of<ServiceStatus>({
      level: ServiceStatusLevels.unavailable,
      summary: 'xxx',
    });

    it('is unavailable before migrations have ran', async () => {
      await expectUnavailableDueToOpenSearch(calculateStatus$(of<any>(), openSearchStatus$));
    });
    it('is unavailable after migrations have ran', async () => {
      await expectUnavailableDueToOpenSearch(
        calculateStatus$(of({ status: 'completed', result: [] }), openSearchStatus$)
      );
    });
  });

  describe('when opensearch is critical', () => {
    const openSearchStatus$ = of<ServiceStatus>({
      level: ServiceStatusLevels.critical,
      summary: 'xxx',
    });

    it('is unavailable before migrations have ran', async () => {
      await expectUnavailableDueToOpenSearch(calculateStatus$(of<any>(), openSearchStatus$));
    });
    it('is unavailable after migrations have ran', async () => {
      await expectUnavailableDueToOpenSearch(
        calculateStatus$(
          of({ status: 'completed', result: [{ status: 'migrated' } as any] }),
          openSearchStatus$
        )
      );
    });
  });

  describe('when opensearch is available', () => {
    const openSearchStatus$ = of<ServiceStatus>({
      level: ServiceStatusLevels.available,
      summary: 'Available',
    });

    it('is unavailable before migrations have ran', async () => {
      await expectUnavailableDueToMigrations(calculateStatus$(of<any>(), openSearchStatus$));
    });
    it('is unavailable while migrations are running', async () => {
      await expect(
        calculateStatus$(of({ status: 'running' }), openSearchStatus$)
          .pipe(take(2))
          .toPromise()
      ).resolves.toEqual({
        level: ServiceStatusLevels.unavailable,
        summary: `SavedObjects service is running migrations`,
      });
    });
    it('is available after migrations have ran', async () => {
      await expect(
        calculateStatus$(
          of({ status: 'completed', result: [{ status: 'skipped' }, { status: 'patched' }] }),
          openSearchStatus$
        )
          .pipe(take(2))
          .toPromise()
      ).resolves.toEqual({
        level: ServiceStatusLevels.available,
        summary: `SavedObjects service has completed migrations and is available`,
        meta: {
          migratedIndices: {
            migrated: 0,
            patched: 1,
            skipped: 1,
          },
        },
      });
    });
  });

  describe('when opensearch is degraded', () => {
    const openSearchStatus$ = of<ServiceStatus>({
      level: ServiceStatusLevels.degraded,
      summary: 'xxx',
    });

    it('is unavailable before migrations have ran', async () => {
      await expectUnavailableDueToMigrations(calculateStatus$(of<any>(), openSearchStatus$));
    });
    it('is degraded after migrations have ran', async () => {
      await expect(
        calculateStatus$(
          of<any>([{ status: 'skipped' }]),
          openSearchStatus$
        )
          .pipe(take(2))
          .toPromise()
      ).resolves.toEqual({
        level: ServiceStatusLevels.degraded,
        summary: 'SavedObjects service is degraded due to OpenSearch: [xxx]',
      });
    });
  });

  // `waiting -> critical` escalation behavior on the saved-objects migrator
  // status observable. These tests use fake timers so virtual time can be
  // advanced deterministically past `waitingTimeoutMs`. The suite asserts:
  //   - U4.1/U4.2: waiting under/over the timeout
  //   - U4.3/U4.4: `running` / `completed` dispose the pending timer (switchMap)
  //   - U4.5: fallback to FALLBACK_WAITING_TIMEOUT_MS when caller omits config
  //   - U4.6: `running` never escalates regardless of how long it persists,
  //           because the timeout applies only to the `waiting` state
  //   - U4.7: waiting -> running -> waiting re-arms the timer from zero
  describe('waiting-state escalation', () => {
    const openSearchStatus$ = of<ServiceStatus>({
      level: ServiceStatusLevels.available,
      summary: 'Available',
    });

    beforeEach(() => {
      jest.useFakeTimers('modern');
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    const collectLevels = async (
      rawMigratorStatus$: Observable<OpenSearchDashboardsMigratorStatus>,
      tickMs: number,
      waitingTimeoutMs?: number
    ): Promise<ServiceStatusLevels[]> => {
      const emissions: ServiceStatus[] = [];
      const sub = calculateStatus$(
        rawMigratorStatus$,
        openSearchStatus$,
        waitingTimeoutMs
      ).subscribe((s) => emissions.push(s));
      jest.advanceTimersByTime(tickMs);
      await Promise.resolve();
      sub.unsubscribe();
      return emissions.map((e) => e.level);
    };

    it('U4.1 stays unavailable during short waits (< waitingTimeoutMs)', async () => {
      const levels = await collectLevels(of({ status: 'waiting' } as any), 500, 1_000);
      expect(levels).toContain(ServiceStatusLevels.unavailable);
      expect(levels).not.toContain(ServiceStatusLevels.critical);
    });

    it('U4.2 escalates to critical after waitingTimeoutMs', async () => {
      const levels = await collectLevels(of({ status: 'waiting' } as any), 1_500, 1_000);
      expect(levels).toContain(ServiceStatusLevels.unavailable);
      expect(levels).toContain(ServiceStatusLevels.critical);
    });

    it('U4.3 transition waiting -> running disposes the pending timer (no critical emitted)', async () => {
      const subject$ = new Subject<OpenSearchDashboardsMigratorStatus>();
      const emissions: ServiceStatus[] = [];
      const sub = calculateStatus$(
        subject$.asObservable(),
        openSearchStatus$,
        1_000
      ).subscribe((s) => emissions.push(s));
      subject$.next({ status: 'waiting' } as any);
      jest.advanceTimersByTime(500);
      subject$.next({ status: 'running' } as any);
      jest.advanceTimersByTime(2_000);
      await Promise.resolve();
      sub.unsubscribe();

      const levels = emissions.map((e) => e.level);
      expect(levels).toContain(ServiceStatusLevels.unavailable);
      expect(levels).not.toContain(ServiceStatusLevels.critical);
    });

    it('U4.4 transition waiting -> completed disposes the pending timer (no critical emitted)', async () => {
      const subject$ = new Subject<OpenSearchDashboardsMigratorStatus>();
      const emissions: ServiceStatus[] = [];
      const sub = calculateStatus$(
        subject$.asObservable(),
        openSearchStatus$,
        1_000
      ).subscribe((s) => emissions.push(s));
      subject$.next({ status: 'waiting' } as any);
      jest.advanceTimersByTime(500);
      subject$.next({ status: 'completed', result: [] } as any);
      jest.advanceTimersByTime(2_000);
      await Promise.resolve();
      sub.unsubscribe();

      const levels = emissions.map((e) => e.level);
      expect(levels).toContain(ServiceStatusLevels.available);
      expect(levels).not.toContain(ServiceStatusLevels.critical);
    });

    it('U4.5 uses FALLBACK_WAITING_TIMEOUT_MS (600s) when no waitingTimeoutMs is plumbed', async () => {
      const levelsBefore = await collectLevels(of({ status: 'waiting' } as any), 5 * 60 * 1_000);
      expect(levelsBefore).not.toContain(ServiceStatusLevels.critical);

      const levelsAfter = await collectLevels(of({ status: 'waiting' } as any), 11 * 60 * 1_000);
      expect(levelsAfter).toContain(ServiceStatusLevels.critical);
    });

    it('U4.6 `running` never escalates regardless of how long it persists', async () => {
      // The timeout applies only while the migrator is in `waiting`. The
      // `running` state covers the scroll-copy + bulk-write phase, which can
      // persist longer than `waitingTimeoutMs` on a large corpus under
      // cluster-state pressure, and must not be escalated.
      const subject$ = new Subject<OpenSearchDashboardsMigratorStatus>();
      const emissions: ServiceStatus[] = [];
      const sub = calculateStatus$(
        subject$.asObservable(),
        openSearchStatus$,
        1_000
      ).subscribe((s) => emissions.push(s));
      subject$.next({ status: 'running' } as any);
      jest.advanceTimersByTime(10 * 1_000);
      await Promise.resolve();
      sub.unsubscribe();

      const levels = emissions.map((e) => e.level);
      expect(levels).not.toContain(ServiceStatusLevels.critical);
    });

    it('U4.7 waiting -> running -> waiting re-arms the timer from zero on re-entry', async () => {
      // switchMap disposes the prior inner observable on each upstream
      // emission and subscribes fresh. On re-entry to `waiting` the timer
      // starts from zero, not from the first waiting's remaining budget.
      const subject$ = new Subject<OpenSearchDashboardsMigratorStatus>();
      const emissions: ServiceStatus[] = [];
      const sub = calculateStatus$(
        subject$.asObservable(),
        openSearchStatus$,
        1_000
      ).subscribe((s) => emissions.push(s));

      subject$.next({ status: 'waiting' } as any);
      jest.advanceTimersByTime(800);

      subject$.next({ status: 'running' } as any);
      jest.advanceTimersByTime(100);

      subject$.next({ status: 'waiting' } as any);
      // Advance 500ms. If the timer had carried over from the first waiting
      // (total 800+500=1_300 > 1_000), we'd escalate here. We should NOT.
      jest.advanceTimersByTime(500);

      const midLevels = emissions.map((e) => e.level);
      expect(midLevels).not.toContain(ServiceStatusLevels.critical);

      // Advance past the fresh 1_000ms budget from re-entry — escalation fires.
      jest.advanceTimersByTime(600);
      await Promise.resolve();
      sub.unsubscribe();

      const finalLevels = emissions.map((e) => e.level);
      expect(finalLevels).toContain(ServiceStatusLevels.critical);
    });
  });
});
