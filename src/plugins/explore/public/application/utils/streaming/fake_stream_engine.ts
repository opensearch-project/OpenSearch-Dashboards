/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLStreamSnapshot } from '../../../../query_enhancements/common';

/**
 * A stateful stand-in for the async PPL engine, for tests that need the client driven through a
 * realistic lifecycle rather than a fixed sequence of canned snapshots.
 *
 * Per-call mocks cannot express the behaviour that matters here — that a window is served from the
 * offset the client asked for — so they let bugs through where the client requests the wrong window
 * or fails to advance. This honours `offset` and `count`, and reproduces the two envelope details
 * that are easy to get wrong:
 *
 *  - while running it reports `update_mode: APPEND` and a `total` that grows as rows are committed;
 *  - once finished it reports `update_mode: REPLACE`, because the final result is a whole result set
 *    rather than an increment, while still serving only the requested window.
 */
export interface FakeStreamEngineOptions {
  /** Rows the query will ultimately match. */
  totalRows: number;
  /** Rows committed per poll while running. Reaching `totalRows` ends the query. */
  commitPerPoll?: number;
  /** Rows already committed when submit returns; 0 means submit serves nothing. */
  committedAtSubmit?: number;
  /** Omit the job id from submit, i.e. the query finished inside the submit timeout. */
  completeOnSubmit?: boolean;
}

export class FakeStreamEngine {
  private committed: number;
  private readonly totalRows: number;
  private readonly commitPerPoll: number;
  private readonly completeOnSubmit: boolean;
  /** Every window served, so a test can assert what the client actually asked for. */
  readonly servedWindows: Array<{ offset: number; count: number }> = [];

  constructor({
    totalRows,
    commitPerPoll = 10,
    committedAtSubmit = 0,
    completeOnSubmit = false,
  }: FakeStreamEngineOptions) {
    this.totalRows = totalRows;
    this.commitPerPoll = commitPerPoll;
    this.completeOnSubmit = completeOnSubmit;
    this.committed = completeOnSubmit ? totalRows : Math.min(committedAtSubmit, totalRows);
  }

  private get done(): boolean {
    return this.committed >= this.totalRows;
  }

  /** Row `n` is identifiable, so a test can tell which window it came from. */
  private rows(offset: number, count: number): unknown[][] {
    const end = Math.min(offset + count, this.committed);
    const out: unknown[][] = [];
    for (let n = offset; n < end; n++) {
      out.push([`2026-09-15 10:00:00.${String(n % 1000).padStart(3, '0')}`, n]);
    }
    return out;
  }

  private snapshot(offset: number, count: number, withId: boolean): PPLStreamSnapshot {
    const datarows = this.rows(offset, count);
    return {
      ...(withId && { id: 'job-fake' }),
      status: this.done ? 'SUCCEEDED' : 'RUNNING',
      update_mode: this.done ? 'REPLACE' : 'APPEND',
      schema: [
        { name: '@timestamp', type: 'timestamp' },
        { name: 'event_id', type: 'int' },
      ],
      datarows,
      size: datarows.length,
      total: this.committed,
      window: { offset, count },
      progress: { fraction_done: this.done ? 1 : this.committed / this.totalRows },
    } as unknown as PPLStreamSnapshot;
  }

  submit = jest.fn(async () => this.snapshot(0, this.commitPerPoll, !this.completeOnSubmit));

  poll = jest.fn(async ({ offset = 0, count = 10 }: { offset?: number; count?: number }) => {
    // Commit more rows only while the query is running, so paging after it finishes does not
    // extend it.
    if (!this.done) this.committed = Math.min(this.committed + this.commitPerPoll, this.totalRows);
    this.servedWindows.push({ offset, count });
    return this.snapshot(offset, count, true);
  });

  cancel = jest.fn(async () => undefined);
}
