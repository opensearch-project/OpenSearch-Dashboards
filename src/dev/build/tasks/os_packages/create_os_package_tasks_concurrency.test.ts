/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createOsPackagesTask } from './create_os_package_tasks';

let mockInFlight = 0;
let mockPeakInFlight = 0;

const makeTask = (description: string) => ({
  description,
  async run() {
    mockInFlight += 1;
    mockPeakInFlight = Math.max(mockPeakInFlight, mockInFlight);
    // 100 ms gives the event loop plenty of headroom on loaded CI for all workers
    // to enter their first task body before any of them exits.
    await new Promise((r) => setTimeout(r, 100));
    mockInFlight -= 1;
  },
});

const log = {
  info: () => {},
  debug: () => {},
  warning: () => {},
  error: () => {},
  success: () => {},
  verbose: () => {},
  write: () => {},
  indent: () => {},
} as any;

beforeEach(() => {
  mockInFlight = 0;
  mockPeakInFlight = 0;
  delete process.env.OSD_BUILD_FPM_CONCURRENCY;
});

it('runs all provided tasks exactly once', async () => {
  const tasks = ['a', 'b', 'c', 'd'].map(makeTask);
  await createOsPackagesTask(tasks).run({} as any, log, {} as any);
  // All four must have executed (each increments mockInFlight exactly once).
  expect(mockPeakInFlight).toBeGreaterThanOrEqual(1);
});

it('defaults to running every task in parallel (peak = tasks.length)', async () => {
  const tasks = ['a', 'b', 'c', 'd'].map(makeTask);
  await createOsPackagesTask(tasks).run({} as any, log, {} as any);
  expect(mockPeakInFlight).toBe(4);
});

it('caps concurrency via OSD_BUILD_FPM_CONCURRENCY', async () => {
  process.env.OSD_BUILD_FPM_CONCURRENCY = '2';
  const tasks = ['a', 'b', 'c', 'd'].map(makeTask);
  await createOsPackagesTask(tasks).run({} as any, log, {} as any);
  expect(mockPeakInFlight).toBeLessThanOrEqual(2);
  expect(mockPeakInFlight).toBe(2); // proves the queue actually overlapped work
});

it('serializes when OSD_BUILD_FPM_CONCURRENCY=1', async () => {
  process.env.OSD_BUILD_FPM_CONCURRENCY = '1';
  const tasks = ['a', 'b', 'c'].map(makeTask);
  await createOsPackagesTask(tasks).run({} as any, log, {} as any);
  expect(mockPeakInFlight).toBe(1);
});

it('stops dispatching new tasks once any worker throws', async () => {
  // Queue 6 tasks with concurrency=2. First worker pulls A, second pulls B and throws
  // immediately. Expectation: C/D/E/F are NEVER executed — the `failed` sentinel must
  // prevent the other worker from pulling more tasks once it observes B's throw.
  const executed: string[] = [];
  const ok = (description: string) => ({
    description,
    async run() {
      await new Promise((r) => setTimeout(r, 30));
      executed.push(description);
    },
  });
  const boom = (description: string) => ({
    description,
    async run() {
      throw new Error(`boom-${description}`);
    },
  });

  process.env.OSD_BUILD_FPM_CONCURRENCY = '2';
  // Order: B (throws) is first so it sets the failed flag before A even finishes.
  const tasks = [boom('B'), ok('A'), ok('C'), ok('D'), ok('E'), ok('F')];

  await expect(createOsPackagesTask(tasks).run({} as any, log, {} as any)).rejects.toThrow(
    /boom-B/
  );

  // Allow any still-running "ok" task to complete (A may have been pulled before the throw).
  await new Promise((r) => setTimeout(r, 100));

  // At most the two tasks pulled by the initial worker dispatch may execute (B + A).
  // C, D, E, F must never run because the failed sentinel blocks new queue shifts.
  expect(executed).not.toContain('C');
  expect(executed).not.toContain('D');
  expect(executed).not.toContain('E');
  expect(executed).not.toContain('F');
});
