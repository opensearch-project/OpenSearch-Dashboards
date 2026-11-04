/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import type { PPLStreamSnapshot } from '../../../../../query_enhancements/common';
import {
  FieldValueFormatter,
  snapshotRowsToObjects,
  splitHighlightColumn,
} from './snapshot_to_result';

/**
 * Structural equality, to tell a real replacement from a re-served page. Deep, not reference: a
 * nested field value is a fresh object each poll, so `===` would always report a difference.
 */
const sameRows = (a: Array<Record<string, unknown>>, b: Array<Record<string, unknown>>): boolean =>
  isEqual(a, b);

/**
 * Holds the rows a streaming run has fetched, and the cursor for the next window to request.
 *
 * Placement follows the window the engine says it served, not `update_mode`: a completed job reports
 * REPLACE while serving a single window, so treating that as a wholesale replacement would discard
 * everything accumulated while the query ran.
 *
 * Invariant: `nextOffset === rows.length`.
 */
export class StreamRowAccumulator {
  private rows: Array<Record<string, unknown>> = [];
  private highlights: unknown[] = [];
  /** Bumped when rows are replaced, so synthesised row ids change with them. */
  private generation = 0;

  /** Read per snapshot, so the accumulator can be built before the formatter is resolved. */
  constructor(
    private readonly maxRows: number,
    private readonly formatter: () => FieldValueFormatter | undefined = () => undefined
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
    const incoming = snapshotRowsToObjects(snapshot, this.formatter());
    if (incoming.length === 0) return 0;
    const { highlights = [] } = splitHighlightColumn(snapshot);

    // No `window` means the engine did not say where these rows sit; read it as from the start.
    const at = snapshot.window?.offset ?? 0;

    if (at === 0) {
      const next = incoming.slice(0, this.maxRows);
      // Only a content change invalidates the synthesised row ids; the engine re-serves offset 0
      // every poll during the provisional phase, so bumping unconditionally would remount the
      // whole table each interval even when the rows are identical.
      if (this.rows.length > 0 && !sameRows(this.rows, next)) this.generation += 1;
      this.rows = next;
      this.highlights = highlights.slice(0, this.maxRows);
      return this.rows.length;
    }

    if (at < this.rows.length) {
      // Already held: a window served again, which appending would duplicate.
      return 0;
    }

    if (at > this.rows.length) {
      // A gap would make `nextOffset` lie about what is held, so refuse it and re-request.
      return 0;
    }

    const room = this.maxRows - this.rows.length;
    const added = incoming.slice(0, room);
    this.rows = this.rows.concat(added);
    this.highlights = this.highlights.concat(highlights.slice(0, room));
    return added.length;
  }
}
