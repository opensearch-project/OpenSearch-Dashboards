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
 * Holds the rows of a streaming query, capped at `maxRows`.
 *
 * Every snapshot carries all the rows found so far, so each one replaces what is held. The row
 * generation changes only when the new rows are not an extension of the held ones, so the table
 * keeps its rows mounted while a scan appends to them.
 */
export class StreamRowAccumulator {
  private rows: Array<Record<string, unknown>> = [];
  private highlights: unknown[] = [];
  private generation = 0;

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

  /** Replaces the held rows with the snapshot's. Returns the number of rows held. */
  absorb(snapshot: Pick<PPLStreamSnapshot, 'schema' | 'datarows'>): number {
    const incoming = snapshotRowsToObjects(snapshot, this.formatter());
    // A snapshot without rows yet (e.g. a step that needs all its input first) says nothing about
    // the rows already shown.
    if (incoming.length === 0) return this.rows.length;
    const { highlights = [] } = splitHighlightColumn(snapshot);

    const next = incoming.slice(0, this.maxRows);
    if (!isEqual(this.rows, next.slice(0, this.rows.length))) this.generation += 1;
    this.rows = next;
    this.highlights = highlights.slice(0, this.maxRows);
    return this.rows.length;
  }
}
