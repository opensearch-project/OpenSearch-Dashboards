/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLStreamSnapshot } from '../../../../../query_enhancements/common';

/**
 * A stateful stand-in for the async PPL engine, for tests that need a realistic lifecycle rather
 * than a fixed sequence of canned snapshots. Like the real API, every response carries all the rows
 * found so far, and a `total` that grows as the query runs.
 */
export interface FakeStreamEngineOptions {
  /** Rows the query will ultimately match. */
  totalRows: number;
  /** Rows found per poll while running. Reaching `totalRows` ends the query. */
  commitPerPoll?: number;
  /** Rows already found when submit returns. */
  committedAtSubmit?: number;
  /** Omit the job id from submit, i.e. the query finished inside the submit timeout. */
  completeOnSubmit?: boolean;
}

export class FakeStreamEngine {
  private committed: number;
  private readonly totalRows: number;
  private readonly commitPerPoll: number;
  private readonly completeOnSubmit: boolean;

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

  /** Row `n` is identifiable, so a test can tell whether rows were dropped or repeated. */
  private rows(): unknown[][] {
    const out: unknown[][] = [];
    for (let n = 0; n < this.committed; n++) {
      out.push([`2026-09-15 10:00:00.${String(n % 1000).padStart(3, '0')}`, n]);
    }
    return out;
  }

  private snapshot(withId: boolean): PPLStreamSnapshot {
    const datarows = this.rows();
    return {
      ...(withId && { id: 'job-fake' }),
      status: this.done ? 'SUCCEEDED' : 'RUNNING',
      schema: [
        { name: '@timestamp', type: 'timestamp' },
        { name: 'event_id', type: 'int' },
      ],
      datarows,
      size: datarows.length,
      total: this.committed,
      progress: { fraction_done: this.done ? 1 : this.committed / this.totalRows },
    };
  }

  submit = jest.fn(async () => this.snapshot(!this.completeOnSubmit));

  poll = jest.fn(async (_args?: unknown) => {
    if (!this.done) this.committed = Math.min(this.committed + this.commitPerPoll, this.totalRows);
    return this.snapshot(true);
  });

  cancel = jest.fn(async () => undefined);
}
