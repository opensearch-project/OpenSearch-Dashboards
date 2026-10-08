/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLStreamSnapshot } from '../../../../../query_enhancements/common';
import {
  FieldValueFormatter,
  snapshotRowsToObjects,
  splitHighlightColumn,
} from './snapshot_to_result';

/**
 * Holds the rows a streaming run has fetched, and the cursor for the next window to request.
 *
 * Placement is decided by the window the engine says it served, not by `update_mode`. A completed
 * job reports REPLACE while still serving a single window, so treating that as a wholesale
 * replacement discards everything accumulated while the query ran. The window offset is
 * unambiguous: rows belong where the engine says they belong.
 *
 * The invariant is `nextOffset === rows.length` whenever rows form a prefix from 0, which is what
 * makes the next request a simple continuation.
 */
export class StreamRowAccumulator {
  private rows: Array<Record<string, unknown>> = [];
  private highlights: unknown[] = [];
  /** Bumped when rows are replaced, so synthesised row ids change with them. */
  private generation = 0;

  constructor(
    private readonly maxRows: number,
    private readonly formatter?: FieldValueFormatter
  ) {}

  public get heldRows(): Array<Record<string, unknown>> {
    return this.rows;
  }

  public get heldHighlights(): unknown[] {
    return this.highlights;
  }

  public get rowGeneration(): number {
    return this.generation;
  }

  /** Offset to request next: the first row not yet held. */
  public get nextOffset(): number {
    return this.rows.length;
  }

  public get isFull(): boolean {
    return this.rows.length >= this.maxRows;
  }

  /**
   * Absorbs a served window. Returns the number of rows added, which is 0 when the window is one
   * already held — a re-served page, which must not be counted twice.
   */
  absorb(
    snapshot: Pick<PPLStreamSnapshot, 'schema' | 'datarows' | 'window' | 'update_mode'>
  ): number {
    const incoming = snapshotRowsToObjects(snapshot, this.formatter);
    if (incoming.length === 0) return 0;
    const { highlights = [] } = splitHighlightColumn(snapshot);

    // Absent `window` means the engine did not say where these rows sit. The only safe reading is
    // "from the start", which is also what a pre-windowing backend meant by a bare snapshot.
    const at = snapshot.window?.offset ?? 0;

    if (at === 0) {
      // A fresh view of the result set from the beginning.
      const replacing = this.rows.length > 0;
      this.rows = incoming.slice(0, this.maxRows);
      this.highlights = highlights.slice(0, this.maxRows);
      if (replacing) this.generation += 1;
      return this.rows.length;
    }

    if (at < this.rows.length) {
      // Already held: a window served again, which appending would duplicate.
      return 0;
    }

    if (at > this.rows.length) {
      // A gap would make `nextOffset` lie about what is held, so the window is refused and the run
      // re-requests from `nextOffset`.
      return 0;
    }

    const room = this.maxRows - this.rows.length;
    const added = incoming.slice(0, room);
    this.rows = this.rows.concat(added);
    this.highlights = this.highlights.concat(highlights.slice(0, room));
    return added.length;
  }
}
